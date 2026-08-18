# Key Artifact Generator - frontend image (React build served by Nginx)
#
# Two-stage build: compile the Vite/React app to static files, then serve
# them with Nginx (which also reverse-proxies /api to the backend - see
# nginx.conf.template). BACKEND_ORIGIN/PORT are resolved into the config at
# container startup via envsubst (nginx:alpine's built-in /etc/nginx/templates
# processing), so the same image works unmodified in docker-compose (backend
# reachable at http://backend:3001 by service name) and as a standalone Cloud
# Run service (backend reachable only via its public https://...run.app URL).
# If this machine's Docker build environment cannot reach
# registry.npmjs.org (TLS interception - see the root Dockerfile for the
# same issue on the backend image), run "npm install" in ./frontend on the
# host first: the host's node_modules tree is portable into the Linux build
# stage for pure-JS deps, but rollup (a vite dependency) ships a
# platform-specific native optional-dependency, so a node_modules installed
# on a non-Linux host is NOT portable as-is - the verification below actually
# executes rollup (not just require.resolve, which would miss this) so the
# mismatch is caught and repaired by the npm install fallback.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
COPY node_modules ./node_modules

# Verify the host-copied node_modules is usable; otherwise fall back to npm
# install with TLS-interception tolerance and retries, hard-verifying after -
# npm can fail ("Exit handler never called") yet still exit 0 with an
# incomplete node_modules, so the exit code alone cannot be trusted.
RUN if ! node -e "require.resolve('vite'); require.resolve('react'); require('rollup')" 2>/dev/null; then \
        npm config set strict-ssl false; \
        npm config set fetch-retries 5; \
        npm config set fetch-retry-maxtimeout 120000; \
        attempt=1; \
        until node -e "require.resolve('vite'); require.resolve('react'); require.resolve('react-router-dom'); require('rollup')" 2>/dev/null; do \
            if [ "$attempt" -gt 3 ]; then echo "npm install failed verification after 3 attempts" >&2; exit 1; fi; \
            echo "install attempt $attempt"; \
            rm -rf node_modules; \
            npm cache clean --force >/dev/null 2>&1 || true; \
            npm install --no-audit --no-fund --no-progress || true; \
            attempt=$((attempt+1)); \
        done; \
    fi \
    && node -e "require.resolve('vite'); require.resolve('react'); require.resolve('react-router-dom'); require('rollup'); console.log('deps verified')"

COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=80
ENV BACKEND_ORIGIN=http://backend:3001
EXPOSE 80
