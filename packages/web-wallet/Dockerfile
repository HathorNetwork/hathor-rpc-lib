# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy yarn configuration and patches from repo root
COPY ../../.yarnrc.yml ./
COPY ../../.yarn ./.yarn
COPY ../../package.json ../../yarn.lock ./
COPY ../hathor-rpc-handler/package.json ./packages/hathor-rpc-handler/
COPY ../snap-utils/package.json ./packages/snap-utils/
COPY package.json ./packages/web-wallet/

# Install dependencies
RUN corepack enable && yarn install

# Copy source code
COPY . ./packages/web-wallet
COPY ../snap-utils ../snap-utils

# Build the application
WORKDIR /app/packages/web-wallet
RUN yarn build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/packages/web-wallet/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
