FROM oven/bun:1 AS build

WORKDIR /app

ARG VITE_API_URL=https://api.mirekng.com
ENV VITE_API_URL=$VITE_API_URL

COPY . .

RUN cd apps/finances && bun install --frozen-lockfile && bun run build

FROM oven/bun:1

WORKDIR /app/apps/finances

COPY --from=build /app/apps/finances/dist dist
COPY --from=build /app/apps/finances/node_modules node_modules
COPY --from=build /app/apps/finances/package.json package.json
COPY --from=build /app/apps/finances/serve.ts serve.ts

ENV PORT=3002
ENV API_URL=https://api.mirekng.com
EXPOSE 3002

CMD ["bun", "serve.ts"]
