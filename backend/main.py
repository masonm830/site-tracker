import os
import uuid
import json
import urllib.request
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_FROM_EMAIL = os.getenv("FROM_EMAIL", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")

PHOENIX_TZ = ZoneInfo("America/Phoenix")

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
    weekly_email_enabled: bool = True


class LogCreate(BaseModel):
    project_id: str
    note: str
    photo_url: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    client_name: str | None = None
    client_email: str | None = None
    weekly_email_enabled: bool | None = None


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


# --- Weather ---

WEATHER_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=33.4484&longitude=-112.0740"
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
    "&daily=weather_code,temperature_2m_max,temperature_2m_min"
    "&temperature_unit=fahrenheit&wind_speed_unit=mph"
    "&forecast_days=3&timezone=America%2FPhoenix"
)


def _weather_description(code: int) -> str:
    if code == 0:
        return "Clear sky"
    if code <= 3:
        return "Partly cloudy"
    if code <= 48:
        return "Foggy"
    if code <= 67:
        return "Drizzle / Rain"
    if code <= 77:
        return "Snow"
    if code <= 82:
        return "Rain showers"
    return "Thunderstorm"


@app.get("/api/weather")
def get_weather():
    try:
        with urllib.request.urlopen(WEATHER_URL, timeout=10) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"[get_weather] Error: {e}")
        raise HTTPException(status_code=503, detail="Weather service unavailable")

    current = data["current"]
    daily = data["daily"]
    code = int(current["weather_code"])

    forecast = []
    for i in range(3):
        day_date = daily["time"][i]
        day_dt = datetime.strptime(day_date, "%Y-%m-%d")
        if i == 0:
            day_label = "Today"
        elif i == 1:
            day_label = "Tomorrow"
        else:
            day_label = day_dt.strftime("%A")
        forecast.append({
            "date": day_date,
            "day": day_label,
            "high": round(daily["temperature_2m_max"][i]),
            "low": round(daily["temperature_2m_min"][i]),
            "weather_code": int(daily["weather_code"][i]),
            "description": _weather_description(int(daily["weather_code"][i])),
        })

    return {
        "current": {
            "temp": round(current["temperature_2m"]),
            "humidity": int(current["relative_humidity_2m"]),
            "wind_speed": round(current["wind_speed_10m"]),
            "weather_code": code,
            "description": _weather_description(code),
        },
        "forecast": forecast,
    }


# --- Email helpers ---

def _day_range_utc(date_az: datetime):
    """Return UTC ISO strings for start and end of a Phoenix-timezone day."""
    start = datetime(date_az.year, date_az.month, date_az.day, 0, 0, 0, tzinfo=PHOENIX_TZ)
    end = datetime(date_az.year, date_az.month, date_az.day, 23, 59, 59, tzinfo=PHOENIX_TZ)
    return start.astimezone(timezone.utc).isoformat(), end.astimezone(timezone.utc).isoformat()


def _send_email(to_email: str, subject: str, html: str, reply_to: str | None = None):
    if not BREVO_API_KEY or not BREVO_FROM_EMAIL:
        print(f"[email] Brevo not configured — skipping email to {to_email}")
        return
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = BREVO_API_KEY
    api = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        sender={"email": BREVO_FROM_EMAIL},
        to=[{"email": to_email}],
        reply_to={"email": reply_to} if reply_to else None,
        subject=subject,
        html_content=html,
    )
    try:
        api.send_transac_email(send_smtp_email)
        print(f"[email] Sent '{subject}' to {to_email}")
    except ApiException as e:
        print(f"[email] Brevo error: {e}")


def _build_daily_report_html(date_str: str, progress_logs, trade_logs, punch_items, project_map: dict) -> str:
    def proj(pid): return project_map.get(pid, {}).get("name", "Unknown Project")

    def section(title, color, rows_html):
        return f"""
        <div style="margin-bottom:28px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;
                      color:{color};border-left:3px solid {color};padding-left:10px;margin-bottom:12px;">
            {title}
          </div>
          {rows_html if rows_html else '<p style="font-size:13px;color:#94a3b8;margin:0;">No activity today.</p>'}
        </div>"""

    def log_row(note, project, extra=""):
        return f"""
        <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:2px;">{project}</div>
          <div style="font-size:13px;color:#374151;line-height:1.5;">{note}</div>
          {f'<div style="font-size:11px;color:#94a3b8;margin-top:4px;">{extra}</div>' if extra else ""}
        </div>"""

    progress_rows = "".join(
        log_row(l.get("note", "—"), proj(l["project_id"]),
                f'{len(l.get("photo_urls") or [])} photo(s)' if l.get("photo_urls") else "")
        for l in progress_logs
    )
    trade_rows = "".join(
        log_row(
            f'<b>{l["trade_company"]}</b>: {l["work_description"]}',
            proj(l["project_id"]),
            "⚠️ Issue logged" if l.get("is_issue") else ""
        )
        for l in trade_logs
    )
    punch_rows = "".join(
        log_row(l["description"], proj(l["project_id"]),
                f'Status: {l.get("status","open").replace("_"," ").title()}')
        for l in punch_items
    )

    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;
              box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0f172a;padding:24px 32px;">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">SiteTracker</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Daily Report — {date_str}</div>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:28px;font-weight:800;color:#3b82f6;">{len(progress_logs)}</div>
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Progress Logs</div>
          </td>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:28px;font-weight:800;color:#f59e0b;">{len(trade_logs)}</div>
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Trade Logs</div>
          </td>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:28px;font-weight:800;color:#10b981;">{len(punch_items)}</div>
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Punch Items</div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:28px 32px;">
      {section("Daily Logs", "#3b82f6", progress_rows)}
      {section("Trade Activity", "#f59e0b", trade_rows)}
      {section("Punch List", "#10b981", punch_rows)}
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;
                font-size:11px;color:#94a3b8;text-align:center;">
      SiteTracker — generated {date_str}
    </div>
  </div>
