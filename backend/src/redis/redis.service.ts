import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly cliente: Redis;

  constructor() {
    this.cliente = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      connectTimeout: 3000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 2,
      retryStrategy: (veces) => Math.min(veces * 200, 2000),
    });
    this.cliente.on('error', () => undefined);
  }

  async onModuleDestroy() {
    await this.cliente.quit();
  }

  async bloquear(clave: string): Promise<string | null> {
    const token = `${process.pid}-${Date.now()}-${Math.random()}`;
    const ok = await this.cliente.set(clave, token, 'EX', 5, 'NX');
    return ok === 'OK' ? token : null;
  }

  async soltar(clave: string, token: string) {
    const script =
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
    await this.cliente.eval(script, 1, clave, token);
  }
}
