<div align="center">

# 🔐 IzzU

### The Face ID You Actually Own.

**No cloud. No bullshit. Just math.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-green)](https://www.python.org/)

---

<img src="https://img.icons8.com/ios-filled/200/face-id.png" width="120" />

</div>

---

## WTF is this?

**IzzU** is a self-hosted, open-source Face ID authentication platform that you deploy on YOUR servers. 

Apple has Face ID. Google has whatever Google has. Startups pay $0.10 per verification to Auth0.

You? You get IzzU. **Zero vendor lock-in. Zero monthly bills. Zero face data leaving your infrastructure.**

---

## ⚡ The Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| **Dashboard** | Next.js 16 + TailwindCSS | Client dashboard for managing projects, API keys, end-users |
| **Backend API** | Next.js API Routes + Drizzle ORM | REST API, auth flows, session management |
| **Face Engine** | Python 3.11 + dlib + OpenCV | The brain. 99.38% accuracy. Liveness detection. AES-256 encrypted templates. |
| **Database** | PostgreSQL | Users, projects, identities, sessions |
| **Cache** | Redis | OTP storage, rate limiting, sessions |

---

## 🛡️ Security Features

This isn't your grandma's face recognition.

### ✅ What We Do

- **AES-256-GCM Encrypted Face Vectors** — Your face data is locked. Even if someone steals the DB, it's useless without the master key.
- **Liveness Detection** — Blinking eyes, head pose, texture analysis. No photos. No videos. No masks.
- **Attention Awareness** — Eyes must be open. Must be looking at the camera. Prevents unlock while sleeping.
- **Anti-Spoofing** — Laplacian variance checks reject flat sources (printed photos, screens).
- **Local Storage** — Face data never leaves your server. Ever.
- **No Reversible Templates** — You can't reconstruct a face from the stored vector. It's a one-way trip.

### ❌ What We Don't Do

- Store raw images for recognition (only profile photos for YOUR dashboard)
- Send anything to external servers
- Require internet for face matching (works offline after setup)
- Charge you per verification

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Python 3.11** (not 3.14, dlib hates it)
- **PostgreSQL** (or use Supabase/Neon)
- **Redis** (or use Upstash)
- **pnpm** (we use Turborepo)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/izzu.git
cd izzu
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgres://user:pass@localhost:5432/izzu"
REDIS_URL="redis://localhost:6379"
```

### 3. Setup Database

```bash
pnpm db:push
```

### 4. Setup Face Engine

```bash
cd apps/face-service
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 5. Run Everything

```bash
# Terminal 1: Node apps
pnpm dev

# Terminal 2: Face Engine
cd apps/face-service
venv/bin/python3 -m uvicorn main:app --reload --port 8000
```

### 6. Open

- Dashboard: `http://localhost:3000`
- API: `http://localhost:3001`
- Face Service: `http://localhost:8000`

---

## 📁 Project Structure

```
izzu/
├── apps/
│   ├── dashboard/        # Next.js Dashboard
│   ├── backend/          # Next.js API
│   └── face-service/     # Python Face ID Engine
├── packages/
│   ├── db/               # Drizzle ORM schema + client
│   └── ui/               # Shared UI components
├── .env.local            # Your secrets (git-ignored)
└── turbo.json            # Turborepo config
```

---

## 🔌 SDK Integration

Drop this into any website:

```html
<div id="izzu-auth"></div>
<script>
  const IZZU = {
    apiKey: "izzu_pk_live_YOUR_KEY",
    projectId: "YOUR_PROJECT_ID",
    apiUrl: "https://your-api.com/api",
    mode: "signup" // or "signin"
  };
  
  // ... SDK code from Dashboard > Integration
</script>
```

The SDK handles:
- Camera access
- Multi-angle face scanning
- Liveness verification
- User creation/login
- Callbacks on success/failure

---

## 🧠 How the Face Engine Works

1. **Capture** — SDK sends a JPEG frame from the user's camera.
2. **Liveness Check** — Engine runs:
   - Texture variance (Laplacian) — rejects printed photos
   - 68-point landmark detection — verifies actual face structure
   - Eye Aspect Ratio (EAR) — confirms eyes are open
   - Head pose estimation — confirms looking at camera
3. **Encoding** — dlib's ResNet generates a 128-dimensional face vector.
4. **Encryption** — Vector is encrypted with AES-256-GCM before storage.
5. **Matching** — On login, new vector is compared against encrypted DB using Euclidean distance.
6. **Threshold** — Match if `distance < 0.48` (stricter than dlib's default 0.6).

---

## ⚙️ Configuration

All thresholds are in `apps/face-service/main.py`:

```python
MATCH_THRESHOLD = 0.48          # Lower = stricter (0.6 is default)
ANTI_SPOOF_VARIANCE_MIN = 35.0  # Higher = stricter spoof detection
EAR_THRESHOLD = 0.21            # Eye openness threshold
```

---

## 🤝 Contributing

PRs welcome. Issues welcome. Stars welcome.

If you find a vulnerability, email me before you tweet about it. Be cool.

---

## 📜 License

MIT. Do whatever you want. Just don't sue me if someone unlocks your phone with a photo.

(That won't happen though. We have liveness detection. Pay attention.)

---

<div align="center">

**Built with rage against monthly auth bills.**

</div>
