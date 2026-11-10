FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

COPY ai-service/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY ai-service/src ./src

USER node
EXPOSE 8080
CMD ["npm", "start"]
