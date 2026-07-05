import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import type { Request } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthUser {
  userId: string;
}

declare module "express" {
  interface Request {
    authUser?: AuthUser;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    try {
      const payload = jwt.verify(header.slice(7), config().JWT_SECRET) as jwt.JwtPayload;
      if (typeof payload.sub !== "string") throw new Error("no sub");
      req.authUser = { userId: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

/** Injects the authenticated user: `handler(@CurrentUser() user: AuthUser)`. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.authUser) throw new UnauthorizedException();
  return req.authUser;
});
