# TaskFlow: Intelligent Task Management & Algorithmic Prioritization System

TaskFlow is a high-performance, full-stack productivity ecosystem designed to solve the "priority paradox" in modern task management. Unlike standard to-do apps, TaskFlow utilizes the proprietary **DEEP-S (Dynamic Evaluation of Essential Priority Scores)** hybrid algorithm to mathematically rank tasks based on real-time urgency, importance, and workload constraints.

---

## 🚀 System Overview

TaskFlow bridges the gap between simple list-making and complex project management. It provides users with an automated "Focus Path" by analyzing task metadata to suggest what should be worked on _now_, rather than just what is due _soon_.

### **Key Innovations**

- **DEEP-S Hybrid Engine:** A custom mathematical model combining Urgency, Importance, Duration Boost, and Dependency Weighting.
- **Real-Time Analytics:** Visualizing productivity trends through interactive Recharts integration.
- **Persistence & Security:** Military-grade password hashing (bcrypt) and secure session management (JWT).
- **Global State Synchronization:** A seamless UI experience featuring a persistent Pomodoro timer and theme-aware components across the entire MERN stack.

---

## 🛠️ Technical Architecture

| Layer             | Technology        | Implementation Detail                                          |
| :---------------- | :---------------- | :------------------------------------------------------------- |
| **Frontend**      | React 18          | Functional components, Hooks, Context API for Global State     |
| **Backend**       | Node.js / Express | RESTful API architecture with JWT-protected middleware         |
| **Database**      | MongoDB           | Document-based storage with Mongoose ODM for schema validation |
| **Visualization** | Recharts          | Dynamic SVG-based charting for productivity metrics            |
| **Security**      | Auth Services     | Encrypted communication and salted password storage            |

---

## 🧠 The DEEP-S Algorithm

The core of TaskFlow is the **DEEP-S Algorithm**, which calculates a **Priority Score (0-100)** for every task. This ensures that "urgent-but-unimportant" tasks do not overshadow "critical-long-term" goals.

$$FinalScore = (U \times 0.45) + (I \times 0.30) + (DB \times 0.15) + (D \times 0.10)$$

- **Urgency (U):** Calculated via a dynamic time-decay function relative to the deadline.
- **Importance (I):** Weighted scaling based on user-defined priority levels (1–4).
- **Duration Boost (DB):** A square-root function that prioritizes shorter tasks to maximize throughput without starving large projects.
- **Dependency (D):** Elevates the score of "Blocker" tasks that have sub-tasks or dependent items.

---

## 🚦 Execution Guide

To deploy TaskFlow locally, follow these steps across three terminal instances.

### **Prerequisites**

- **Node.js** (v18.x or higher)
- **MongoDB** (Local instance or Atlas URI)
- **Environment Variables:** Ensure `.env` is configured in the `/backend` directory.

### **Step 1: Database Engine**

Launch your MongoDB service and point to your data directory:

```powershell
mongod --dbpath "your/path/to/data"

```

### **Step 2: Backend API (Server)**

Navigate to the backend, install dependencies, and start the development server:

```powershell
cd backend
npm install
npm run dev
```

The API will be accessible at http://localhost:5000.

### **Step 3: Frontend Client (UI)**

Navigate to the frontend and launch the React development environment:

```powershell
cd frontend
npm install
npm start
```

The application will automatically launch at http://localhost:3000.
