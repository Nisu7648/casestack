# ============================================
# CASESTACK BACKEND - DOCKERFILE
# Production-ready Node.js + PostgreSQL
# ============================================

FROM node:18-alpine AS base

# Install dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# ============================================
# DEPENDENCIES STAGE
# ============================================
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# ============================================
# BUILD STAGE
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# ============================================
# PRODUCTION STAGE
# ============================================
FROM base AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 casestack

# Copy necessary files from builder
COPY --from=builder --chown=casestack:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=casestack:nodejs /app/prisma ./prisma
COPY --from=builder --chown=casestack:nodejs /app/src ./src
COPY --from=builder --chown=casestack:nodejs /app/package*.json ./

# Create directories for logs and uploads
RUN mkdir -p logs uploads && \
    chown -R casestack:nodejs logs uploads

# Switch to non-root user
USER casestack

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/server.casestack.js"]
