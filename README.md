# Vigilance.ai — Autonomous SOC Analyst Assistant

Vigilance.ai is a focused demo of an Autonomous SOC analyst console. It provides a threat feed, an interactive investigation workbench, and server-side endpoints for analysis and PDF report generation.

Quick start (backend)
- Install Python deps: `pip install -r backend/requirements.txt`
- Copy `.env.example` to `.env` and edit keys if needed.
- Run the API from `backend/`: `py -3 run.py` (starts on port 8000).

Quick start (frontend)
- From `frontend/`: `npm install`
- Start dev server: `npm run dev` (open http://localhost:5173)

Demo credentials (server-side)
- `SOC-VPER28` / `StringLA`
- `SOC-VPER27` / `StringBA`
- `SOC`       / `Demo`

Authentication
- The backend issues JWT tokens on successful login. Include `Authorization: Bearer <token>` for protected endpoints (analyze, report).

Generate PDF report
- Call `POST /api/v1/report` with alert fields and `analysis_text`, or use the frontend "Generate Report" button after running an analysis.

Support
- This project is a demonstration. For production use, move credentials to a secure store, rotate `JWT_SECRET`, and use HTTPS.

Developed by Somraj Laskar
