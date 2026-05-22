# Smart Phonebook Search Engine

A full-stack **Smart Phonebook Search Engine** web application designed to help users store, search, organize, import, export, and manage contacts efficiently. The project supports user authentication, contact CRUD operations, fast search, sorting, favorite contacts, CSV import/export, responsive dashboard UI, and database-backed contact storage.

This project is developed as an academic full-stack web application using **React**, **Django REST Framework**, and **MongoDB Atlas**.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Contact Field Rules](#contact-field-rules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Full Project](#running-the-full-project)
- [CSV Import Format](#csv-import-format)
- [GitHub Push Instructions](#github-push-instructions)
- [Recommended Git Ignore](#recommended-git-ignore)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Future Enhancements](#future-enhancements)
- [Developer](#developer)
- [Repository](#repository)
- [License](#license)

---

## Project Overview

The **Smart Phonebook Search Engine** is a web-based contact management system where each registered user can create and manage their own personal phonebook.

Users can register, log in, save contacts, search contacts quickly, sort contacts, mark important contacts as favorites, import contacts from CSV, export contacts to CSV, and manage all contact details through a clean and responsive dashboard.

The main goal of this project is to provide a simple, attractive, and efficient phonebook system with smart search functionality.

---

## Features

- User registration
- User login
- Google login support
- User-wise contact storage
- Add new contacts
- View saved contacts
- Edit existing contacts
- Delete contacts
- Search contacts quickly
- Search suggestions / autocomplete
- Sort contacts
- Mark contacts as favorite
- Import contacts using CSV
- Export contacts using CSV
- Responsive dashboard design
- Split contact view layout
- Optional contact details
- Duplicate contact detection mainly using phone number
- Birthday reminder support
- Optional profile image support
- Light and dark theme option
- Clean and user-friendly interface

---

## Contact Field Rules

The project supports the following contact fields:

| Field | Required | Description |
|---|---|---|
| Phone Number | Yes | Main required field for saving a contact |
| Name | No | Contact name, supports emojis and special characters |
| Email | No | Contact email address |
| Company | No | Company or organization name |
| Address | No | Contact address |
| Tags | No | Tags for grouping or searching contacts |
| Favorite | No | Marks a contact as favorite |
| Notes | No | Extra information about the contact |
| Birthday | No | Used for birthday reminders |
| Profile Image | No | Optional contact image |

Phone number validation rules:

- Phone number is the only required field.
- Phone number must contain only digits.
- Main local phone number must be exactly **10 digits**.
- Country code is optional.
- Duplicate detection is mainly based on phone number.
- Other fields are optional.

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- Django
- Django REST Framework

### Database

- MongoDB Atlas

### Authentication

- Username and password authentication
- Google login support

### Tools

- VS Code
- Git
- GitHub
- MongoDB Atlas

---

## Project Structure

```text
smart-phonebook-search-engine/
│
├── backend/
│   ├── config/
│   ├── contacts/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── media/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── .gitignore
├── README.md
└── package-lock.json
```

---

## Prerequisites

Before running this project, install the following:

- Python 3.10 or above
- Node.js
- npm
- Git
- VS Code
- MongoDB Atlas account

Check installed versions:

```bash
python --version
node --version
npm --version
git --version
```

---

# Setup Instructions

Follow the steps below to run the project locally.

---

## 1. Clone the Repository

```bash
git clone https://github.com/DEVAKRUPA/smart-phonebook-search-engine.git
```

Go inside the project folder:

```bash
cd smart-phonebook-search-engine
```

---

# Backend Setup

## 2. Open Backend Folder

```bash
cd backend
```

---

## 3. Create Virtual Environment

```bash
python -m venv venv
```

---

## 4. Activate Virtual Environment

### Windows PowerShell

```powershell
.\venv\Scripts\activate
```

### Windows CMD

```cmd
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

After activation, your terminal should show:

```text
(venv)
```

---

## 5. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

## 6. Create Backend Environment File

Create a `.env` file inside the `backend` folder.

You can copy the example file:

### Windows

```powershell
copy .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

---

## 7. Configure Backend Environment Variables

Open the `.env` file and update your values.

Example:

```env
SECRET_KEY=your_django_secret_key
DEBUG=True

MONGODB_URI=your_mongodb_atlas_connection_string

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Important:

- Do not push the real `.env` file to GitHub.
- Only push `.env.example`.
- Keep MongoDB URI, secret key, and Google OAuth credentials private.

---

## 8. MongoDB Atlas Setup

Follow these steps to configure MongoDB Atlas:

1. Create a MongoDB Atlas account.
2. Create a new cluster.
3. Create a database user.
4. Add your current IP address in **Network Access**.
5. Copy the MongoDB connection string.
6. Paste the connection string into your backend `.env` file.

Example MongoDB URI:

```env
MONGODB_URI=mongodb+srv://username:password@clustername.mongodb.net/smart_phonebook_db
```

Replace:

```text
username      -> Your MongoDB Atlas username
password      -> Your MongoDB Atlas password
clustername   -> Your MongoDB cluster name
database name -> smart_phonebook_db
```

---

## 9. Run Django Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 10. Create Django Superuser

```bash
python manage.py createsuperuser
```

Enter username, email, and password when asked.

---

## 11. Start Backend Server

```bash
python manage.py runserver
```

Backend will run at:

```text
http://127.0.0.1:8000/
```

Django Admin Panel:

```text
http://127.0.0.1:8000/admin/
```

API Base URL:

```text
http://127.0.0.1:8000/api/
```

---

# Frontend Setup

Open a new terminal. Keep the backend server running.

---

## 12. Go to Frontend Folder

From the project root:

```bash
cd frontend
```

If you are inside the backend folder:

```bash
cd ../frontend
```

---

## 13. Install Frontend Dependencies

```bash
npm install
```

---

## 14. Create Frontend Environment File

Create a `.env` file inside the `frontend` folder.

Add this:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If your frontend code uses `REACT_APP_API_BASE_URL`, then use:

```env
REACT_APP_API_BASE_URL=http://127.0.0.1:8000
```

Use the variable name that is already used in your frontend source code.

---

## 15. Start Frontend Server

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:5173/
```

Open this URL in your browser.

---

# Running the Full Project

To run the complete project, use two terminals.

---

## Terminal 1: Backend

```powershell
cd backend
.\venv\Scripts\activate
python manage.py runserver
```

Backend URL:

```text
http://127.0.0.1:8000/
```

---

## Terminal 2: Frontend

```powershell
cd frontend
npm run dev
```

Frontend URL:

```text
http://localhost:5173/
```

---

# CSV Import Format

The project supports CSV import for contacts.

Recommended CSV format:

```csv
name,phone_number,email,company,address,tags,birthday,notes
John Doe,9876543210,john@example.com,ABC Company,Bangalore,friends,2000-01-01,Sample note
Jane Smith,9876543211,jane@example.com,XYZ Company,Mysore,work,1999-05-15,Important client
```

CSV rules:

- `phone_number` is required.
- Phone number must contain only digits.
- Main local phone number must be exactly 10 digits.
- Other fields are optional.
- Avoid duplicate phone numbers.

---

# CSV Export

The application allows users to export saved contacts into a CSV file.

This helps users:

- Back up contact data
- Transfer contacts
- Maintain offline records
- Reuse contact data in other systems

---

# GitHub Push Instructions

Use these commands to push the project to GitHub.

---

## 1. Initialize Git

```bash
git init
```

---

## 2. Add Remote Repository

```bash
git remote add origin https://github.com/DEVAKRUPA/smart-phonebook-search-engine.git
```

If remote already exists:

```bash
git remote set-url origin https://github.com/DEVAKRUPA/smart-phonebook-search-engine.git
```

---

## 3. Check Git Status

```bash
git status
```

Make sure these files/folders are not added:

```text
.env
venv/
node_modules/
dist/
build/
media/
__pycache__/
*.log
```

---

## 4. Add Files

```bash
git add .
```

---

## 5. Commit Files

```bash
git commit -m "Initial smart phonebook search engine project"
```

---

## 6. Push to GitHub

```bash
git branch -M main
git push -u origin main
```

---

# Recommended Git Ignore

Create a `.gitignore` file in the project root and add:

```gitignore
# Python cache
__pycache__/
*.py[cod]
*.pyo
*.pyd

# Django files
*.sqlite3
db.sqlite3
media/
staticfiles/
*.log

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Virtual environment
venv/
env/
.venv/

# Node / React
node_modules/
dist/
build/

# Cache
.cache/
.pytest_cache/
coverage/

# IDE / Editor
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db
```

---

# Common Commands

## Backend Commands

```bash
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py check
```

---

## Frontend Commands

```bash
npm install
npm run dev
npm run build
```

---

## Git Commands

```bash
git status
git add .
git commit -m "Update project"
git push
```

---

# Build Frontend for Production

Inside the `frontend` folder:

```bash
npm run build
```

This creates a production build folder:

```text
dist/
```

Do not push `dist/` to GitHub unless specifically required.

---

# Troubleshooting

## Backend Server Not Starting

Check if virtual environment is activated:

```powershell
.\venv\Scripts\activate
```

Run Django check:

```bash
python manage.py check
```

Then start server:

```bash
python manage.py runserver
```

---

## Frontend Server Not Starting

Run:

```bash
npm install
npm run dev
```

---

## API Connection Error

Make sure backend is running:

```text
http://127.0.0.1:8000/
```

Check frontend `.env` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

or:

```env
REACT_APP_API_BASE_URL=http://127.0.0.1:8000
```

Use the variable name that your frontend code uses.

---

## MongoDB Connection Error

Check the following:

- MongoDB Atlas URI is correct
- MongoDB username is correct
- MongoDB password is correct
- IP address is added in MongoDB Atlas Network Access
- `.env` file is inside the backend folder
- Backend server was restarted after changing `.env`

---

## GitHub Push Rejected

If GitHub rejects push because remote already has files, run:

```bash
git pull origin main --allow-unrelated-histories
```

Then push again:

```bash
git push -u origin main
```

---

## CSRF or Login Error

Try the following:

- Clear browser cookies
- Restart backend server
- Restart frontend server
- Check CORS settings
- Check CSRF trusted origins
- Make sure frontend and backend URLs are correctly configured

Example:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

# Security Notes

Do not push these files or folders to GitHub:

```text
.env
venv/
node_modules/
media/
dist/
build/
__pycache__/
*.log
```

Keep these private:

- Django secret key
- MongoDB Atlas URI
- MongoDB username
- MongoDB password
- Google client ID
- Google client secret

Only push `.env.example`, not the real `.env`.

---

# Future Enhancements

- Advanced contact grouping
- Optimized search using Trie or inverted index
- Recent contacts section
- Contact activity history
- Dashboard analytics
- Email integration
- SMS integration
- Cloud image storage
- Contact sharing feature
- Advanced duplicate contact detection
- More theme customization

---

# Developer

Developed by:

**Devakrupa Parashuramsingh Rajput**

---

# Repository

```text
https://github.com/DEVAKRUPA/smart-phonebook-search-engine
```

---

# License

This project is created for academic and learning purposes.
