# 🧠 AI SaaS Platform

An AI-powered SaaS web application built with a modern full-stack architecture. This platform provides both free and premium tools like article generation, blog title suggestions, image creation, background/object removal, and resume review — all backed by AI APIs.

---

## 🚀 Live Demo

👉 [Visit the Live App]()

---

## 🚀 Features

- ✍️ Article & Blog Title Generation (Free)
- 🖼️ Image Generation (Premium)
- 🧽 Background/Object Removal (Premium)
- 📄 Resume Review (Premium)
- 💳 Credit-based access system (10 credits for free users)
- 🧾 Manual image download option
- 🔐 Secure authentication with Clerk

---

## 🛠️ Tech Stack

| Frontend        | Backend         | AI-API     | Database | Auth  | Deployment |
|-----------------|------------------|----------------|---------------|-------------|
| React.js        | Node.js + Express | OpenAI, ClipDrop | Neon PostgreSQL | Clerk | Vercel |

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Vinay-techdev/SAAS-AI.git
cd SAAS-AI
```

---
### 2. Install Dependencies
# Backend
```bash
cd backend
npm install
```

---

# Frontend
```bash
cd ../frontend
npm install
```
---

### 3. Set Environment Variables
# Create a .env file in your backend folder:
# Backend ENV
```bash
PORT=5000
GEMINI_API_KEY= 
CLIPDROP_API_KEY=
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# FrontEnd ENV
```bash
VITE_BACKEND_URL = 
```
---

### 4. Run the App Locally
# Start Backend
```bash
cd backend
npm start
```

---

# Start Frontend
```bash
cd ../frontend
npm start
```

---
## 📢 Connect With Me
Let’s connect and collaborate!
📧 Email: vinayp.techdev@email.com
🔗 [LinkedIn](https://www.linkedin.com/in/vinay-techdev)
