import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [DbModule, McpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
