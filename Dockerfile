FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --production

# Copy source code  
COPY server ./server

# Expose API port
EXPOSE 3000

# Start API server only (no frontend build needed - Vercel handles that)
ENV DATABASE_URL=${DATABASE_URL}
ENV ENVIRONMENT=production
ENV PORT=3000

CMD ["node", "--import", "tsx", "server/entry-node.ts"]
