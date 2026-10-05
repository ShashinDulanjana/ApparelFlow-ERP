# ApparelFlow ERP - Gatekeeper Terminal & Traffic Light Engine

ApparelFlow ERP Gatekeeper Terminal is a full-stack automated quality verification and production-line gatekeeping system designed for garment factories. It enforces strict component verification algorithms (Traffic Light Engine) and server-side hard stops to prevent incomplete or defective garment cut-bundles from reaching the sewing production lines.

---

## 🚀 Key Features

- **Role-Based Access Control (RBAC):**
  - **Cutting Supervisor:** Creates cutting orders and links them to garment recipes and fabric rolls.
  - **Cutting Verifier:** Measures physical cut component quantities against required recipe totals.
  - **Sewing Supervisor:** Accepts verified bundles into the sewing line; blocked by server-side logic if unverified or rejected.
- **Traffic Light Verification Engine:**
  - Automatically calculates component match ratios (Actual / Expected).
  - If match ratio < 95%, the order triggers a **RED (REJECTED)** status.
  - If match ratio >= 95%, the order triggers a **GREEN (VERIFIED)** status.
- **Server-Side Hard Stop Enforcement:**
  - Strict security enforcement directly at the Express API layer.
  - Rejects any handover attempt for `REJECTED` or `PENDING` orders with an immediate `400 BAD REQUEST` / Hard Stop block response.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Modern Dark-Theme UI with Glassmorphism styling.
- **Backend:** Node.js, Express.js REST API.
- **Database & ORM:** PostgreSQL (hosted on Supabase), Prisma ORM.
- **Authentication & RBAC:** Express middleware role enforcement.

---

## 📁 Project Structure

```text
apparelflow-erp/
├── client/               # React Vite Frontend Application
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── server/               # Express Node.js Backend API
    ├── prisma/           # Prisma Schema & Database Seeder
    │   ├── schema.prisma
    │   └── seed.js
    ├── index.js          # Express API Routes, RBAC, Traffic Light Logic
    └── package.json
```

---

## ⚙️ Local Setup & Running Instructions

### Prerequisites
- Node.js (v18 or higher recommended)
- Git

---

### 1. Backend Setup (`server/`)

1. Open terminal and navigate to the backend directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure environment variables are configured (`.env` file inside `server/` directory):
   ```env
   DATABASE_URL="YOUR_SUPABASE_POSTGRESQL_CONNECTION_STRING"
   PORT=5000
   ```

4. Push schema and seed initial data into Supabase:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

5. Start the Node.js / Express backend server:
   ```bash
   npm start
   ```
   *The backend server will run at http://localhost:5000*

---

### 2. Frontend Setup (`client/`)

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm run dev
   ```
   *The frontend application will run at http://localhost:5173*

---

## 🧪 Testing & Verification Walkthrough

### Pre-Configured Demo Credentials
- **Cutting Supervisor:** Kasun Perera (`cutting_supervisor`)
- **Cutting Verifier:** Nimal Jayasinghe (`cutting_verifier`)
- **Sewing Supervisor:** Sunil Shantha (`sewing_supervisor`)

### Scenario 1: RED Status & Server Hard Stop (Failure Test)
1. Log in using **Login as Cutting Supervisor** and submit order `ORD-1001` (Casual Blouse, Target Qty: 100).
2. Log in using **Login as Cutting Verifier**, click **Verify Components** for `ORD-1001`.
3. Enter lower component count (e.g., Front Panel `180` vs Expected `200`) and add rejection note.
4. Click **Run Gatekeeper Check & Save**.
5. **Result:** Match ratio < 95% triggers **RED (REJECTED)** status.
6. Log in using **Login as Sewing Supervisor** and click **Handover Blocked (Hard Stop)**.
7. **Result:** Express server responds with `"HARD STOP BLOCK: Order cannot be accepted into Sewing line"`.

### Scenario 2: GREEN Status & Successful Handover (Pass Test)
1. Log in as **Cutting Supervisor** and submit order `ORD-1002`.
2. Log in as **Cutting Verifier** and enter 100% matching quantities (`200`, `100`, `200`, `100`).
3. Click **Run Gatekeeper Check & Save**. Status updates to **GREEN (VERIFIED)**.
4. Log in as **Sewing Supervisor** and click **Accept into Sewing Line**.
5. **Result:** Order is successfully transferred into the sewing production line.