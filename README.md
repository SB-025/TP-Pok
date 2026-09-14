# PokAp - Virtual-Chip Multiplayer Game

A real-time multiplayer game application. 

## Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account (or local Replica Set for transactions)

## MongoDB Atlas Setup
1. Create a free cluster on MongoDB Atlas.
2. Under "Network Access", allow your IP address.
3. Under "Database Access", create a database user and password.
4. Go to "Database", click "Connect", choose "Drivers", and copy the connection string.
5. Replace `<password>` with your database user's password in the string.

## Environment Variables
Both `client/` and `server/` have an `.env.example` file. Copy these to `.env` in their respective directories and update the values.

**Server (`server/.env`)**
- `PORT`: Port for the Express server (default 5000)
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for signing JWT tokens
- `CLIENT_URL`: The URL of your frontend (e.g., http://localhost:5173)

**Client (`client/.env`)**
- `VITE_API_URL`: Backend API URL (e.g., http://localhost:5000/api)
- `VITE_SOCKET_URL`: Backend Socket URL (e.g., http://localhost:5000)

## Installation

Run the following in the root directory:
```bash
cd server
npm install
cd ../client
npm install
```

## Development Commands

Start the backend (from `server/`):
```bash
npm run dev
```

Start the frontend (from `client/`):
```bash
npm run dev
```

## Production Build Commands

Build the backend:
```bash
cd server
npm run build
```

Build the frontend:
```bash
cd client
npm run build
```
