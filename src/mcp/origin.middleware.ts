import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class OriginMiddleware implements NestMiddleware {
  private readonly allowedOrigins: ReadonlyArray<string>;
  private readonly allowedPrefixes: ReadonlyArray<string>;
  private readonly enforce: boolean;

  constructor() {
    const raw = (process.env.MCP_ALLOWED_ORIGINS ?? '').trim();
    const items =
      raw.length > 0
        ? raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    this.allowedOrigins = items.filter((s) => !s.endsWith('*'));
    this.allowedPrefixes = items
      .filter((s) => s.endsWith('*'))
      .map((s) => s.slice(0, -1));
    this.enforce = process.env.MCP_ENFORCE_ORIGIN !== 'false';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const origin = req.headers.origin;

    if (!origin) {
      next();
      return;
    }

    if (!this.enforce) {
      next();
      return;
    }

    const allowed =
      this.allowedOrigins.includes(origin) ||
      this.allowedPrefixes.some((prefix) => origin.startsWith(prefix));

    if (!allowed) {
      res.status(403).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: `Origin not allowed: ${origin}` },
        id: null,
      });
      return;
    }

    next();
  }
}
