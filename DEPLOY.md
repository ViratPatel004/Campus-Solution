# Deployment Guide

## Option 1: Deploy to Vercel (Requested)

Detailed guide for deploying to Vercel.

### 1. Push Changes
I have added a `vercel.json` file which configures Vercel to use `backend/app.js` as the serverless function. Push these changes to GitHub first.

### 2. Connect to Vercel
1.  Go to [vercel.com](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository: `Campus-Solution`.
4.  Vercel should automatically detect the `vercel.json` and configure the build.

### 3. Environment Variables (Required)
You **MUST** add the following environment variables in the Vercel Project Settings -> "Environment Variables".

| Key | Value |
| --- | --- |
| `FIREBASE_STORAGE_BUCKET` | `campussolutions-f794a.firebasestorage.app` |
| `FIREBASE_SERVICE_ACCOUNT`| *(Copy content from backend/serviceAccountKey.json)* |

### 4. Deploy
Click "Deploy". Vercel will build and assign a domain (e.g., `campus-solution.vercel.app`).

---

## Option 2: Render.com (Alternative)

(Instructions remain valid if you choose Render later)
1.  Connect GitHub repo.
2.  Start Command: `node backend/app.js`
3.  Add `FIREBASE_SERVICE_ACCOUNT` env var.
