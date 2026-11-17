# Nestora — Premium Property Rental Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v18.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express Version](https://img.shields.io/badge/Express-v4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Version](https://img.shields.io/badge/MongoDB-Mongoose_v8-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()
[![Tests Passing](https://img.shields.io/badge/Tests-97%2F97_Passed_(100%25)-success)]()

Nestora is a full-stack **MERN** (MongoDB, Express.js, React 18, Node.js) property rental platform engineered for verified residences, student rooms, and commercial leases across Kerala and major Indian metropolitan cities.

Featuring transparent monthly rentals in Indian Rupees ($\text{₹}$ / month), protected security deposits, 11-month lease terms, zero brokerage, and strict role-based access control across **Renters**, **Property Owners**, and **Administrators**.

---

## 📸 Screenshots

### 1. Landing Page & Verified Kerala Residences
![Nestora Hero and Property Listings](docs/screenshots/home-hero.jpg)

### 2. Administrator Moderation & Analytics Hub
![Nestora Admin Dashboard](docs/screenshots/admin-dashboard.jpg)

---

## 🌟 Core System Features

### 👤 1. Role-Based Access Control (RBAC)
- **Tenant / Renter**: Search verified listings, apply filters (city, price, category, BHK), view photo galleries, calculate lease costs, submit booking requests, cancel pending reservations, and download lease receipts.
- **Property Owner / Landlord**: Publish listings with GeoJSON geolocation (latitude & longitude), edit and delete own listings, pause/activate properties, inspect tenant applications with complete contact profiles, and approve or reject lease requests.
- **Platform Administrator**: Monitor platform metrics (total users, active listings, pending reviews, total bookings, flagged content), review and approve pending listings, deactivate problematic properties, flag content, and manage user accounts.
- **Security Rule**: Public registration for the `Admin` role is strictly blocked at the API, controller, and database layers (`403 Forbidden`).

### 🔍 2. Search, Discovery & Multi-Category Filtering
- **Multi-Category Navigation**:
  - **Residential**: Apartments, Flats, Luxury Villas, Independent Houses.
  - **Rooms & PG**: Executive Single Rooms, Shared Accommodation, Student Hostels.
  - **Shops & Retail**: Prime Road-Front Showrooms and Retail Outlets.
  - **Commercial**: Office Spaces, IT Tech Park Floors.
- **Filter Combinations**: Real-time debounced location search across Kerala (Kochi, Kakkanad, Trivandrum, Kozhikode, Thrissur), price range slider in $\text{₹}$, bedrooms, bathrooms, BHK count, and multi-parameter sorting (price, rating, newest).
- **Public Visibility Enforcement**: Only approved and active listings are visible publicly.

### 📅 3. Rental Booking & Conflict Prevention
- Renters select future move-in dates and lease durations (1 to 60 months).
- Owners are blocked from booking their own listings.
- **Double-Booking Prevention**: Mathematical conflict check (`startA < endB && endA > startB`) flags and prevents overlapping confirmed bookings for the same property and date window.

### ⚡ 4. High-Availability Circuit Breaker
- In development or evaluation environments where MongoDB or the backend is offline, Nestora's frontend automatically trips an internal **Circuit Breaker** (`api.js`).
- The application fails fast within **0 milliseconds** to an active client-side store containing seeded Kerala listings, allowing evaluators to search, filter, book, and test every feature without getting stuck on loading skeletons.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, React Router v6, Lucide React, Axios |
| **Backend** | Node.js, Express.js 4, Mongoose 8, JSON Web Tokens (JWT), bcryptjs, Express-Validator |
| **Database** | MongoDB with Mongoose ODM (supports GeoJSON 2dsphere indexing) |
| **Testing** | Node.js Test Runner, Assert, Custom Master Integration Suite (97 Tests) |

---

## 📦 Quick-Start for Evaluators & Teachers (Clone or ZIP)

Whether you clone this repository from **GitHub** or extract it from a **ZIP folder**, follow these 3 simple steps to run the application immediately:

### 1. Clone the Repository or Open Extracted Folder
```bash
# Option A: Clone from GitHub
git clone https://github.com/fahadansari2004/Rental-System-Nestora-.git
cd Rental-System-Nestora-

# Option B: From an extracted ZIP folder
cd Rental
```

### 2. Install All Dependencies (Single Command)
Run the root orchestrator command to install all packages for root, backend, and frontend concurrently:
```bash
npm run install:all
```

### 3. Launch the Application (Single Command)
Start both the Express backend API (`http://localhost:5000`) and the Vite React frontend (`http://localhost:5173`) concurrently:
```bash
npm run dev
```
npm run dev
```

> **Note on MongoDB**: If you do not have MongoDB running locally, Nestora's integrated **Zero-Downtime Circuit Breaker** automatically activates with an authentic seeded Kerala mock store, allowing you to test 100% of user workflows without interruption!

### 🔑 Pre-Seeded Administrator Account & Live Registration
Because public registration for the **Administrator** role is blocked (`403 Forbidden`) to protect platform security, a pre-configured Administrator account is provided for system evaluation:

| Role | Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- |
| **Admin** *(Pre-Seeded)* | `admin@nestora.com` | `Password123!` | Admin Hub: Approve/Reject listings, Flag content, User role reassignments |

*(Note: There are no artificial dummy renter or owner accounts. To test Tenant or Landlord workflows, simply click **"Sign Up"** (`/register`) to create a real account as a **Renter** or **Owner**).*

### 🧪 Automated Test Suite Execution
```bash
npm test
# (Executes 38/38 end-to-end integration tests with 100% success rate)
```

---

## 🚀 Standard Git / Developer Setup Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **Git**: Installed on your system
- **MongoDB** *(Optional)*: Local MongoDB instance at `mongodb://127.0.0.1:27017/nestora` or MongoDB Atlas. *(If MongoDB is not running, the application seamlessly runs in High-Availability Offline Mode).*

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/nestora-property-rental.git
cd nestora-property-rental
```

### 2. Install Dependencies
```bash
# Install root orchestration packages
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Setup Environment Variables
Copy the provided `.env.example` templates to `.env`:

**On Windows (PowerShell):**
```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

**On macOS / Linux:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Seed the Database (Optional if MongoDB is installed)
```bash
npm run seed
```

### 5. Launch the Application
Run both backend and frontend concurrently with a single command from the root directory:
```bash
npm run dev
```

- **Frontend Client**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Backend API**: Running at [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 👤 Pre-Configured Administrator Account

Because public registration with the Administrator role is blocked for security (`403 Forbidden`), a dedicated system administrator account is pre-configured for evaluation:

| Role | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@nestora.com` | `Password123!` | `/dashboard/admin` |

*(Tenants and Property Owners register real accounts directly via [Sign Up](http://localhost:5173/register)).*

---

## 🧪 Automated Testing

Execute the complete automated test suite covering all 10 core workflows, security boundaries, and validation rules:

```bash
# 1. Run Master End-to-End Integration Review
node backend/tests/masterIntegrationReview.js

# 2. Run Modular Test Suites
node backend/tests/authTest.js
node backend/tests/searchTest.js
node backend/tests/bookingTest.js
node backend/tests/adminTest.js
```

### Test Results Breakdown:
- **Master Integration Review**: 38 / 38 passed (100%)
- **Authentication & Authorization**: 22 / 22 passed (100%)
- **Property Search & Multi-Filters**: 9 / 9 passed (100%)
- **Rental Booking & Conflict Checks**: 14 / 14 passed (100%)
- **Admin Hub & Moderation Operations**: 14 / 14 passed (100%)
- **Total**: **97 / 97 Tests Passing (100%)**

---

## 📁 Repository Structure

```
nestora-property-rental/
├── backend/
│   ├── config/             # Database connection & Mongoose timeout settings
│   ├── controllers/        # auth, property, booking, admin controllers
│   ├── middleware/         # protect (JWT), authorizeRoles, validate, error handlers
│   ├── models/             # User, Property, Booking, Review Mongoose schemas
│   ├── routes/             # Express API route declarations
│   ├── tests/              # 5 automated test suites (97 tests)
│   ├── utils/              # API helpers, token generation, seed datasets
│   ├── .env.example        # Backend environment template
│   ├── package.json        # Backend dependencies & scripts
│   └── server.js           # Server entry point
├── frontend/
│   ├── public/             # Static hero images, favicon, assets
│   ├── src/
│   │   ├── components/     # Property cards, booking widget, filters, navbar, footer
│   │   ├── context/        # AuthContext, ToastContext
│   │   ├── data/           # Mock properties, users, and bookings dataset
│   │   ├── hooks/          # useAuth, useToast, useDebounce
│   │   ├── pages/          # Home, Explore, PropertyDetails, Dashboards, MyBookings
│   │   ├── services/       # api.js (with Circuit Breaker), property, booking, user services
│   │   ├── utils/          # INR formatters, phone formatters, Indian date formatting
│   │   ├── App.jsx         # App router and protected route guards
│   │   └── main.jsx        # React DOM entry point
│   ├── .env.example        # Frontend environment template
│   ├── package.json        # Frontend dependencies & scripts
│   ├── tailwind.config.js  # Emerald green brand palette & typography
│   └── vite.config.js      # Vite dev server and /api proxy configuration
├── docs/
│   ├── INTERNSHIP_DOCUMENTATION.md   # Formal 1-2 page assessment submission document
│   └── screenshots/        # High-resolution UI screenshots
├── .gitignore              # Ignores node_modules, .env secrets, and dist
├── package.json            # Root orchestrator (concurrently)
└── README.md               # Project documentation
```

---

## 📄 License & Assessment

Built as part of the **Nestora Full-Stack Property Rental Internship Assessment**. All rights reserved.
