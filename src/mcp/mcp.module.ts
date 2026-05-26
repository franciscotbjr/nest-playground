import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { OriginMiddleware } from './origin.middleware';

@Module({
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(OriginMiddleware).forRoutes(McpController);
  }
}
