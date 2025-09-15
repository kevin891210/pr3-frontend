# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Clean install and rebuild native modules
RUN rm -rf node_modules package-lock.json
RUN npm install
RUN npm rebuild

# Copy source code
COPY . .

# Build application
RUN npm run build

# Runtime stage with ops server
FROM node:20-alpine

# Install nginx
RUN apk add --no-cache nginx supervisor

# Setup nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY ops/nginx/default.conf /etc/nginx/http.d/default.conf
COPY ops/config/app-config.example.json /usr/share/nginx/html/config/app-config.json

# Setup ops server
WORKDIR /ops
COPY ops/package.json ops/server.js ./
RUN npm install --production

# Setup supervisor
COPY ops/supervisord.conf /etc/supervisord.conf

# Create nginx directories
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp /run/nginx

HEALTHCHECK --interval=30s --timeout=2s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

EXPOSE 80 8080
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]