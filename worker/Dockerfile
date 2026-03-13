FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install Python and Argos Translate with language models (ja->en, ja->ru/en->ru)
RUN apk add --no-cache python3 py3-pip git && \
    pip install --no-cache-dir argos-translate && \
    argospm update || true && \
    (argospm install translate-ja_en || true) && \
    (argospm install translate-ja_ru || true) && \
    (argospm install translate-en_ru || true)

ENV NODE_ENV=production \
    LOCAL_TRANSLATE_ENABLED=true \
    TRANSLATE_CMD=argos-translate

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

USER node
CMD ["node", "dist/index.js"]
