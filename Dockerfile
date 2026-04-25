FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with esbuild
RUN npm install --legacy-peer-deps --production && npm install --save-dev esbuild

# Copy source code  
COPY server ./server
COPY tsconfig.json ./
COPY vite.config.ts ./

# Build API with esbuild (bundle all dependencies)
RUN npx esbuild server/entry-node.ts --bundle --platform=node --target=node20 --outfile=dist/api.js --external:postgres

# Expose API port
EXPOSE 3000

# Start compiled API server
ENV DATABASE_URL=${DATABASE_URL}
ENV ENVIRONMENT=production
ENV PORT=3000

CMD ["node", "dist/api.js"]
