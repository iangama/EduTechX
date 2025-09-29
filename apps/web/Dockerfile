FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM alpine:3.20
WORKDIR /web
COPY --from=builder /app/dist ./dist
CMD ["sh","-lc","mkdir -p /web_out && rm -rf /web_out/* && cp -r dist/* /web_out/ && sleep 3600"]
