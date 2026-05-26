import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '127.0.0.1';
  await app.listen(port, host);
  logger.log(`Listening on http://${host}:${port}`);
  logger.log(`MCP endpoint: http://${host}:${port}/mcp`);
}
void bootstrap();
