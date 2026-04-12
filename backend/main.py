import os
import uuid
from datetime import datetime, timezone
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


class ProjectUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    client_name: str | None = None
    client_email: str | None = None


class LogUpdate(BaseModel):
    note: str | None = None
    photo_urls: list[str] | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TradeLogCreate(BaseModel):
    project_id: str
    trade_company: str
    work_description: str
    is_issue: bool = False
    issue_description: str | None = None
    photo_urls: list[str] = []


class TradeLogUpdate(BaseModel):
    trade_company: str | None = None
    work_description: str | None = None
    is_issue: bool | None = None
    issue_description: str | None = None
    photo_urls: list[str] | None = None


class PunchListCreate(BaseModel):
    project_id: str
    description: str
    trade_responsible: str | None = None
    status: str = "open"
    priority: str = "medium"
    photo_urls: list[str] = []
    due_date: str | None = None
    notes: str | None = None


class PunchListUpdate(BaseModel):
    description: str | None = None
    trade_responsible: str | None = None
    status: str | None = None
    priority: str | None = None
    photo_urls: list[str] | None = None
    due_date: str | None = None
    notes: str | None = None
    completed_at: str | None = None


# --- Helpers ---

def extract_storage_filename(url: str) -> str | None:
    """Extract the storage filename from a Supabase public URL."""
    if not url:
        return None
    try:
        parts = url.split("/site-photos/")
        if len(parts) == 2:
            return parts[1]
    except Exception:
        pass
    return None


def normalize_photo_urls(log: dict) -> list[str]:
    """Return a unified photo_urls list, falling back to legacy photo_url for backward compat."""
    urls = list(log.get("photo_urls") or [])
    if not urls and log.get("photo_url"):
        urls = [log["photo_url"]]
    return urls


def all_photo_filenames(log: dict) -> list[str]:
    """Collect all storage filenames across both photo_url and photo_urls fields."""
    all_urls = set(normalize_photo_urls(log))
    if log.get("photo_url"):
        all_urls.add(log["photo_url"])
    return [f for f in (extract_storage_filename(u) for u in all_urls) if f]


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
        "refresh_token": session.refresh_token,
        "email": user.email,
        "role": role,
    }


