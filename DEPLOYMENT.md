# PortSentinel Deployment Guide

This project supports two clean, production-ready deployment strategies:

---

## 1. Multi-Stage Docker Container (Recommended)

PortSentinel uses a multi-stage Docker build that bundles both the React 18 / Vite 6 frontend SPA and the FastAPI Python 3.11 backend into a single lightweight, high-performance container.

### Build and Run:
```bash
# Build the Docker image
docker build -t portsentinel:latest .

# Run the container on port 8000
docker run -d -p 8000:8000 --name portsentinel portsentinel:latest
```

### Or with Docker Compose:
```bash
docker compose up -d
```
Access at: `http://localhost:8000`

---

## 2. Cloud Platform Deployment (Render / Railway / AWS / GCP)

### Render.com Blueprint (1-Click)
1. Push this repository to GitHub.
2. In Render, select **New > Blueprint** and choose your repo.
3. Render automatically reads `render.yaml`, builds the Vite frontend, installs Python dependencies, and binds Uvicorn to `$PORT`.

### Manual Linux / Cloud VM Deployment:
```bash
# 1. Build frontend assets
npm install
npm run build

# 2. Install backend dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# 3. Run production Uvicorn server
export PYTHONPATH=.
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
---

## 3. Current Live Demonstration Endpoint

Active Cloudflare Global Edge Tunnel:
- **Live URL**: https://helmet-infections-bangkok-bangkok.trycloudflare.com
- **Swagger Docs**: https://helmet-infections-bangkok-bangkok.trycloudflare.com/docs
- **Health Check**: https://helmet-infections-bangkok-bangkok.trycloudflare.com/api/health
