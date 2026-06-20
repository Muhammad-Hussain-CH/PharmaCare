# PharmaCare — Hospital Pharmacy & Medicine Inventory Management System

A full-stack web application for managing hospital pharmacy and medicine inventory operations, featuring role-based access for **Owners** and **Workers**, real-time stock tracking, and a point-of-sale (POS) checkout flow.

**Developed by:** Muhammad Hussain
**University:** Bahria University Islamabad (H-11)
**Course:** DBMS Lab — 4th Semester
**Instructor:** Engr. Mahrukh Shakoor

---

## Overview

PharmaCare is a hospital pharmacy management system built to handle medicine inventory, supplier management, purchase orders, prescriptions, and point-of-sale dispensing — backed by a real MySQL database rather than mock/local data.

The system supports two roles:

- **Owner** — full administrative access: manage medicines, suppliers, purchase orders, prescriptions, reports, settings, and staff (worker) accounts.
- **Worker** — restricted, retail-style access: a dedicated Point-of-Sale (POS) screen to search medicines, build a sale, check out, reduce stock, and print a receipt — no access to inventory management, suppliers, or settings.

---

## Tech Stack

**Frontend**
- React + TypeScript (Vite)
- Tailwind CSS
- React Router
- Axios
- Recharts (dashboard charts)

**Backend**
- Node.js + Express
- MySQL (via `mysql2`)
- JWT-based authentication (`jsonwebtoken`)
- Password hashing (`bcrypt`)

---

## Features

### Authentication & Roles
- One-time Owner signup (only one Owner account exists per deployment)
- Owner-only creation of Worker accounts
- JWT-based login, persisted in `localStorage`
- Role-based route protection on both frontend and backend

### Owner Dashboard
- Live stats: total medicines, low stock alerts, expired medicines, pending orders
- Medicine, Supplier, and Purchase Order management (full CRUD)
- Prescription & dispense tracking
- Expiry alerts with CSV export
- Reports with CSV export and print support
- Staff account management

### Worker POS
- Search and select medicines
- Build a cart with quantities
- Checkout reduces stock in the database
- Printable receipt generation

---

## Project Structure

```
PharmaCare/
├── Week 03/
│   └── pharmacy-frontend/
│       └── pharmacy-management-system-main/   # React + TypeScript frontend
│           ├── src/
│           │   ├── api/                       # Axios instance & API service calls
│           │   ├── components/                # Shared UI components (Sidebar, Modal, ProtectedRoute, WorkerLayout, etc.)
│           │   ├── context/                   # AuthContext, DataContext, ThemeContext
│           │   ├── pages/                     # Route-level pages (Dashboard, Medicines, POS, Login, Signup, etc.)
│           │   └── data/                      # Sample/fallback data definitions
│           └── package.json
│
└── Week 04/
    └── pharmacy-backend/                      # Express + MySQL backend
        ├── config/                            # Database connection pool
        ├── middleware/                        # Auth middleware (JWT verification, role guards)
        ├── routes/                            # API routes (auth, medicines, suppliers, orders, dispense, POS)
        ├── migrations/                        # SQL schema migrations
        ├── server.js
        └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MySQL Server
- npm

### 1. Clone the repository
```bash
git clone https://github.com/Muhammad-Hussain-CH/PharmaCare.git
cd PharmaCare
```

### 2. Backend setup
```bash
cd "Week 04/pharmacy-backend"
npm install
```

Create a `.env` file in `Week 04/pharmacy-backend/` based on `.env.example`:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=pharmacy_db
JWT_SECRET=your_long_random_secret_key
```

Run the database migrations found in `migrations/` against your MySQL instance to create the required tables.

Start the backend:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd "Week 03/pharmacy-frontend/pharmacy-management-system-main"
npm install
```

Create a `.env` file with:
```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

### 4. First-time use
1. Navigate to the app and use the **Signup** page to create the one-time **Owner** account.
2. Log in as Owner.
3. From Settings, create **Worker** accounts as needed.
4. Workers log in via the same Login page and are automatically routed to the POS screen.

---

## Database Schema (high level)

- `users` — owner/worker accounts (hashed passwords, role, created_by)
- `medicines`, `categories`, `manufacturers`, `stock` — inventory
- `suppliers` — supplier directory
- `purchase_orders`, `purchase_order_items` — procurement
- `patients`, `doctors`, `prescriptions`, `prescription_items`, `dispense_records` — clinical dispensing
- Additional POS/sales tables for worker checkout transactions

---

## Status

This project is under active development as part of a university DBMS lab. Core inventory management, authentication, and POS features are implemented; not yet deployed publicly.

---

## License

This project is developed for academic purposes as part of the DBMS Lab course at Bahria University Islamabad.
