# Production Multi-Service Container for VedAI
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy application code
COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]
