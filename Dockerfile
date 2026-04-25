FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code  
COPY . .

# Build frontend
RUN npm run build

# Expose API port
EXPOSE 3000

# Start API server
ENV DATABASE_URL=${DATABASE_URL}
ENV ENVIRONMENT=production
ENV PORT=3000

CMD ["npm", "run", "dev:api"]
