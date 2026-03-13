FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Use Debian-based image: argos-translate has no wheels for Alpine (musl).
FROM node:20-bookworm-slim
WORKDIR /app

# Python + Argos in venv; models in /app/argos-packages for USER node
ENV ARGOS_PACKAGES_DIR=/app/argos-packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/argos-venv \
    && /opt/argos-venv/bin/pip install --upgrade pip \
    && /opt/argos-venv/bin/pip install --no-cache-dir argostranslate \
    && mkdir -p /app/argos-packages \
    && /opt/argos-venv/bin/argospm update || true \
    && (/opt/argos-venv/bin/argospm install translate-ja_en || true) \
    && (/opt/argos-venv/bin/argospm install translate-ja_ru || true) \
    && (/opt/argos-venv/bin/argospm install translate-en_ru || true) \
    && chown -R node:node /app/argos-packages

ENV PATH="/opt/argos-venv/bin:$PATH" \
    NODE_ENV=production \
    LOCAL_TRANSLATE_ENABLED=true \
    TRANSLATE_CMD=argos-translate \
    ARGOS_PACKAGES_DIR=/app/argos-packages

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

USER node
CMD ["node", "dist/index.js"]
