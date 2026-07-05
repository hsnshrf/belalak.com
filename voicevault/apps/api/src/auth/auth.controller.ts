import { Body, Controller, Get, HttpCode, Param, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { loginSchema, signupSchema } from "@voicevault/shared";
import { z } from "zod";
import { config } from "../config";
import { ZodPipe } from "../common/zod.pipe";
import { AuthService } from "./auth.service";
import { OAuthService, type OAuthProvider } from "./oauth.service";

const refreshSchema = z.object({ refreshToken: z.string().min(10) });
const providerSchema = z.enum(["google", "microsoft", "apple"]);

@Controller("v1/auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly oauth: OAuthService,
  ) {}

  @Post("signup")
  signup(@Body(new ZodPipe(signupSchema)) body: z.infer<typeof signupSchema>) {
    return this.auth.signup(body);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body(new ZodPipe(loginSchema)) body: z.infer<typeof loginSchema>) {
    return this.auth.login(body);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body(new ZodPipe(refreshSchema)) body: z.infer<typeof refreshSchema>) {
    return this.auth.refresh(body.refreshToken);
  }

  @Get("oauth/:provider/start")
  oauthStart(@Param("provider", new ZodPipe(providerSchema)) provider: OAuthProvider, @Res() res: Response) {
    res.redirect(this.oauth.authorizeUrl(provider));
  }

  @Get("oauth/:provider/callback")
  async oauthCallback(
    @Param("provider", new ZodPipe(providerSchema)) provider: OAuthProvider,
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response,
  ) {
    const tokens = await this.oauth.handleCallback(provider, code, state);
    // Tokens travel in the URL fragment so they never hit server logs.
    const fragment = new URLSearchParams({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    res.redirect(`${config().WEB_BASE_URL}/auth/callback#${fragment.toString()}`);
  }
}
