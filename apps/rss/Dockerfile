FROM denoland/deno:alpine
USER deno
EXPOSE 8000

WORKDIR /app

COPY . .

RUN deno cache main.ts
