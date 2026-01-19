# Multi-stage Dockerfile for Kernex Frontend (Next.js)
# Note: Frontend is deployed to Vercel in production
# This Dockerfile is for local development and testing only

# Stage 1: Dependencies
FROM node:20-alpine as deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine as builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine as runtime

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Copy package files
COPY --chown=appuser:appuser package*.json ./

# Copy public and .next from builder
COPY --chown=appuser:appuser --from=builder /app/.next ./.next
COPY --chown=appuser:appuser --from=builder /app/public ./public
COPY --chown=appuser:appuser --from=builder /app/node_modules ./node_modules

# Switch to app user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
