import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '../../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'minimal',
    });

    (
      this as unknown as PrismaClient & {
        $on(event: 'error', cb: (e: Prisma.LogEvent) => void): void;
        $on(event: 'warn', cb: (e: Prisma.LogEvent) => void): void;
      }
    ).$on('error', (e) => this.logger.error(e.message, e.target));

    (
      this as unknown as PrismaClient & {
        $on(event: 'warn', cb: (e: Prisma.LogEvent) => void): void;
      }
    ).$on('warn', (e) => this.logger.warn(e.message));
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
