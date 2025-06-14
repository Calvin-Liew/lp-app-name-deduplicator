# LP App Name Deduplicator Server

This is the backend server for the LP App Name Deduplicator application. It provides APIs for managing app names, clusters, and user authentication.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/app-dedupe
   JWT_SECRET=your-secret-key-here
   NODE_ENV=development
   ```

3. Start MongoDB:
   ```bash
   mongod
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST `/api/users/register` - Register a new user
- POST `/api/users/login` - Login user
- GET `/api/users/me` - Get current user info

### App Names
- GET `/api/apps` - Get all app names
- GET `/api/apps/unconfirmed` - Get unconfirmed app names
- GET `/api/apps/confirmed` - Get confirmed app names
- POST `/api/apps` - Create new app name
- PATCH `/api/apps/:id` - Update app name
- PATCH `/api/apps/:id/confirm` - Confirm app name

### Clusters
- GET `/api/clusters` - Get all clusters
- POST `/api/clusters` - Create new cluster
- PATCH `/api/clusters/:id` - Update cluster

## Development

The server is built with:
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT for authentication

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm run lint` - Run ESLint
- `npm test` - Run tests 