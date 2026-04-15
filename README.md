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

## Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Backend:** NestJS + TypeScript
- **Database:** MongoDB (local)
- **Auth:** JWT + bcrypt

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB installed locally
- npm

### Backend Setup
```bash

cd backend
npm install
npm run start:dev

Runs on http://localhost:3000

Frontend setup
cd frontend
npm install
npm run dev

Runs on http://localhost:5173

Environment Variables (.env in backend folder)

MONGO_URI=mongodb://localhost:27017/notifications
JWT_SECRET=mySuperSecretKey123

API Endpoints

Method	Endpoint	Description
POST	/users/register	Register user
POST	/auth/login	Login, returns JWT
GET	/notifications	Get all notifications
POST	/notifications	Create notification
PATCH	/notifications/:id	Update notification
DELETE	/notifications/:id	Delete notification
PATCH	/notifications/:id/dismiss	Dismiss notification

Author
Sawaira Mumtaz
