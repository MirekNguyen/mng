FROM denoland/deno:alpine

WORKDIR /app
COPY . .

RUN apk add --no-cache curl tzdata nginx busybox-suid
RUN echo "0 0 * * * cd /app && deno task generate:rss" > /etc/crontabs/root
RUN deno task generate:rss

CMD ["crond", "-f", "-d", "8"]
