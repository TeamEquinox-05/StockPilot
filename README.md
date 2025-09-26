# StockPilot - Inventory Management System

A modern inventory management system built with React, Node.js, and MongoDB.

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your values:
   ```env
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
   MONGODB_URI=mongodb://localhost:27017/stockpilot
   PORT=5000
   NODE_ENV=development
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your values:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_API_AUTH_ENDPOINT=/api/auth
   VITE_APP_NAME=StockPilot
   VITE_ENV=development
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### MongoDB Setup

Make sure you have MongoDB running locally on port 27017, or update the `MONGODB_URI` in your backend `.env` file to point to your MongoDB instance.

## Environment Variables

### Backend (.env)
- `JWT_SECRET`: Secret key for JWT token signing (make it long and complex)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Port number for the backend server
- `NODE_ENV`: Environment mode (development/production)

### Frontend (.env)
- `VITE_API_BASE_URL`: Base URL for the backend API
- `VITE_API_AUTH_ENDPOINT`: Authentication endpoint path
- `VITE_APP_NAME`: Application name displayed in the UI
- `VITE_ENV`: Environment mode

## Features

- ✅ User authentication with JWT tokens
- ✅ Protected routes and automatic login redirects
- ✅ Clean, professional UI design
- ✅ Responsive sidebar navigation
- ✅ Environment-based configuration
- ✅ Secure token management

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- ShadCN UI components
- React Router for navigation

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- CORS enabled

## Development

Both frontend and backend support hot reloading during development. Make sure to have both servers running for full functionality.

Frontend: http://localhost:5173
Backend: http://localhost:5000