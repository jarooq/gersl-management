FROM node:20-alpine

WORKDIR /app

# Copy manifests first so npm ci can cache across code changes
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/

RUN npm ci --include=dev
RUN cd server && npm ci --include=dev

# Now the source
COPY . .

# Build the frontend — server.js serves /app/dist at runtime
RUN npm run build

EXPOSE 3001

WORKDIR /app/server
CMD ["npm", "start"]
