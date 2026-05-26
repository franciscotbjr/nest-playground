import { Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpService } from './mcp.service';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcp: McpService) {}

  @Post()
  post(
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    return this.mcp.handlePost(req, res);
  }

  @Get()
  get(
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    return this.mcp.handleGet(req, res);
  }

  @Delete()
  delete(
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    return this.mcp.handleDelete(req, res);
  }
}
