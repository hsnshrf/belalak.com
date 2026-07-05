import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import express from "express";
import { AppModule } from "./app.module";
import { config } from "./config";

async function bootstrap() {
  const cfg = config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // registered manually so chunk uploads get raw bytes
  });

  // Audio chunks arrive as raw octet streams (up to ~10 MB for a 5-minute
  // high-quality chunk); everything else is JSON.
  app.use("/v1/uploads", express.raw({ type: "application/octet-stream", limit: "32mb" }));
  app.use(express.json({ limit: "10mb" }));

  app.enableCors({ origin: cfg.WEB_BASE_URL, credentials: true });
  app.enableShutdownHooks();

  await app.listen(cfg.API_PORT);
  console.log(`VoiceVault API listening on :${cfg.API_PORT}`);
}

bootstrap().catch((err) => {
  console.error("API failed to start:", err);
  process.exit(1);
});
