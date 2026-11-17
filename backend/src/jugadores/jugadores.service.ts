import { HttpException, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class JugadoresService {
  constructor(private readonly redis: RedisService) {}

  async registrar(nombre: string) {
    const limpio = nombre.trim();
    if (limpio.length < 2 || limpio.length > 20) {
      throw new HttpException({ mensaje: 'el nombre debe tener entre 2 y 20 caracteres' }, 400);
    }
    await this.redis.cliente.sadd('jugadores', limpio);
    return { nombre: limpio };
  }

  async existe(nombre: string) {
    const limpio = nombre.trim();
    const ok = await this.redis.cliente.sismember('jugadores', limpio);
    if (!ok) {
      throw new HttpException({ mensaje: 'primero inicia sesion' }, 401);
    }
    return limpio;
  }
}
