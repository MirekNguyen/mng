FROM oven/bun:1 AS build

WORKDIR /app

ARG VITE_API_URL=https://api.mirekng.com
ENV VITE_API_URL=$VITE_API_URL

COPY . .

RUN cd apps/banking && bun install --frozen-lockfile && bun run build

FROM oven/bun:1

WORKDIR /app/apps/banking

COPY --from=build /app/apps/banking/dist dist
COPY --from=build /app/apps/banking/node_modules node_modules
COPY --from=build /app/apps/banking/package.json package.json
COPY --from=build /app/apps/banking/serve.ts serve.ts

ENV PORT=3003
ENV API_URL=https://api.mirekng.com
EXPOSE 3003

CMD ["bun", "serve.ts"]
