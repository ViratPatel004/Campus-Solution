# Deployment Guide

This application is ready to be deployed to **Render** (recommended) or any Node.js hosting provider.

## Option 1: Deploy to Render.com (Recommended)

Render is free and easiest for this project structure.

### 1. Push to GitHub
Ensure all your latest changes are committed and pushed to your GitHub repository.
```bash
git add .
git commit -m "Prepared for deployment"
git push origin main
```

### 2. Create Service on Render
1.  Go to [dashboard.render.com](https://dashboard.render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name**: `complaint-portal` (or anything you like)
    *   **Region**: Closest to you (e.g., Singapore)
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node backend/app.js`
    *   **Free Instance**: Select "Free".

### 3. Add Environment Variables (IMPORTANT)
You MUST set these environment variables for the app to work.
Scroll down to "Environment Variables" and add:

| Key | Value |
| --- | --- |
| `FIREBASE_STORAGE_BUCKET` | `campussolutions-f794a.firebasestorage.app` |
| `FIREBASE_SERVICE_ACCOUNT`| *(See below)* |

**For `FIREBASE_SERVICE_ACCOUNT`:**
1.  Open the file `backend/serviceAccountKey.json` locally.
2.  Copy the **entire content**.
3.  Paste it as the value for `FIREBASE_SERVICE_ACCOUNT`.
    *   *Note: Render handles the JSON content automatically.*

### 4. Deploy
Click **Create Web Service**. Render will build your app and deploy it. Once finished, it will give you a public URL (e.g., `https://complaint-portal.onrender.com`).

---

## Option 2: Vercel (Advanced)

If you prefer Vercel:
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the root.
3.  Add the same Environment Variables in the Vercel Dashboard.
