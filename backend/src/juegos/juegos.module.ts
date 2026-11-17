import { Module } from '@nestjs/common';
import { JugadoresModule } from '../jugadores/jugadores.module';
import { JuegosController } from './juegos.controller';
import { JuegosService } from './juegos.service';

@Module({
  imports: [JugadoresModule],
  controllers: [JuegosController],
  providers: [JuegosService],
})
export class JuegosModule {}
