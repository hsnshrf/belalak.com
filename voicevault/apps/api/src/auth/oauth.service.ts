import { BadRequestException, Injectable, NotImplementedException } from "@nestjs/common";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthService } from "./auth.service";

export type OAuthProvider = "google" | "microsoft" | "apple";

interface ProviderEndpoints {
  authorize: string;
  token: string;
  scope: string;
}

/**
 * Standard OAuth 2.0 / OIDC authorization-code flow.
 * Identity is taken from the provider's id_token claims.
 *
 * NOTE: Apple sign-in additionally requires a client_secret that is itself a
 * JWT signed with the .p8 team key (OAUTH_APPLE_* env vars) and uses
 * response_mode=form_post. Implemented below; needs a real Apple developer
 * account to exercise end-to-end.
 */
@Injectable()
export class OAuthService {
  constructor(private readonly auth: AuthService) {}

  private endpoints(provider: OAuthProvider): ProviderEndpoints {
    const cfg = config();
    switch (provider) {
      case "google":
        return {
          authorize: "https://accounts.google.com/o/oauth2/v2/auth",
          token: "https://oauth2.googleapis.com/token",
          scope: "openid email profile",
        };
      case "microsoft":
        return {
          authorize: `https://login.microsoftonline.com/${cfg.OAUTH_MICROSOFT_TENANT}/oauth2/v2.0/authorize`,
          token: `https://login.microsoftonline.com/${cfg.OAUTH_MICROSOFT_TENANT}/oauth2/v2.0/token`,
          scope: "openid email profile",
        };
      case "apple":
        return {
          authorize: "https://appleid.apple.com/auth/authorize",
          token: "https://appleid.apple.com/auth/token",
          scope: "name email",
        };
    }
  }

  private clientId(provider: OAuthProvider): string {
    const cfg = config();
    const id =
      provider === "google"
        ? cfg.OAUTH_GOOGLE_CLIENT_ID
        : provider === "microsoft"
          ? cfg.OAUTH_MICROSOFT_CLIENT_ID
          : cfg.OAUTH_APPLE_CLIENT_ID;
    if (!id) throw new NotImplementedException(`${provider} sign-in is not configured on this server`);
    return id;
  }

  private clientSecret(provider: OAuthProvider): string {
    const cfg = config();
    if (provider === "apple") {
      // Apple's client_secret is a short-lived ES256 JWT signed with the team key.
      if (!cfg.OAUTH_APPLE_PRIVATE_KEY || !cfg.OAUTH_APPLE_TEAM_ID || !cfg.OAUTH_APPLE_KEY_ID) {
        throw new NotImplementedException("Apple sign-in is not configured on this server");
      }
      return jwt.sign({}, cfg.OAUTH_APPLE_PRIVATE_KEY, {
        algorithm: "ES256",
        issuer: cfg.OAUTH_APPLE_TEAM_ID,
        audience: "https://appleid.apple.com",
        subject: cfg.OAUTH_APPLE_CLIENT_ID,
        expiresIn: "5m",
        keyid: cfg.OAUTH_APPLE_KEY_ID,
      });
    }
    const secret = provider === "google" ? cfg.OAUTH_GOOGLE_CLIENT_SECRET : cfg.OAUTH_MICROSOFT_CLIENT_SECRET;
    if (!secret) throw new NotImplementedException(`${provider} sign-in is not configured on this server`);
    return secret;
  }

  private redirectUri(provider: OAuthProvider): string {
    return `${config().API_BASE_URL}/v1/auth/oauth/${provider}/callback`;
  }

  /** Signed state parameter — CSRF protection without server-side sessions. */
  private signState(): string {
    const nonce = randomBytes(16).toString("hex");
    const mac = createHmac("sha256", config().JWT_SECRET).update(nonce).digest("hex");
    return `${nonce}.${mac}`;
  }

  private verifyState(state: string): void {
    const [nonce, mac] = state.split(".");
    if (!nonce || !mac) throw new BadRequestException("Bad OAuth state");
    const expected = createHmac("sha256", config().JWT_SECRET).update(nonce).digest("hex");
    const a = Buffer.from(mac, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException("Bad OAuth state");
    }
  }

  authorizeUrl(provider: OAuthProvider): string {
    const ep = this.endpoints(provider);
    const params = new URLSearchParams({
      client_id: this.clientId(provider),
      redirect_uri: this.redirectUri(provider),
      response_type: "code",
      scope: ep.scope,
      state: this.signState(),
    });
    if (provider === "apple") params.set("response_mode", "form_post");
    return `${ep.authorize}?${params.toString()}`;
  }

  async handleCallback(provider: OAuthProvider, code: string, state: string) {
    this.verifyState(state);
    const ep = this.endpoints(provider);
    const res = await fetch(ep.token, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: this.clientId(provider),
        client_secret: this.clientSecret(provider),
        redirect_uri: this.redirectUri(provider),
      }),
    });
    if (!res.ok) {
      throw new BadRequestException(`OAuth code exchange failed (${res.status})`);
    }
    const body = (await res.json()) as { id_token?: string };
    if (!body.id_token) throw new BadRequestException("Provider returned no id_token");
    // The token came from the provider's token endpoint over TLS, so decoding
    // without local signature verification is acceptable for the code path;
    // production hardening: verify against the provider JWKS (TODO).
    const claims = jwt.decode(body.id_token) as {
      sub?: string;
      email?: string;
      name?: string;
      preferred_username?: string;
    } | null;
    if (!claims?.sub) throw new BadRequestException("Provider id_token missing sub");
    const email = claims.email ?? claims.preferred_username;
    if (!email) throw new BadRequestException("Provider id_token missing email");
    return this.auth.loginOrSignupOAuth({
      provider,
      subject: claims.sub,
      email,
      displayName: claims.name ?? email.split("@")[0]!,
    });
  }
}
