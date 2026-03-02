# M@SA PLATFORM — WINDOWS SETUP GUIDE
# Step-by-step from zero to running server
# Follow every step in exact order

=======================================================
STEP 1 — INSTALL NODE.JS
=======================================================

1. Open your browser and go to:
   https://nodejs.org

2. Click the big green button that says "LTS" (Long Term Support)
   — Do NOT download the "Current" version

3. Run the downloaded installer (node-v##.##.##-x64.msi)
   - Click Next → Accept license → Next → Next → Install
   - When asked "Tools for Native Modules" → tick the checkbox → Next
   - Click Install → Yes to admin prompt → Finish

4. VERIFY it worked — open Command Prompt (press Windows+R, type cmd, Enter):
   Type:   node --version
   Should show something like: v20.11.0

   Type:   npm --version
   Should show something like: 10.2.4

   If both show versions, Node.js is installed correctly. ✓


=======================================================
STEP 2 — INSTALL POSTGRESQL
=======================================================

1. Go to:
   https://www.postgresql.org/download/windows/

2. Click "Download the installer" → choose the latest version for Windows x86-64

3. Run the installer (postgresql-##.#-windows-x64.exe)
   - Click Next
   - Installation Directory: leave as default → Next
   - Select Components: leave all ticked → Next
   - Data Directory: leave as default → Next
   - PASSWORD: Set a password for the postgres superuser
     *** WRITE THIS DOWN — you will need it ***
     Example: MyPostgres@2024
   - Port: leave as 5432 → Next
   - Locale: leave as default → Next
   - Click Next → Next → Finish

4. Stack Builder will open — you can CLOSE it (you don't need it)

5. VERIFY PostgreSQL is running:
   - Press Windows key → search "Services" → open Services
   - Look for "postgresql-x64-##" in the list
   - Status should show "Running"
   ✓


=======================================================
STEP 3 — INSTALL PGADMIN (Optional but recommended)
=======================================================

1. pgAdmin was installed automatically with PostgreSQL
   Find it in: Start Menu → PostgreSQL ## → pgAdmin 4

2. Open pgAdmin → it opens in your browser
3. It will ask for a master password — set one and remember it
4. You should see your server listed on the left
   ✓


=======================================================
STEP 4 — GET THE PROJECT FILES
=======================================================

1. Open VS Code

2. Open a terminal in VS Code:
   Menu → Terminal → New Terminal

3. Navigate to where you want the project.
   Example — Desktop:
   cd C:\Users\YourName\Desktop

4. Clone your GitHub repo (replace with your actual repo URL):
   git clone https://github.com/YOUR_USERNAME/masa-platform.git

   OR if you downloaded the files as a ZIP:
   - Extract the ZIP to your Desktop
   - In VS Code: File → Open Folder → select masa-platform folder

5. Enter the project folder:
   cd masa-platform

   You should now be inside the masa-platform folder in the terminal ✓


=======================================================
STEP 5 — INSTALL PROJECT DEPENDENCIES
=======================================================

In the VS Code terminal (make sure you're in masa-platform folder):

   npm install

This downloads all packages listed in package.json.
It creates a node_modules folder — this takes 1-3 minutes.

When it finishes you should see something like:
   added 147 packages in 45s ✓


=======================================================
STEP 6 — CREATE YOUR .ENV FILE
=======================================================

1. In VS Code, look at your file explorer on the left
2. You will see a file called .env.example
3. Right-click it → Copy
4. Right-click the masa-platform folder → Paste
5. Rename the copy to exactly:   .env
   (no .example, just .env)

6. Open the .env file and fill in your values:

   PORT=3000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=masa_db
   DB_USER=masa_user
   DB_PASSWORD=MasaDB@2024!

   SESSION_SECRET=masa-super-secret-session-key-change-this-to-random-64-chars

   ANTHROPIC_API_KEY=sk-ant-...your key here...

   PG_SUPERUSER_PASSWORD=MyPostgres@2024
   (This is the password you set during PostgreSQL installation in Step 2)

   ADMIN_SETUP_EMAIL=admin@masa.org.za
   ADMIN_SETUP_PASSWORD=Admin@MASA2024!

   Leave AWS fields empty for now (used later when going live):
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=af-south-1
   AWS_S3_BUCKET=

7. Save the .env file (Ctrl+S)


HOW TO GET YOUR ANTHROPIC API KEY:
   1. Go to https://console.anthropic.com
   2. Sign up or log in
   3. Click "API Keys" in the left menu
   4. Click "Create Key" → copy the key
   5. Paste it as the ANTHROPIC_API_KEY value in .env


=======================================================
STEP 7 — SET UP THE DATABASE
=======================================================

In the VS Code terminal:

   npm run db:setup

This will:
  - Connect to PostgreSQL as the postgres superuser
  - Create the masa_user database user
  - Create the masa_db database
  - Run the full schema (all tables)
  - Create your first admin account

You should see:
  ✓ User ready
  ✓ Database created
  ✓ Schema applied
  ✓ Admin user: admin@masa.org.za
  ✓ Site settings initialized
  ✅ Setup complete!

IF YOU GET AN ERROR like "password authentication failed":
  - Open .env and make sure PG_SUPERUSER_PASSWORD matches
    exactly what you set in Step 2


=======================================================
STEP 8 — SEED THE DATABASE (Load all subjects & topics)
=======================================================

In the VS Code terminal:

   npm run db:seed

This loads ALL grades, subjects, faculties, and topics
into the database — all CAPS-aligned content.

You should see:
  ✓ Grades seeded
  ✓ Faculties seeded
  ✓ School subjects and topics seeded
  ✓ Tertiary subjects and topics seeded
  ✓ Events seeded
  ✓ Programs seeded
  ✅ All data seeded successfully!


=======================================================
STEP 9 — START THE SERVER
=======================================================

In the VS Code terminal:

   npm run dev

You should see the M@SA banner and:
  Server running at http://localhost:3000

Open your browser and go to:
   http://localhost:3000

You should see the M@SA homepage! 🎉


=======================================================
STEP 10 — TEST ADMIN LOGIN
=======================================================

1. Go to: http://localhost:3000/admin.html
2. Login with:
   Email:    admin@masa.org.za
   Password: Admin@MASA2024!
   (or whatever you set in .env ADMIN_SETUP_PASSWORD)

3. You should see the admin dashboard ✓

IMPORTANT: Change your admin password immediately after first login
using the Change Password feature.


=======================================================
VS CODE EXTENSIONS TO INSTALL
=======================================================

Open VS Code → Extensions panel (Ctrl+Shift+X) → search and install:

1. ESLint              — catches JavaScript errors
2. Prettier            — auto-formats your code
3. PostgreSQL          — by Chris Kolkman (database viewer)
4. HTML CSS Support    — autocomplete for HTML/CSS
5. Path Intellisense   — file path autocomplete
6. GitLens             — enhanced Git features
7. REST Client         — test your API routes (optional but useful)
8. Thunder Client      — API testing like Postman (optional)


=======================================================
DAILY DEVELOPMENT WORKFLOW
=======================================================

Every time you want to work on the project:

1. Open VS Code
2. Open the masa-platform folder
3. Open terminal → run:   npm run dev
4. Open browser:          http://localhost:3000
5. Make changes to files — the server auto-restarts (nodemon)
6. Refresh browser to see changes

When done:
   Ctrl+C in the terminal to stop the server


=======================================================
USEFUL COMMANDS
=======================================================

npm run dev          — Start development server (auto-restarts)
npm start            — Start production server (no auto-restart)
npm run db:setup     — Set up database from scratch
npm run db:seed      — Reload all subject/topic seed data

In pgAdmin you can:
   - Browse all tables visually
   - Run SQL queries
   - View and edit data directly


=======================================================
PROJECT FOLDER STRUCTURE
=======================================================

masa-platform/
├── .env                 ← Your secrets (NEVER commit to GitHub)
├── .env.example         ← Template (safe to commit)
├── .gitignore           ← Keeps .env and node_modules out of GitHub
├── package.json         ← Project info and dependencies
│
├── src/                 ← Backend (Node.js + Express)
│   ├── server.js        ← Main server entry point
│   ├── db/
│   │   ├── pool.js      ← Database connection
│   │   ├── schema.sql   ← All database tables
│   │   ├── setup.js     ← Run once: creates DB and user
│   │   └── seed.js      ← Loads all CAPS content
│   ├── routes/          ← All API endpoints
│   │   ├── auth.js
│   │   ├── grades.js
│   │   ├── subjects.js
│   │   ├── faculties.js
│   │   ├── topics.js
│   │   ├── resources.js
│   │   ├── quizzes.js
│   │   ├── ai.js        ← Claude AI chatbot
│   │   ├── events.js
│   │   ├── sponsors.js
│   │   ├── programs.js
│   │   ├── publications.js
│   │   ├── comments.js
│   │   └── admin.js
│   └── middleware/
│       ├── auth.js      ← Protect admin routes
│       └── upload.js    ← File upload handling
│
├── public/              ← Frontend (HTML, CSS, JS)
│   ├── index.html       ← Homepage
│   ├── learner.html     ← School learner path
│   ├── tertiary.html    ← Tertiary student path
│   ├── subject.html     ← Individual subject page
│   ├── admin.html       ← Admin dashboard
│   ├── about.html
│   ├── events.html
│   ├── programs.html
│   ├── publications.html
│   ├── offline.html     ← PWA offline fallback
│   ├── css/
│   │   ├── main.css     ← Core styles + theme variables
│   │   └── components.css
│   ├── js/
│   │   ├── app.js       ← Shared utilities + PWA init
│   │   ├── chatbot.js   ← AI chat interface
│   │   └── quiz.js      ← Quiz engine
│   └── assets/
│       ├── manifest.json← PWA manifest
│       └── sw.js        ← Service worker (offline)
│
└── uploads/             ← Uploaded files stored here (dev only)


=======================================================
TROUBLESHOOTING
=======================================================

PROBLEM: "Cannot find module 'pg'"
SOLUTION: Run   npm install   in the project folder

PROBLEM: "password authentication failed for user postgres"
SOLUTION: Check PG_SUPERUSER_PASSWORD in your .env file
          matches what you set during PostgreSQL installation

PROBLEM: "connect ECONNREFUSED 127.0.0.1:5432"
SOLUTION: PostgreSQL is not running.
          Windows: Start Menu → Services → find PostgreSQL → Start

PROBLEM: "Port 3000 is already in use"
SOLUTION: Change PORT=3001 in .env, then restart server

PROBLEM: AI chat not working
SOLUTION: Check ANTHROPIC_API_KEY is set correctly in .env
          Get a key from https://console.anthropic.com

PROBLEM: File uploads failing
SOLUTION: Check the uploads/ folder exists in your project root
          Run:  mkdir uploads

PROBLEM: Page shows but data doesn't load
SOLUTION: Open browser DevTools (F12) → Console tab
          Look for red error messages and share them


=======================================================
NEXT STEPS AFTER LOCAL TESTING
=======================================================

When you're happy with the local version and ready to go live:

1. Set up AWS account at https://aws.amazon.com
2. We will configure:
   - EC2 instance (your server)
   - RDS PostgreSQL (managed database)
   - S3 bucket (file storage)
   - CloudFront (fast delivery)
   - Route 53 (masa.org.za DNS)
   - ACM (free HTTPS/SSL certificate)

Your guide for that deployment will be provided separately.
