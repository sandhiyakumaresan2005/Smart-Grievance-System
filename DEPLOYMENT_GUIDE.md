# 🚀 SCGRS Cloud Deployment & Production Hosting Guide

This guide walks through deploying the complete **Smart Campus Grievance Redressal System (SCGRS)** to free cloud platforms:

| Component | Platform | Free Tier Notes |
| :--- | :--- | :--- |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Free M0 Cluster (512MB shared) |
| **Backend API** | [Render](https://render.com) or [Railway](https://railway.app) | Free Web Service (Node.js 18) |
| **AI Service** | [Render](https://render.com) | Free Web Service (Python 3.10) |
| **Frontend UI** | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Free Unlimited Hobby Tier |

---

## Part 1: Setup MongoDB Atlas (Cloud Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Click **Create a Deployment** $\rightarrow$ Select **M0 Free Tier** $\rightarrow$ Provider: AWS (choose closest region).
3. **Database Access**: Create a database user (e.g. `scgrs_admin` with a strong password).
4. **Network Access**: Add IP Address $\rightarrow$ Select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** $\rightarrow$ **Drivers** $\rightarrow$ Copy the connection string:
   ```text
   mongodb+srv://scgrs_admin:<password>@cluster0.xxxx.mongodb.net/scgrs?retryWrites=true&w=majority
   ```

---

## Part 2: Deploy Python AI Service (Render)

1. Push your repository to GitHub.
2. Sign in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** $\rightarrow$ **Web Service** $\rightarrow$ Connect your GitHub repository.
4. Fill in the settings:
   - **Name**: `scgrs-ai-service`
   - **Root Directory**: `ai-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 2 -b 0.0.0.0:$PORT app:app` *(or `python app.py`)*
5. Click **Create Web Service**.
6. Copy your service URL (e.g., `https://scgrs-ai-service.onrender.com`).

---

## Part 3: Deploy Backend Server (Render)

1. On Render, click **New +** $\rightarrow$ **Web Service** $\rightarrow$ Connect your repository.
2. Fill in the settings:
   - **Name**: `scgrs-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add **Environment Variables**:
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/scgrs?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_random_super_secret_jwt_key_here`
   - `AI_SERVICE_URL`: `https://scgrs-ai-service.onrender.com`
   - `EMAIL_SERVICE`: `gmail` *(optional)*
   - `EMAIL_USER`: `your_email@gmail.com` *(optional)*
   - `EMAIL_PASS`: `your_16_character_app_password` *(optional)*
4. Click **Create Web Service**.
5. Copy your backend URL (e.g., `https://scgrs-backend.onrender.com`).

---

## Part 4: Deploy Frontend (Vercel)

1. Sign in to [vercel.com](https://vercel.com) with GitHub.
2. Click **Add New...** $\rightarrow$ **Project** $\rightarrow$ Import your repository.
3. Configure project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
4. Set **Environment Variables** (or update `frontend/src/services/api.js` `BASE_URL`):
   - In `frontend/src/services/api.js`, set:
     ```javascript
     const BASE_URL = import.meta.env.VITE_API_URL || 'https://scgrs-backend.onrender.com/api';
     ```
   - In Vercel Project Settings, add variable:
     - `VITE_API_URL`: `https://scgrs-backend.onrender.com/api`
5. Click **Deploy**!
6. Your live campus portal will be available at: `https://your-project.vercel.app`.

---

## Part 5: One-Click Render Blueprint Alternative

If you have a Render account, you can use the pre-configured [render.yaml](render.yaml) file:
1. In Render dashboard, click **Blueprints** $\rightarrow$ **New Blueprint Instance**.
2. Select your repository.
3. Enter your `MONGO_URI` when prompted.
4. Render will automatically provision both the Python AI Service and Node.js API with inter-service networking!
