import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { EnvSchema } from "./database/env.resolver";
import multipart from "@fastify/multipart";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });
  EnvSchema.parse(process.env);
  await app.register(multipart, { limits: { fileSize: 1024 * 1024 * 25 } });
  await app.listen(process.env.port ?? 3000, "0.0.0.0");
}
bootstrap();
