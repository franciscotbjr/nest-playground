import { OriginMiddleware } from './origin.middleware';
import type { Request, Response, NextFunction } from 'express';

function buildReqRes(origin?: string) {
  const req = { headers: origin ? { origin } : {} } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next: NextFunction = jest.fn();
  return { req, res, next };
}

describe('OriginMiddleware', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('calls next when origin header is absent', () => {
    process.env.MCP_ALLOWED_ORIGINS = 'http://example.com';
    const mw = new OriginMiddleware();
    const { req, res, next } = buildReqRes(undefined);
    mw.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next when enforcement is disabled', () => {
    process.env.MCP_ALLOWED_ORIGINS = 'http://example.com';
    process.env.MCP_ENFORCE_ORIGIN = 'false';
    const mw = new OriginMiddleware();
    const { req, res, next } = buildReqRes('http://evil.com');
    mw.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows exact origin match', () => {
    process.env.MCP_ALLOWED_ORIGINS = 'http://example.com,http://other.com';
    process.env.MCP_ENFORCE_ORIGIN = 'true';
    const mw = new OriginMiddleware();
    const { req, res, next } = buildReqRes('http://other.com');
    mw.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows prefix match using trailing *', () => {
    process.env.MCP_ALLOWED_ORIGINS = 'http://localhost:*';
    process.env.MCP_ENFORCE_ORIGIN = 'true';
    const mw = new OriginMiddleware();
    const { req, res, next } = buildReqRes('http://localhost:3000');
    mw.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects disallowed origin with 403 and JSON-RPC error body', () => {
    process.env.MCP_ALLOWED_ORIGINS = 'http://example.com';
    process.env.MCP_ENFORCE_ORIGIN = 'true';
    const mw = new OriginMiddleware();
    const { req, res, next } = buildReqRes('http://evil.com');
    mw.use(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonrpc: '2.0',
        error: expect.objectContaining({
          message: expect.stringContaining('http://evil.com'),
        }),
      }),
    );
  });

  it('treats empty allowlist as no allowed origins (rejects everything)', () => {
    process.env.MCP_ALLOWED_ORIGINS = '';
    process.env.MCP_ENFORCE_ORIGIN = 'true';
    const mw = new OriginMiddleware();
    const { req, res, next } = buildReqRes('http://example.com');
    mw.use(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
