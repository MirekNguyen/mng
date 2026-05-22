FROM oven/bun:1 AS build

WORKDIR /app

ARG VITE_API_URL=https://api.mirekng.com
ENV VITE_API_URL=$VITE_API_URL

COPY . .

RUN cd apps/fitness && bun install --frozen-lockfile && bun run build

FROM oven/bun:1

WORKDIR /app/apps/fitness

COPY --from=build /app/apps/fitness/dist dist
COPY --from=build /app/apps/fitness/node_modules node_modules
COPY --from=build /app/apps/fitness/package.json package.json
COPY --from=build /app/apps/fitness/serve.ts serve.ts

ENV PORT=3001
ENV API_URL=https://api.mirekng.com
EXPOSE 3001

CMD ["bun", "serve.ts"]
