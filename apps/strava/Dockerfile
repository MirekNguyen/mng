FROM oven/bun:1 AS build

WORKDIR /app

ARG VITE_API_URL=https://api.mirekng.com
ENV VITE_API_URL=$VITE_API_URL

COPY . .

RUN cd apps/strava && bun install --frozen-lockfile && bun run build

FROM oven/bun:1

WORKDIR /app/apps/strava

COPY --from=build /app/apps/strava/dist dist
COPY --from=build /app/apps/strava/node_modules node_modules
COPY --from=build /app/apps/strava/package.json package.json
COPY --from=build /app/apps/strava/serve.ts serve.ts

ENV PORT=3001
ENV API_URL=https://api.mirekng.com
EXPOSE 3001

CMD ["bun", "serve.ts"]
