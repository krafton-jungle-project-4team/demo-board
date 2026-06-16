FROM node:24-alpine AS workspace-deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-server/package.json ./apps/api-server/package.json
COPY apps/mcp-server/package.json ./apps/mcp-server/package.json
COPY apps/web-client/package.json ./apps/web-client/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/ui/package.json ./packages/ui/package.json

RUN npm ci

FROM workspace-deps AS development

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npm run build -w @nmm/shared && cd apps/api-server && npx nest start --watch"]

FROM workspace-deps AS build

COPY . .

RUN npm run build -w @nmm/shared && npm run build -w @nmm/api-server
RUN npm prune --omit=dev

FROM node:24-alpine AS production

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api-server/package.json ./apps/api-server/package.json
COPY --from=build /app/apps/api-server/dist ./apps/api-server/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

WORKDIR /app/apps/api-server

EXPOSE 3000

CMD ["node", "dist/main.js"]
