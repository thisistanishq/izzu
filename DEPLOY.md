# 🚀 Deployment Guide

Deploy **IzzU** to any VPS (DigitalOcean, AWS, Hetzner) or local server in minutes using Docker.

## Prerequisites

1. **A Server** (Ubuntu 22.04 recommended)
2. **Docker & Docker Compose** installed
3. **Domain Name** (Optional but recommended for SSL)

---

## ⚡ Option 1: The "Lazy" Docker Way (Recommended)

This method runs everything (DB, Face Engine, Dashboard, Backend) in containers.

### 1. Provision Server
SSH into your server:
```bash
ssh root@your-server-ip
```

### 2. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 3. Clone Repository
```bash
git clone https://github.com/thisistanishq/izzu.git
cd izzu
```

### 4. Configure Secrets
Copy the example env file:
```bash
cp .env.example .env
```
Edit `.env` with your secure passwords:
```bash
nano .env
```
*Change `POSTGRES_PASSWORD`, `AUTH_SECRET`, etc.*

### 5. Launch 🚀
```bash
docker compose up -d --build
```
This will take a few minutes to build the Python and Node.js images.

### 6. Verify
- **Dashboard:** `http://your-server-ip:3000`
- **Frontend API:** `http://your-server-ip:3001`
- **Face Service:** `http://your-server-ip:8000`

---

## 🔒 Option 2: Production with SSL (Nginx)

For a real production setup, you want HTTPS (especially for camera permissions).

### 1. Install Nginx
```bash
apt install nginx certbot python3-certbot-nginx
```

### 2. Setup Config
Create `/etc/nginx/sites-available/izzu`:

```nginx
server {
    server_name dashboard.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    server_name face.yourdomain.com;
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Enable & Certify
```bash
ln -s /etc/nginx/sites-available/izzu /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL Certs
certbot --nginx -d dashboard.yourdomain.com -d api.yourdomain.com -d face.yourdomain.com
```

---

## ❓ Troubleshooting

**Face Service not starting?**
Check logs:
```bash
docker compose logs -f face-service
```
Common issue: Old CPU (missing AVX instructions). Ensure your VPS supports AVX (most modern ones do).

**Database connection failed?**
Ensure `DATABASE_URL` in `.env` matches the internal docker network:
`postgres://izzu:password@postgres:5432/izzu`
(Note: Use `postgres` as hostname, not `localhost`)
