# Hotel Room Booking System — AzureStay Grand Hotel

**College Course:** Software Testing and Quality Assurance (STQA)  
**Team Number:** 11  
**Team Members:**  
1. **Tejas M P**  
2. **Ashok N M**  

**Assigned Automation Tool:** TestCafe (`3.7.7`)  
**Target Browser:** Google Chrome  

---

## Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (Responsive Blue & White Hospitality UI)
- **Backend:** Node.js (`v26.13.1`) & Express.js (`4.x`)
- **Database:** SQLite (`node:sqlite` `DatabaseSync` with Foreign Keys & WAL mode)
- **Authentication & Sessions:** `bcryptjs` password hashing + SQLite-persisted `HttpOnly` session cookies (`azurestay.sid`)
- **E2E Automation:** TestCafe (`3.7.7`) running in Google Chrome

---

## Project Structure

```
hotel-room-booking/
├── frontend/
│   ├── assets/images/            # Local hotel & room photography (.jpg)
│   ├── css/styles.css            # Responsive blue & white design system
│   ├── js/                       # Modular frontend logic & API client
│   ├── index.html                # Module 1: Homepage, search, featured rooms, about, contact
│   ├── rooms.html                # Module 3: Room listing, search & multi-filter catalog
│   ├── room-details.html         # Module 3: Room details, amenities & booked dates
│   ├── register.html             # Module 2: Customer registration
│   ├── login.html                # Module 2: Customer login
│   ├── booking.html              # Module 4: Room booking, validation & live price math
│   ├── confirmation.html         # Module 4: Unique booking ID confirmation receipt
│   ├── dashboard.html            # Module 5: Guest profile, booking history & cancellation
│   ├── admin-login.html          # Module 6: Admin portal login
│   └── admin-dashboard.html      # Module 6: Admin KPIs, Room CRUD, Bookings & Users
├── backend/
│   ├── config/db.js              # SQLite connection, schema init & sample seeding
│   ├── controllers/              # Auth, Room, Booking, Admin, Contact controllers
│   ├── middleware/               # Auth guards, SQLite session middleware, error handler
│   ├── routes/                   # REST API route definitions
│   ├── utils/                    # Validation rules & unique BK-YYYYMMDD-XXXXXX generator
│   └── server.js                 # Express server serving API + static frontend
├── database/
│   ├── schema.sql                # SQLite DDL (users, admins, rooms, bookings, contact_messages, sessions)
│   ├── init.js                   # CLI database initialization & --reset script
│   └── hotel_booking.db          # SQLite database file (auto-created on init)
├── tests/
│   ├── .testcaferc.json          # TestCafe Chrome & screenshot config
│   ├── helpers/                  # Test data, centralized selectors, reusable actions
│   ├── fixtures/                 # 7 TestCafe fixtures covering 26 E2E test cases (TC01-TC26)
│   ├── generate-html-report.js   # Converts TestCafe JSON output to HTML & Markdown reports
│   └── run-tests.js              # One-command TestCafe runner (DB reset -> Server -> Tests -> Report)
├── screenshots/                  # Genuine TestCafe evidence & failure screenshots
├── reports/                      # TestCafe JSON, HTML & Markdown execution reports
├── documentation/                # STQA submission docs, diagrams, defect report & 10-slide PPT
├── .env                          # Local runtime configuration
├── .env.example                  # Sample environment template
├── package.json                  # Project scripts & dependencies
└── README.md                     # Setup, execution & troubleshooting guide
```

---

## Windows / VS Code Execution Guide

### 1. Prerequisites
- **Node.js 22+** (tested on `v26.13.1` with built-in `node:sqlite`)
- **Google Chrome** installed at standard Windows path (`C:\Program Files\Google\Chrome\Application\chrome.exe`)
- **Python 3.10+** (only needed if regenerating the `.pptx` presentation)

### 2. Install Dependencies
Open the `hotel-room-booking` folder in **VS Code**, open the Integrated Terminal (`Ctrl + ~`), and run:

```powershell
cd "hotel-room-booking"
npm install
```

*(To install TestCafe independently in a fresh project: `npm install --save-dev testcafe`)*

### 3. Initialize the SQLite Database
```powershell
npm run init-db
```
To wipe and re-seed fresh sample data at any time:
```powershell
npm run reset-db
```

### 4. Start the Application Server
```powershell
npm start
```
The Express server and static frontend start on:
- **Website URL:** `http://localhost:3000` (or `http://127.0.0.1:3000`)
- **Admin Login URL:** `http://localhost:3000/admin-login.html`

---

## Demo Credentials

| Role | Email / Username | Password | Login URL |
|------|------------------|----------|-----------|
| **Guest Customer 1** | `john.doe@example.com` | `User@123` | `http://localhost:3000/login.html` |
| **Guest Customer 2** | `priya.sharma@example.com` | `User@123` | `http://localhost:3000/login.html` |
| **Admin (Superadmin)** | `admin@azurestay.com` (or `admin`) | `Admin@123` | `http://localhost:3000/admin-login.html` |
| **Admin (Manager)** | `ashok@azurestay.com` (or `manager`) | `Manager@123` | `http://localhost:3000/admin-login.html` |

---

## Running TestCafe Automated Tests (26 E2E Test Cases)

### Recommended Single-Command Execution (Headless Chrome)
Automatically resets the SQLite database, launches Express, runs all 26 TestCafe tests in Chrome, captures screenshots, generates HTML/JSON/Markdown reports, and shuts down cleanly:
```powershell
npm test
```

### Visible Google Chrome Execution (For Live Demo / Viva)
Watches TestCafe drive a real Google Chrome window step by step:
```powershell
npm run test:headed
```

### Direct TestCafe CLI Command (If Server Is Already Running)
```powershell
npx testcafe "chrome --disable-native-automation" tests/fixtures/*.test.js
```

### Generated Reports & Evidence
- **HTML Report:** `reports/test-execution-report.html`
- **JSON Report:** `reports/testcafe-results.json`
- **Markdown Summary:** `reports/test-execution-summary.md`
- **Screenshots:** `screenshots/evidence/`

---

## Troubleshooting (Windows)
1. **TestCafe `E1063: Cannot establish one or more browser connections`:**
   - `npm test` automatically isolates each run's Chrome profile folder and selects free server/TestCafe ports, preventing `lockfile` and `EADDRINUSE` conflicts even if `npm start` is already running.
   - If you invoked `npx testcafe` directly and an older headless Chrome crashed, terminate orphaned TestCafe Chrome profiles and clear `%LOCALAPPDATA%\Temp\testcafe`:
     ```powershell
     Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -match 'testcafe' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
     Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Temp\testcafe" -ErrorAction SilentlyContinue
     ```
2. **Port `3000` already in use:** Stop any existing Node server (`Get-Process node | Stop-Process -Force`) or change `PORT=3001` in `.env` (and set `$env:TEST_PORT=3001` before `npm test`).
3. **TestCafe Chrome connection hangs on newer Chrome versions:** Keep `--disable-native-automation` (already configured in `tests/.testcaferc.json` and `tests/run-tests.js`) so TestCafe runs cleanly via Hammerhead proxy mode.
4. **PowerShell script execution policy error (`npm.ps1` blocked):** Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` or invoke via `cmd /c npm test`.
5. **Resetting sample rooms/bookings after manual testing:** Run `npm run reset-db`.
