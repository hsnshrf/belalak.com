import { Module } from "@nestjs/common";
import { AccountController } from "./account/account.controller";
import { AiController } from "./ai/ai.controller";
import { AiService } from "./ai/ai.service";
import { AuthController } from "./auth/auth.controller";
import { ExportsController } from "./exports/exports.controller";
import { OrganizationController } from "./organization/organization.controller";
import { AuthService } from "./auth/auth.service";
import { OAuthService } from "./auth/oauth.service";
import { DbService } from "./db/db.service";
import { RecordingsController } from "./recordings/recordings.controller";
import { RecordingsService } from "./recordings/recordings.service";
import { SearchController } from "./search/search.controller";
import { SearchService } from "./search/search.service";
import { StorageService } from "./storage/storage.service";
import { SyncController } from "./sync/sync.controller";
import { SyncService } from "./sync/sync.service";
import { TranscriptionController } from "./transcription/transcription.controller";
import { TranscriptionProcessor } from "./transcription/transcription.processor";
import { TranscriptionQueue } from "./transcription/transcription.queue";
import { DeepgramProvider } from "./transcription/providers/deepgram.provider";
import { LocalWhisperProvider } from "./transcription/providers/local-whisper.provider";
import { WhisperApiProvider } from "./transcription/providers/whisper-api.provider";
import { UploadsController } from "./uploads/uploads.controller";
import { UploadsService } from "./uploads/uploads.service";

@Module({
  controllers: [
    AuthController,
    RecordingsController,
    UploadsController,
    TranscriptionController,
    SearchController,
    SyncController,
    AccountController,
    OrganizationController,
    AiController,
    ExportsController,
  ],
  providers: [
    DbService,
    StorageService,
    AuthService,
    OAuthService,
    RecordingsService,
    UploadsService,
    TranscriptionQueue,
    TranscriptionProcessor,
    WhisperApiProvider,
    DeepgramProvider,
    LocalWhisperProvider,
    SearchService,
    SyncService,
    AiService,
  ],
})
export class AppModule {}
