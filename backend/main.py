import os
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI(title="SiteTracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# --- Projects ---

@app.post("/api/projects", status_code=201)
def create_project(project: ProjectCreate):
    share_token = str(uuid.uuid4())
    data = {
        "name": project.name,
        "address": project.address,
        "client_name": project.client_name,
        "client_email": project.client_email,
        "share_token": share_token,
    }
    result = supabase.table("projects").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create project")
    return result.data[0]


@app.get("/api/projects")
def get_projects():
    result = supabase.table("projects").select("*").order("created_at", desc=True).execute()
    return result.data


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    project_result = supabase.table("projects").select("*").eq("id", project_id).single().execute()
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    logs_result = (
        supabase.table("logs")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )

    project = project_result.data
    project["logs"] = logs_result.data
    return project


# --- Logs ---

@app.post("/api/logs", status_code=201)
def create_log(log: LogCreate):
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
async def upload_photo(file: UploadFile = File(...)):
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
