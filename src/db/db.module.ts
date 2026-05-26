import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { DRIZZLE } from './db.tokens';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: () => drizzle(process.env.DATABASE_URL!, { schema }),
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
