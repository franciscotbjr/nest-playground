import type { Request, Response } from 'express';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

describe('McpController', () => {
  let service: jest.Mocked<
    Pick<McpService, 'handlePost' | 'handleGet' | 'handleDelete'>
  >;
  let controller: McpController;

  beforeEach(() => {
    service = {
      handlePost: jest.fn().mockResolvedValue(undefined),
      handleGet: jest.fn().mockResolvedValue(undefined),
      handleDelete: jest.fn().mockResolvedValue(undefined),
    };
    controller = new McpController(service as unknown as McpService);
  });

  const req = {} as Request;
  const res = {} as Response;

  it('forwards POST to McpService.handlePost', async () => {
    await controller.post(req, res);
    expect(service.handlePost).toHaveBeenCalledWith(req, res);
  });

  it('forwards GET to McpService.handleGet', async () => {
    await controller.get(req, res);
    expect(service.handleGet).toHaveBeenCalledWith(req, res);
  });

  it('forwards DELETE to McpService.handleDelete', async () => {
    await controller.delete(req, res);
    expect(service.handleDelete).toHaveBeenCalledWith(req, res);
  });
});
