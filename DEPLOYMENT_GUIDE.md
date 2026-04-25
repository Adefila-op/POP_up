# API Deployment on Railway

Deploy your Node.js backend to Railway.app (PostgreSQL-ready platform)

## Step 1: Prepare Backend for Railway

Create `server/entry-railway.ts`:

```typescript
import { createApp } from "./index";

const PORT = process.env.PORT || 3000;

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  ENVIRONMENT: process.env.ENVIRONMENT || "production",
};

const app = createApp(env);

app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
  console.log(`📍 Environment: ${env.ENVIRONMENT}`);
});
```

## Step 2: Update package.json

Add start script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node dist/api.js",
    "build:api": "esbuild server/entry-railway.ts --bundle --platform=node --target=node18 --outfile=dist/api.js"
  }
}
```

## Step 3: Create railway.json

```json
{
  "build": {
    "builder": "dockerfile"
  }
}
```

## Step 4: Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:api

EXPOSE 3000

CMD ["npm", "start"]
```

## Step 5: Deploy to Railway

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Deploy
railway up

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set ENVIRONMENT=production

# View logs
railway logs
```

## Result

Your API will be accessible at something like:
- `https://your-project.railway.app/api/ips`
- `https://your-project.railway.app/api/health`

---

## Alternative: Self-host on VPS

1. Rent VPS from DigitalOcean, Linode, or AWS EC2
2. Install Node.js
3. Install PostgreSQL or connect to Supabase
4. Clone repo and run `npm install && npm run build:api`
5. Use PM2 or systemd to keep process running
6. Use Nginx as reverse proxy

**Quick setup:**

```bash
# On VPS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

git clone <your-repo>
cd creator-commerce-hub-main
npm install
npm run build:api

# Use PM2 to run in background
npm install -g pm2
pm2 start npm --name "api" -- start
pm2 save
```

---

## For Now

The simplest option is **Railway.app**:
1. No credit card needed for free tier
2. Auto-deploys from GitHub
3. Includes PostgreSQL
4. About 5 minutes to setup

Would you like me to create a Dockerfile and set up Railway deployment?
