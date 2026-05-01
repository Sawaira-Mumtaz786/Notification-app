# Notifications System

A full-stack notification management system built with React, NestJS, and MongoDB.

## Features
- User Registration & Login with JWT authentication
- Create, Read, Update, Delete notifications
- Category-based color coding (INFO=Blue, WARNING=Yellow, ERROR=Red)
- Real-time dismissible banners (max 5 shown)
- "You have more notifications" banner when >5 undismissed
- INFO notifications auto-dismiss after 90 seconds
- Protected routes (redirect to login if not authenticated)
- Password hashing with bcrypt
- Server-side input validation
- IDOR protection (users can only access their own notifications)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite |
| Backend | NestJS + TypeScript |
| Database | MongoDB (local) |
| ODM | Mongoose |
| Authentication | JWT + bcrypt |
| Validation | class-validator + class-transformer |
notification-app/
├── backend/
│ ├── src/
│ │ ├── auth/ # JWT authentication (guards, strategies)
│ │ ├── users/ # User module (register, login)
│ │ ├── notifications/ # Notifications CRUD module
│ │ ├── app.module.ts # Root application module
│ │ └── main.ts # Application entry point
│ ├── .env # Environment variables
│ └── package.json
├── frontend/
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── pages/ # Login, Register, Dashboard pages
│ │ ├── services/ # API call logic
│ │ ├── contexts/ # React context for auth state
│ │ ├── types/ # TypeScript interfaces
│ │ ├── App.tsx # Main app with routing
│ │ └── main.tsx # React entry point
│ └── package.json
├── screenshots/ # Application screenshots
└── README.md

## Prerequisites

Before running the project, make sure you have installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local installation) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)

## Setup Instructions

### 1. Clone the Repository

git clone https://github.com/Sawaira-Mumtaz786/Notification-app.git
cd Notification-app


### 2. Backend Setup

cd backend
npm install

Create a `.env` file in the backend folder (see Environment Variables below).

npm run start:dev

The backend server runs on: **http://localhost:3000**

### 3. Frontend Setup

Open a new terminal:

cd frontend
npm install
npm run dev

The frontend runs on: **http://localhost:5173**

### 4. Start MongoDB

Make sure MongoDB is running locally:

net start MongoDB


### 5. Open the Application

Go to: **http://localhost:5173**

## Environment Variables

Create a `.env` file in the `backend` folder with the following:

MONGO_URI=mongodb://localhost:27017/notifications
JWT_SECRET=mySuperSecretKey123

**Note:** Never commit the `.env` file to GitHub. It's already in `.gitignore`.

## API Endpoints

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| POST | /users/register | Register a new user | No |
| POST | /auth/login | Login and get JWT token | No |
| GET | /users/me | Get current user info | Yes |
| GET | /notifications | Get all notifications | Yes |
| GET | /notifications/undismissed | Get undismissed notifications | Yes |
| GET | /notifications/:id | Get single notification | Yes |
| POST | /notifications | Create new notification | Yes |
| PATCH | /notifications/:id | Update notification | Yes |
| DELETE | /notifications/:id | Delete notification | Yes |
| PATCH | /notifications/:id/dismiss | Dismiss notification | Yes |

## Running Tests

cd backend
npm test


## Security Improvements Over Original

The original application (Angular + Express.js) had security issues. This version fixes:
- **MD5 → bcrypt**: Passwords are hashed with bcrypt instead of broken MD5
- **Password Hash Exposure**: Password hash is never sent to the client
- **Server-Side Validation**: All inputs are validated using DTOs and class-validator
- **IDOR Protection**: Users can only access their own notifications
- **JWT Authentication**: Stateless authentication with token expiration

## Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB connection error | Run `net start MongoDB` as Administrator |
| Port 3000 already in use | Run `npx kill-port 3000` |
| Frontend blank page | Clear `.vite` cache: `Remove-Item -Recurse -Force node_modules/.vite` |
| Login fails | Make sure backend is running on port 3000 |

## Author

**Sawaira Mumtaz**

GitHub: [Sawaira-Mumtaz786](https://github.com/Sawaira-Mumtaz786)
---
## License

This project is created for an internship assignment.


