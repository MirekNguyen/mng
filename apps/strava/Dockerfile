FROM oven/bun:1 AS build

WORKDIR /app

COPY . .

RUN cd apps/strava && bun install --frozen-lockfile && bun run build

FROM oven/bun:1

WORKDIR /app/apps/strava

COPY --from=build /app/apps/strava/.output .output
COPY --from=build /app/apps/strava/node_modules node_modules
COPY --from=build /app/apps/strava/package.json package.json

ENV PORT=3001
EXPOSE 3001

CMD ["bun", "run", ".output/server/index.mjs"]
