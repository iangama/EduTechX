FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
# libs para engines do Prisma detectarem/rodarem no build
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# gera client para linux-musl + openssl3
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# libs necessárias em runtime
RUN apk add --no-cache openssl libc6-compat
COPY --from=builder /app ./
EXPOSE 4000
CMD ["node","server.js"]
