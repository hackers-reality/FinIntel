# Frontend Dockerfile (Tactical Interface)
FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install a simple server for the static files
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "5173"]
