FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile || npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy rest of the application
COPY . .

# Build application
RUN npm run build

# Production image - use vite preview
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create nodejs user if it doesn't exist
RUN if ! id -u nodejs >/dev/null 2>&1; then \
      if ! getent group nodejs >/dev/null 2>&1; then \
        groupadd --system --gid 1001 nodejs; \
      fi; \
      useradd --system --uid 1001 --gid nodejs nodejs; \
    fi

# Copy built files and node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 3000

CMD ["npm", "run", "start"]
