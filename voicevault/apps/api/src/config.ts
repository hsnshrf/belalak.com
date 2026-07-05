import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  WEB_BASE_URL: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string().default("postgres://voicevault:voicevault@localhost:5432/voicevault"),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("voicevault-audio"),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  S3_SIGNED_URL_TTL_SECONDS: z.coerce.number().default(900),

  JWT_SECRET: z.string().default("dev-only-secret-change-me"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(2_592_000),

  OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
  OAUTH_MICROSOFT_CLIENT_ID: z.string().optional(),
  OAUTH_MICROSOFT_CLIENT_SECRET: z.string().optional(),
  OAUTH_MICROSOFT_TENANT: z.string().default("common"),
  OAUTH_APPLE_CLIENT_ID: z.string().optional(),
  OAUTH_APPLE_TEAM_ID: z.string().optional(),
  OAUTH_APPLE_KEY_ID: z.string().optional(),
  OAUTH_APPLE_PRIVATE_KEY: z.string().optional(),

  TRANSCRIPTION_PROVIDER: z.enum(["whisper_api", "deepgram", "local_whisper"]).default("whisper_api"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_WHISPER_MODEL: z.string().default("whisper-1"),
  DEEPGRAM_API_KEY: z.string().optional(),
  DEEPGRAM_MODEL: z.string().default("nova-2"),
  WHISPER_CPP_BINARY: z.string().optional(),
  WHISPER_CPP_MODEL: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5"),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | undefined;

export function config(): AppConfig {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      // Fail loudly at boot — a half-configured server must not run.
      throw new Error(`Invalid environment: ${parsed.error.message}`);
    }
    cached = parsed.data;
  }
  return cached;
}
