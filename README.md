# ADRA — Development & Humanitarian Management System (DMS)

> A full-stack academic software engineering web application designed for non-governmental organizations (NGOs) to manage humanitarian projects, beneficiary enrollments, direct aid delivery, M&E indicators, financial grants, and compliance reporting with role-based access control (RBAC).

---

## 🌟 Key Features

* **Executive Analytics Dashboard**: Real-time KPI summaries, interactive Recharts visualizations (project statuses donut chart, budget vs. expenditure comparison bar chart, aid sector distributions, and recent activity timelines).
* **Project Portfolio Management**: Full CRUD operations with automatic project code generation (`PRJ-2025-XXX`), location tagging, start/end timelines, budget allocation, and donor/partner linkage.
* **Beneficiary Registry**: Comprehensive demographic registration with vulnerability classifications (*Female-headed households, Elderly, IDP, Youth at Risk, Persons with Disability*) and personalized aid delivery logs.
* **Activity & Workplan Scheduling**: Field activity scheduling with expected vs. verified actual output achievement tracking.
* **Intervention Tracking**: Direct humanitarian aid delivery records (*Food Assistance, WASH, Agricultural Kits, Skills Grants, Cash Transfers*).
* **Monitoring & Evaluation (M&E)**: Quantitative logframe tracker with baseline, target, and actual result tracking with automatic achievement percentage progress calculation.
* **Finance & Grants Control**: Project budget line allocations (*Direct Activity Costs, Personnel, Equipment, Training, Overhead*) and verified expense voucher logs with real-time burn rate calculations.
* **Institutional Donors & Partners**: Directory of bilateral funding agencies and implementing partners.
* **Reporting & Document Export Center**: Multi-criteria filters with direct **PDF Generation** (via `jsPDF`), **CSV Export**, and print-ready layouts.
* **User Management & RBAC**: Administrator console with dynamic role assignments (*Administrator, Project Officer, Finance Officer, M&E Officer*).
* **System Audit Trail**: Immutable logging of database mutations and authentication events with JSON payload inspection.
* **Offline / Demo Presentation Mode**: Built-in fallback dataset with instant 1-click role switching for academic defense and viva presentations.

---

## 🛠️ Technology Stack

* **Frontend**: React 18 (Vite)
* **Styling**: Tailwind CSS
* **Database & Auth**: Supabase PostgreSQL + Row Level Security (RLS)
* **Data Visualization**: Recharts
* **Icons**: Lucide React
* **PDF & CSV Generation**: jsPDF + jsPDF-AutoTable

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone <YOUR_REPOSITORY_URL>
cd adra

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and provide your Supabase credentials:
```bash
cp .env.example .env
```
Update `.env` with:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Database Setup (Supabase)
Run the SQL scripts located in the `supabase/` folder:
1. `supabase/schema.sql` — Creates all 12 normalized tables, views, triggers, and RLS security policies.
2. `supabase/seed.sql` — Seeds realistic sample projects, beneficiaries, indicators, and financial records.

### 5. Running Locally
```bash
# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## 🔒 User Roles & Permissions Matrix

| Module | Administrator | Project Officer | Finance Officer | M&E Officer |
|---|:---:|:---:|:---:|:---:|
| **Dashboard** | Full View | Field View | Financial View | M&E View |
| **Projects** | Full CRUD | Full CRUD | Read Only | Read Only |
| **Beneficiaries** | Full CRUD | Full CRUD | Read Only | Read Only |
| **Activities** | Full CRUD | Full CRUD | Read Only | Read Only |
| **Interventions** | Full CRUD | Full CRUD | Read Only | Read Only |
| **M&E / Indicators** | Full CRUD | Read Only | Read Only | Full CRUD |
| **Finance / Budgets** | Full CRUD | Read Only | Full CRUD | Read Only |
| **Donors & Partners** | Full CRUD | Read Only | Read Only | Read Only |
| **Reports & Exports** | Full Access | Full Access | Full Access | Full Access |
| **User Management** | Full Access | No Access | No Access | No Access |
| **Audit Logs** | Full Access | No Access | No Access | No Access |

---

## 📄 License
This project was developed for university software engineering demonstration and evaluation purposes.
