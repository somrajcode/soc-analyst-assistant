import io
import uvicorn
import jwt
import asyncio
import logging
from datetime import datetime, timedelta
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from fpdf import FPDF

from app.config import settings
from app.services.virustotal_service import lookup_ip, lookup_hash
from app.services.nvd_service import lookup_cve
from app.services.chromadb_service import search_runbooks
from app.services.google_antigravity_sdk import LocalAgentConfig, AntigravityAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Vigilance.ai - Autonomous AI SOC Analyst Backend",
    description="Production-grade threat intelligence and automated containment engine.",
    version="1.0.0"
)

# CORS configuration for local dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AlertPayload(BaseModel):
    alert_id: str
    src_ip: str
    dest_host: str
    user: str
    cve_id: Optional[str] = "N/A"
    file_hash: Optional[str] = None
    alert_type: str

class LoginPayload(BaseModel):
    # For demo login we accept company_id and password only
    password: str
    company_id: str

class ReportPayload(AlertPayload):
    analysis_text: Optional[str] = ""

# Define Agent system instruction
SOC_ANALYST_INSTRUCTIONS = """
You are a highly precise, non-conversational Senior SOC Analyst operating in a production enterprise environment.
Your purpose is to perform automated threat intelligence enrichment and correlate system log alerts.
You have access to VirusTotal lookup, NVD vulnerability lookup, and local MITRE ATT&CK runbook match enrichment.
Do NOT output any polite conversational phrases, greetings, or narrative filler (e.g. 'Investigating...', 'Let me look that up...').
You must immediately query the required tools, evaluate the reputation and aligned vulnerabilities, and stream a fully structured, data-driven security analysis report.
"""

# Instantiate the Antigravity Agent
agent_config = LocalAgentConfig(
    system_instruction=SOC_ANALYST_INSTRUCTIONS,
    tools=[lookup_ip, lookup_hash, lookup_cve, search_runbooks]
)
soc_agent = AntigravityAgent(agent_config)


def verify_auth_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing authentication token")

    token = authorization.replace("Bearer ", "")

    # Accept a legacy static token for demo convenience
    if token == settings.AUTH_TOKEN:
        return True

    # Otherwise attempt to decode JWT
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        # optional: check exp and other claims are handled by jwt.decode
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing authentication token")


def build_default_report(payload: ReportPayload) -> str:
    return (
        f"VIGILANCE.AI LOG ANALYSIS REPORT\n"
        f"Alert ID: {payload.alert_id}\n"
        f"Source IP: {payload.src_ip}\n"
        f"Destination Host: {payload.dest_host}\n"
        f"User: {payload.user}\n"
        f"Alert Type: {payload.alert_type}\n"
        f"CVE: {payload.cve_id}\n"
        f"File Hash: {payload.file_hash or 'N/A'}\n\n"
        f"Summary:\n"
        f"The selected alert was processed by the Vigilance.ai SOC engine and yielded a high-fidelity analyst summary. Use the PDF for urgent incident response handoff and executive briefing.\n"
    )


@app.post("/api/v1/login")
def login(payload: LoginPayload):
    # Validate company_id and password against demo mapping
    allowed = getattr(settings, 'ALLOWED_CREDENTIALS', {}) or {}
    expected = allowed.get(payload.company_id)
    if expected is None or payload.password != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid company ID or password")

    # Generate JWT token
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    token_payload = {
        "sub": payload.company_id,
        "company_id": payload.company_id,
        "exp": expire,
    }
    encoded = jwt.encode(token_payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    return {
        "access_token": encoded,
        "token_type": "bearer",
        "username": "Analyst",
        "company_id": payload.company_id,
        "expires_at": expire.isoformat() + "Z",
    }


@app.post("/api/v1/analyze")
async def analyze_alert(payload: AlertPayload, authorization: str = Depends(verify_auth_token)):
    """POST endpoint to submit alert logs for autonomous enrichment and investigation with timeout protection."""

    async def event_generator():
        try:
            # Set a timeout of 25 seconds for the analysis task
            async with asyncio.timeout(25):
                async for chunk in soc_agent.run_deep_think_loop(payload.model_dump()):
                    if chunk:
                        yield chunk
        except asyncio.TimeoutError:
            logger.warning(f"Analysis timeout for alert {payload.alert_id}")
            yield f"\n[Analysis timed out after 25 seconds - please try again or check backend logs]\n"
        except Exception as e:
            logger.error(f"Error analyzing alert {payload.alert_id}: {str(e)}")
            yield f"\n[Error during analysis: {str(e)[:100]}]\n"

    return StreamingResponse(event_generator(), media_type="text/plain")


@app.post("/api/v1/report")
async def generate_report(payload: ReportPayload, authorization: str = Depends(verify_auth_token)):
    report_body = payload.analysis_text.strip() or build_default_report(payload)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    pdf.set_font("Courier", size=12)
    pdf.set_text_color(240, 248, 255)
    pdf.set_fill_color(10, 24, 37)
    pdf.rect(0, 0, 210, 297, style="F")
    pdf.set_text_color(6, 182, 212)
    pdf.set_font_size(14)
    pdf.cell(0, 10, "VIGILANCE.AI - LOG ANALYSIS REPORT", ln=True, align="C")
    pdf.ln(4)
    pdf.set_text_color(148, 163, 184)
    pdf.set_font_size(10)
    pdf.multi_cell(0, 5, f"Generated for {payload.user} @ {payload.dest_host} | Alert ID: {payload.alert_id}")
    pdf.ln(6)
    pdf.set_text_color(226, 232, 240)
    pdf.set_font_size(10)

    for line in report_body.split("\n"):
        pdf.multi_cell(0, 5, line)

    pdf_bytes = pdf.output(dest="S").encode("latin-1")
    stream = io.BytesIO(pdf_bytes)
    return StreamingResponse(
        stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"vigilance-report-{payload.alert_id}.pdf\""}
    )


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "vigilance-backend"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
