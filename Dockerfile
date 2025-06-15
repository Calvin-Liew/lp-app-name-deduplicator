FROM node:18-alpine

# Set working directory
WORKDIR /app/server

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY server/ ./

# Install additional dependencies
RUN npm install --save multer csv-parse bcrypt @types/multer @types/csv-parse @types/bcrypt

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"] 