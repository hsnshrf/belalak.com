import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { searchRequestSchema } from "@voicevault/shared";
import type { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import { SearchService } from "./search.service";

@Controller("v1/search")
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Post()
  @HttpCode(200)
  run(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(searchRequestSchema)) body: z.infer<typeof searchRequestSchema>,
  ) {
    return this.search.search(user.userId, body);
  }
}
