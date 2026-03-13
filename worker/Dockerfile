FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install Python and Argos Translate with language models (ja->en, ja->ru/en->ru).
# Install packages to /app/argos-packages so USER node can read them at runtime.
ENV ARGOS_PACKAGES_DIR=/app/argos-packages
RUN apk add --no-cache python3 py3-pip git && \
    pip install --no-cache-dir argos-translate && \
    mkdir -p /app/argos-packages && \
    argospm update || true && \
    (argospm install translate-ja_en || true) && \
    (argospm install translate-ja_ru || true) && \
    (argospm install translate-en_ru || true) && \
    chown -R node:node /app/argos-packages

ENV NODE_ENV=production \
    LOCAL_TRANSLATE_ENABLED=true \
    TRANSLATE_CMD=argos-translate \
    ARGOS_PACKAGES_DIR=/app/argos-packages

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

USER node
CMD ["node", "dist/index.js"]
