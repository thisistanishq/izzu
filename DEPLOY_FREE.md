# 💸 Free Deployment Guide (The "Hacker" Stack)

Deploy **IzzU** entirely for free using these providers.

## The Stack
- **Dashboard (Frontend)**: Vercel (Hobby Tier)
- **Backend (API)**: Vercel (Hobby Tier)
- **Database**: Supabase (Free Tier)
- **Redis**: Upstash (Free Tier)
- **Face Engine (Python)**: **Self-Hosted** (run locally via Tunnel) or **Render** (Free Tier)

---

## 🚀 Step 1: Database & Cache (Cloud)
1. **Supabase**: Create a project. Get the `DATABASE_URL` (Transaction Mode port 6543).
2. **Upstash**: Create a Redis database. Get `REDIS_URL`.

## ⚡ Step 2: Dashboard & Backend (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy Dashboard:
   ```bash
   cd apps/dashboard
   vercel deploy
   # Set Envs: NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
   ```
3. Deploy Backend:
   ```bash
   cd apps/backend
   vercel deploy
   # Set Envs: DATABASE_URL=..., REDIS_URL=..., AUTH_SECRET=...
   ```

## 🧠 Step 3: Face Engine (The Tricky Part)
*Python 3.11 with dlib is heavy. Free clouds usually crash.*

### Strategy A: Self-Host via Tunnel (Best for Free)
Run the engine on your Laptop/Mac and expose it safely.
1. Run locally: `python main.py` (Port 8000)
2. Use Cloudflare Tunnel (Free):
   ```bash
   brew install cloudflared
   cloudflared tunnel --url http://localhost:8000
   ```
3. Get the `https://....trycloudflare.com` URL.
4. Set `FACE_SERVICE_URL` in your Vercel Backend env variables to this URL.

### Strategy B: Render (Free Tier - Might be slow)
1. Create a "Web Service" on Render.com.
2. Link your GitHub repo.
3. Root Directory: `apps/face-service`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000`
6. **Warning**: Render free tier sleeps after inactivity.

---
**Recommendation:** Use **Strategy A** (Tunnel) for seeing it work 24/7 without limits, or **Strategy B** if you need it properly in the cloud but don't mind cold starts.
