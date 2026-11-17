import { Module } from '@nestjs/common';
import { JugadoresModule } from './jugadores/jugadores.module';
import { JuegosModule } from './juegos/juegos.module';
import { RedisModule } from './redis/redis.module';
import { SaludModule } from './salud/salud.module';

@Module({
  imports: [RedisModule, JugadoresModule, JuegosModule, SaludModule],
})
export class AppModule {}
