# Frontend Build Stage
FROM node:22-alpine AS fe-build
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./

# Build to /app/frontend/dist
ARG PUBLIC_URL=/f25-the-shire
ARG API_BASE_URL=/api
ENV PUBLIC_URL=${PUBLIC_URL}
ENV VITE_API_URL=${API_BASE_URL}
RUN npm run build

# Backend Build Stage
FROM node:22-alpine AS be-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Final Runtime Stage
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Install PostgreSQL client (for pg_isready)
RUN apk add --no-cache postgresql-client bash

# Copy backend dependencies
COPY --from=be-deps /app/backend/node_modules /app/backend/node_modules
COPY backend/ /app/backend/
RUN dos2unix /app/backend/start.sh && chmod +x /app/backend/start.sh


# Copy schema and seed files
COPY database/ /app/database/

# Copy frontend build output
COPY --from=fe-build /app/frontend/dist /app/frontend_dist

# Expose backend port
EXPOSE 3000

# Start the backend server
CMD ["node", "backend/server.js"]