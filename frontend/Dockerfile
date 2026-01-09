# ============================================
# CASESTACK FRONTEND - DOCKERFILE
# Production-ready React + Vite with Nginx
# ============================================

# ============================================
# BUILD STAGE
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# ============================================
# PRODUCTION STAGE
# ============================================
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S casestack -u 1001 && \
    chown -R casestack:nodejs /usr/share/nginx/html && \
    chown -R casestack:nodejs /var/cache/nginx && \
    chown -R casestack:nodejs /var/log/nginx && \
    chown -R casestack:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R casestack:nodejs /var/run/nginx.pid

# Switch to non-root user
USER casestack

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
