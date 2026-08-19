FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer

COPY package*.json ./

RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && npm ci --omit=dev \
    && rm -rf "$PUPPETEER_CACHE_DIR" \
    && npx puppeteer browsers install chrome --install-deps \
    && chown -R node:node /app /home/node/.cache \
    && rm -rf /var/lib/apt/lists/* \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY --chown=node:node . .

USER node

EXPOSE 4000

CMD ["node", "index.js"]