@app.post("/api/auth/refresh")
def refresh_token(body: RefreshRequest):
    try:
        response = supabase.auth.refresh_session(body.refresh_token)
        session = response.session
        if not session:
            raise HTTPException(status_code=401, detail="Could not refresh session")
        return {
            "token": session.access_token,
            "refresh_token": session.refresh_token,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Could not refresh session")


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
    try:
        result = supabase.table("projects").insert(data).execute()
    except Exception as e:
        print(f"[create_project] Supabase insert error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create project")
    if not result.data:
        print(f"[create_project] Insert returned no data. Result: {result}")
        raise HTTPException(status_code=500, detail="Failed to create project")
    return result.data[0]


@app.get("/api/projects")
def get_projects(current_user: dict = Depends(get_current_user)):
    result = supabase.table("projects").select("*").order("created_at", desc=True).execute()
    return result.data


@app.get("/api/projects/{project_id}")
def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project_result = supabase.table("projects").select("*").eq("id", project_id).single().execute()
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    project = project_result.data

    logs_result = (
        supabase.table("logs")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )

    logs = logs_result.data
    for log in logs:
        log["photo_urls"] = normalize_photo_urls(log)
    project["logs"] = logs
    return project


@app.patch("/api/projects/{project_id}")
def update_project(project_id: str, body: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("projects").update(updates).eq("id", project_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return result.data[0]


@app.delete("/api/projects/{project_id}", status_code=204)
def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    project_result = supabase.table("projects").select("id").eq("id", project_id).maybe_single().execute()
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    logs_result = supabase.table("logs").select("photo_url, photo_urls").eq("project_id", project_id).execute()
    if logs_result.data:
        filenames = []
        for log in logs_result.data:
            filenames.extend(all_photo_filenames(log))
        if filenames:
            try:
                supabase.storage.from_("site-photos").remove(filenames)
            except Exception as e:
                print(f"[delete_project] Storage cleanup error: {e}")
    supabase.table("logs").delete().eq("project_id", project_id).execute()
    supabase.table("projects").delete().eq("id", project_id).execute()


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


@app.patch("/api/logs/{log_id}")
def update_log(log_id: str, body: LogUpdate, current_user: dict = Depends(get_current_user)):
    log_result = (
        supabase.table("logs")
        .select("*")
        .eq("id", log_id)
        .maybe_single()
        .execute()
    )
    if not log_result.data:
        raise HTTPException(status_code=404, detail="Log not found")
    log = log_result.data
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = supabase.table("logs").update(updates).eq("id", log_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Log not found")
    return result.data[0]


@app.delete("/api/logs/{log_id}", status_code=204)
def delete_log(log_id: str, current_user: dict = Depends(get_current_user)):
    log_result = (
        supabase.table("logs")
        .select("*")
        .eq("id", log_id)
        .maybe_single()
        .execute()
    )
    if not log_result.data:
        raise HTTPException(status_code=404, detail="Log not found")
    log = log_result.data
    filenames = all_photo_filenames(log)
    if filenames:
        try:
            supabase.storage.from_("site-photos").remove(filenames)
        except Exception as e:
            print(f"[delete_log] Storage cleanup error: {e}")
    supabase.table("logs").delete().eq("id", log_id).execute()


# --- Public share endpoint ---

@app.get("/api/projects/share/{share_token}")
def get_project_by_share_token(share_token: str):
    project_result = (
        supabase.table("projects")
        .select("*")
        .eq("share_token", share_token)
        .maybe_single()
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
    logs = logs_result.data
    for log in logs:
        log["photo_urls"] = normalize_photo_urls(log)
    project["logs"] = logs
    return project


# --- Trade Logs ---

@app.get("/api/trade-logs")
def get_trade_logs(
    project_id: str | None = None,
    is_issue: bool | None = None,
    current_user: dict = Depends(get_current_user),
):
    query = supabase.table("trade_logs").select("*").order("created_at", desc=True)
    if project_id:
        query = query.eq("project_id", project_id)
    if is_issue is not None:
        query = query.eq("is_issue", is_issue)
    result = query.execute()
    return result.data


@app.post("/api/trade-logs", status_code=201)
def create_trade_log(body: TradeLogCreate, current_user: dict = Depends(get_current_user)):
    data = body.model_dump()
    data["logged_by"] = current_user["id"]
    result = supabase.table("trade_logs").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create trade log")
    return result.data[0]


@app.patch("/api/trade-logs/{log_id}")
def update_trade_log(log_id: str, body: TradeLogUpdate, current_user: dict = Depends(get_current_user)):
    existing = supabase.table("trade_logs").select("id").eq("id", log_id).maybe_single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Trade log not found")
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = supabase.table("trade_logs").update(updates).eq("id", log_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Trade log not found")
    return result.data[0]


@app.delete("/api/trade-logs/{log_id}", status_code=204)
def delete_trade_log(log_id: str, current_user: dict = Depends(get_current_user)):
    existing = supabase.table("trade_logs").select("id").eq("id", log_id).maybe_single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Trade log not found")
    supabase.table("trade_logs").delete().eq("id", log_id).execute()


# --- Punch List ---

@app.get("/api/punch-list")
def get_punch_list(
    project_id: str | None = None,
    status: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    query = supabase.table("punch_list_items").select("*").order("created_at", desc=True)
    if project_id:
        query = query.eq("project_id", project_id)
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return result.data


@app.post("/api/punch-list", status_code=201)
def create_punch_list_item(body: PunchListCreate, current_user: dict = Depends(get_current_user)):
    data = body.model_dump()
    result = supabase.table("punch_list_items").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create punch list item")
    return result.data[0]


@app.patch("/api/punch-list/{item_id}")
def update_punch_list_item(item_id: str, body: PunchListUpdate, current_user: dict = Depends(get_current_user)):
    existing = supabase.table("punch_list_items").select("id, status").eq("id", item_id).maybe_single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Punch list item not found")
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    # Auto-set completed_at when status changes to completed
    if updates.get("status") == "completed" and "completed_at" not in updates:
        updates["completed_at"] = datetime.now(timezone.utc).isoformat()
    elif updates.get("status") in ("open", "in_progress"):
        updates["completed_at"] = None
    result = supabase.table("punch_list_items").update(updates).eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Punch list item not found")
    return result.data[0]


@app.delete("/api/punch-list/{item_id}", status_code=204)
def delete_punch_list_item(item_id: str, current_user: dict = Depends(get_current_user)):
    existing = supabase.table("punch_list_items").select("id").eq("id", item_id).maybe_single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Punch list item not found")
    supabase.table("punch_list_items").delete().eq("id", item_id).execute()


# --- Daily Report ---

@app.get("/api/daily-report/{project_id}")
def get_daily_report(
    project_id: str,
    date: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    if date is None:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    day_start = f"{date}T00:00:00+00:00"
    day_end = f"{date}T23:59:59+00:00"

    project_result = supabase.table("projects").select("id, name, address").eq("id", project_id).maybe_single().execute()
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    progress_logs = (
        supabase.table("logs")
        .select("*")
        .eq("project_id", project_id)
        .gte("created_at", day_start)
        .lte("created_at", day_end)
        .order("created_at")
        .execute()
    ).data

    trade_logs = (
        supabase.table("trade_logs")
        .select("*")
        .eq("project_id", project_id)
        .gte("created_at", day_start)
        .lte("created_at", day_end)
        .order("created_at")
        .execute()
    ).data

    punch_activity = (
        supabase.table("punch_list_items")
        .select("*")
        .eq("project_id", project_id)
        .gte("created_at", day_start)
        .lte("created_at", day_end)
        .order("created_at")
        .execute()
    ).data

    for log in progress_logs:
        log["photo_urls"] = normalize_photo_urls(log)

    return {
        "project": project_result.data,
        "date": date,
        "progress_logs": progress_logs,
        "trade_logs": trade_logs,
        "punch_activity": punch_activity,
    }


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