</body>
</html>"""


def _build_client_email_html(project: dict, logs: list, share_url: str, week_of: str) -> str:
    log_rows = "".join(f"""
      <div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">
          {datetime.fromisoformat(l['created_at'].replace('Z','+00:00')).astimezone(PHOENIX_TZ).strftime('%b %d, %Y')}
        </div>
        <div style="font-size:14px;color:#374151;line-height:1.5;">{l.get('note','—')}</div>
      </div>""" for l in logs)

    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;
              box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0f172a;padding:24px 32px;">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">SiteTracker</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Weekly Project Update</div>
    </div>
    <div style="padding:28px 32px 8px;">
      <div style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:6px;letter-spacing:-0.4px;">
        {project['name']}
      </div>
      <div style="font-size:14px;color:#64748b;margin-bottom:20px;">{project.get('address','')}</div>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
        Hi {project.get('client_name','there')}, here's your jobsite update for the week of <b>{week_of}</b>.
        Your project had <b>{len(logs)} update{'' if len(logs)==1 else 's'}</b> this week.
      </p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;
                  color:#3b82f6;border-left:3px solid #3b82f6;padding-left:10px;margin-bottom:12px;">
        This Week's Updates
      </div>
      {log_rows}
    </div>
    <div style="padding:24px 32px;text-align:center;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="font-size:13px;color:#64748b;margin:0 0 16px;">
        View the full photo progress log for your project:
      </p>
      <a href="{share_url}"
         style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;
                font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;
                letter-spacing:-0.2px;">
        View Project Progress →
      </a>
    </div>
    <div style="padding:16px 32px;font-size:11px;color:#94a3b8;text-align:center;">
      SiteTracker — Week of {week_of}
    </div>
  </div>
</body>
</html>"""


# --- Scheduled jobs ---

def send_daily_report():
    print("[scheduler] Running daily report...")
    now_az = datetime.now(PHOENIX_TZ)
    date_str = now_az.strftime("%B %d, %Y")
    day_start, day_end = _day_range_utc(now_az)

    try:
        projects = supabase.table("projects").select("*").execute().data
        project_map = {p["id"]: p for p in projects}

        progress_logs = (
            supabase.table("logs").select("*")
            .gte("created_at", day_start).lte("created_at", day_end)
            .order("created_at").execute().data
        )
        trade_logs = (
            supabase.table("trade_logs").select("*")
            .gte("created_at", day_start).lte("created_at", day_end)
            .order("created_at").execute().data
        )
        punch_items = (
            supabase.table("punch_list_items").select("*")
            .gte("created_at", day_start).lte("created_at", day_end)
            .order("created_at").execute().data
        )
    except Exception as e:
        print(f"[scheduler] DB error in daily report: {e}")
        return

    if not progress_logs and not trade_logs and not punch_items:
        print("[scheduler] No activity today — skipping daily report email")
        return

    html = _build_daily_report_html(date_str, progress_logs, trade_logs, punch_items, project_map)
    _send_email(
        to_email=ADMIN_EMAIL,
        subject=f"SiteTracker Daily Report — {date_str}",
        html=html,
        reply_to=BREVO_FROM_EMAIL,
    )


def send_weekly_emails():
    print("[scheduler] Running weekly client emails...")
    now_az = datetime.now(PHOENIX_TZ)
    week_ago = now_az - timedelta(days=7)
    week_start = datetime(week_ago.year, week_ago.month, week_ago.day, 0, 0, 0, tzinfo=PHOENIX_TZ).astimezone(timezone.utc).isoformat()
    week_of = week_ago.strftime("%B %d, %Y")

    try:
        projects = supabase.table("projects").select("*").execute().data
    except Exception as e:
        print(f"[scheduler] DB error fetching projects: {e}")
        return

    for project in projects:
        if not project.get("client_email"):
            continue
        if not project.get("weekly_email_enabled", True):
            continue
        try:
            logs = (
                supabase.table("logs").select("*")
                .eq("project_id", project["id"])
                .gte("created_at", week_start)
                .order("created_at")
                .execute().data
            )
        except Exception as e:
            print(f"[scheduler] DB error fetching logs for {project['name']}: {e}")
            continue

        if not logs:
            continue

        share_url = f"https://site-tracker-five.vercel.app/share/{project['share_token']}"
        html = _build_client_email_html(project, logs, share_url, week_of)
        _send_email(
            to_email=project["client_email"],
            subject=f"{project['name']} Weekly Progress — Week of {week_of}",
            html=html,
            reply_to=ADMIN_EMAIL,
        )


# --- Scheduler lifecycle ---

scheduler = BackgroundScheduler(timezone="America/Phoenix")
scheduler.add_job(send_daily_report, CronTrigger(hour=18, minute=0, timezone="America/Phoenix"))
scheduler.add_job(send_weekly_emails, CronTrigger(day_of_week="fri", hour=17, minute=0, timezone="America/Phoenix"))


@app.on_event("startup")
def start_scheduler():
    scheduler.start()
    print("[scheduler] Started — daily report at 6 PM, weekly emails Friday at 5 PM (Arizona time)")


@app.on_event("shutdown")
def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()


# --- Manual trigger endpoints ---

@app.post("/api/send-daily-report")
def trigger_daily_report(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    send_daily_report()
    return {"message": "Daily report sent"}


@app.post("/api/send-weekly-emails")
def trigger_weekly_emails(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    send_weekly_emails()
    return {"message": "Weekly emails sent"}
