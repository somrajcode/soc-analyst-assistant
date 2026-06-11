# Vigilance.ai — Autonomous SOC Analyst Assistant

Vigilance.ai is an interactive Security Operations Center (SOC) dashboard demo built to showcase a premium analyst experience for threat monitoring, investigation, and report generation.

## Overview

This project combines a dark-themed React frontend with a Python FastAPI backend. The frontend provides a modern SOC dashboard layout with live threat feed, India-focused attack path visualization, investigation console, and report generation. The backend implements authentication, analysis, and PDF report creation endpoints.

## Features

- Login with server-side JWT authentication
- Live alert stream and selectable threat table
- India-specific attack path map with vulnerable city highlighting
- Investigation console with simulated analysis playback
- PDF report generation from selected alert data
- Backend-ready structure for integrating external threat intelligence services

## Project structure

- `frontend/`
  - React + Vite application
  - Tailwind CSS styling
  - `src/App.jsx` main dashboard and auth UI
- `backend/`
  - FastAPI service
  - Authentication and report endpoints
  - Service modules for ChromeDB, NVD, VirusTotal, and Google Antigravity SDK
- `infrastructure/`
  - `docker-compose.yml` and Logstash pipeline placeholder
- `README.md` project documentation
- `.env.example` environment variable starter

## Languages & tools

- Frontend
  - JavaScript
  - React
  - Vite
  - Tailwind CSS
  - lucide-react icon library
- Backend
  - Python
  - FastAPI
  - Uvicorn
  - JWT authentication
- Optional infrastructure
  - Docker Compose
  - Logstash pipeline

## Local setup

### Backend

1. Open a terminal in `backend/`
2. Install dependencies:
   ```powershell
   py -3 -m pip install -r requirements.txt
   ```
3. Copy environment template:
   ```powershell
   copy ..\.env.example .env
   ```
4. Start backend server:
   ```powershell
   py -3 run.py
   ```
5. Backend API runs on `http://localhost:8000`

### Frontend

1. Open a terminal in `frontend/`
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the dev server:
   ```powershell
   npm run dev
   ```
4. Open `http://localhost:5173`

## Demo credentials

Use one of the server-side test users:

- `SOC-VPER28` / `StringLA`
- `SOC-VPER27` / `StringBA`
- `SOC` / `Demo`

## API endpoints

- `POST /api/v1/login` — authenticate and receive JWT
- `POST /api/v1/analyze` — analyze selected alert data (protected)
- `POST /api/v1/report` — generate and download PDF report (protected)

## Notes

- This project is intended as a demo, not a production SOC platform.
- For production use, secure secrets, rotate the JWT secret, add HTTPS, and harden API access.
- Add real telemetry ingestion and persistent storage for alerts before using in a live environment.

## Author

Developed by Somraj Laskar

