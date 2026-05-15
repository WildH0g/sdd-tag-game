# Stage 1: Build CSS
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:css

# Stage 2: Production environment
FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/app.js ./app.js

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "app.js"]
