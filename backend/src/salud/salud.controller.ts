import { Controller, Get, HttpException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('salud')
export class SaludController {
  constructor(private readonly redis: RedisService) {}

  @Get()
  async ver() {
    const pod = process.env.HOSTNAME || 'local';
    try {
      const pong = await this.redis.cliente.ping();
      if (pong !== 'PONG') {
        throw new Error('redis');
      }
      return { ok: true, pod };
    } catch {
      throw new HttpException({ ok: false, pod }, 503);
    }
  }
}
