import os
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI(title="SiteTracker API")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://site-tracker-five.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# --- Schemas ---

class ProjectCreate(BaseModel):
    name: str
    address: str
    client_name: str
    client_email: str


class LogCreate(BaseModel):
    project_id: str
    note: str
    photo_url: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


# --- Auth dependency ---

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    role_result = (
        supabase.table("users")
        .select("role")
        .eq("id", user.id)
        .maybe_single()
        .execute()
    )
    role = "superintendent"
    if role_result and role_result.data:
        role = role_result.data.get("role", "superintendent")

    return {"id": user.id, "email": user.email, "role": role}


# --- Auth endpoints ---

@app.post("/api/auth/login")
def login(body: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
        session = response.session
        user = response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    role_result = (
        supabase.table("users")
        .select("role")
        .eq("id", user.id)
        .maybe_single()
        .execute()
    )
    role = "superintendent"
    if role_result and role_result.data:
        role = role_result.data.get("role", "superintendent")

    return {
        "token": session.access_token,
        "email": user.email,
        "role": role,
    }


@app.post("/api/auth/logout")
def logout(current_user: dict = Depends(get_current_user)):
    supabase.auth.sign_out()
    return {"message": "Logged out"}


@app.get("/api/auth/me")
def me(current_user: dict = Depends(get_current_user)):
    return {"email": current_user["email"], "role": current_user["role"]}


# --- Projects ---

@app.post("/api/projects", status_code=201)
def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    share_token = str(uuid.uuid4())
    data = {
        "name": project.name,
        "address": project.address,
        "client_name": project.client_name,
        "client_email": project.client_email,
        "share_token": share_token,
        "superintendent_id": current_user["id"],
    }
    result = supabase.table("projects").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create project")
    return result.data[0]


@app.get("/api/projects")
def get_projects(current_user: dict = Depends(get_current_user)):
    query = supabase.table("projects").select("*").order("created_at", desc=True)
    if current_user["role"] != "admin":
        query = query.eq("superintendent_id", current_user["id"])
    result = query.execute()
    return result.data


@app.get("/api/projects/{project_id}")
def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project_result = supabase.table("projects").select("*").eq("id", project_id).single().execute()
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    project = project_result.data
    if current_user["role"] != "admin" and project.get("superintendent_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this project")

    logs_result = (
        supabase.table("logs")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )

    project["logs"] = logs_result.data
    return project


# --- Logs ---

@app.post("/api/logs", status_code=201)
def create_log(log: LogCreate, current_user: dict = Depends(get_current_user)):
    data = {
        "project_id": log.project_id,
        "note": log.note,
        "photo_url": log.photo_url,
    }
    result = supabase.table("logs").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create log entry")
    return result.data[0]


# --- Public share endpoint ---

@app.get("/api/projects/share/{share_token}")
def get_project_by_share_token(share_token: str):
    project_result = (
        supabase.table("projects")
        .select("*")
        .eq("share_token", share_token)
        .single()
        .execute()
    )
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    logs_result = (
        supabase.table("logs")
        .select("*")
        .eq("project_id", project_result.data["id"])
        .order("created_at", desc=True)
        .execute()
    )

    project = project_result.data
    project["logs"] = logs_result.data
    return project


# --- Photo upload ---

@app.post("/api/upload")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"

    contents = await file.read()

    supabase.storage.from_("site-photos").upload(
        path=filename,
        file=contents,
        file_options={"content-type": file.content_type or "image/jpeg"},
    )

    public_url = supabase.storage.from_("site-photos").get_public_url(filename)
    return {"url": public_url}
