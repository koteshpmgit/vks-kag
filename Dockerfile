# Key Artifact Generator - app image (Node.js backend + static frontend)
FROM node:20-alpine

WORKDIR /app

# Copy source INCLUDING the host-installed backend/node_modules.
# On this machine HTTPS to registry.npmjs.org is TLS-intercepted inside the
# Docker VM (certificate verify fails), so npm cannot download packages during
# the build. All dependencies (express, pg, cors, dotenv) are pure JavaScript,
# so the host's node_modules tree is fully portable into the Linux container.
# Prerequisite: run "npm install" in ./backend on the host before building.
COPY backend ./backend
COPY frontend ./frontend

# If node_modules did not come with the copy, fall back to npm ci with
# TLS-interception tolerance and retries; then hard-verify either way -
# npm can fail ("Exit handler never called") yet still exit 0 with an
# incomplete node_modules, so the exit code cannot be trusted.
RUN cd backend \
    && if ! node -e "require.resolve('express')" 2>/dev/null; then \
        npm config set strict-ssl false; \
        npm config set fetch-retries 5; \
        npm config set fetch-retry-maxtimeout 120000; \
        attempt=1; \
        until node -e "require.resolve('express'); require.resolve('pg'); require.resolve('cors'); require.resolve('dotenv')" 2>/dev/null; do \
            if [ "$attempt" -gt 3 ]; then echo "npm install failed verification after 3 attempts" >&2; exit 1; fi; \
            echo "install attempt $attempt"; \
            rm -rf node_modules; \
            npm cache clean --force >/dev/null 2>&1 || true; \
            npm ci --omit=dev --no-audit --no-fund --no-progress || true; \
            attempt=$((attempt+1)); \
        done; \
    fi \
    && node -e "require.resolve('express'); require.resolve('pg'); require.resolve('cors'); require.resolve('dotenv'); console.log('deps verified')"

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

WORKDIR /app/backend
CMD ["node", "server.js"]
