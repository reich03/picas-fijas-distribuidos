import { Body, Controller, Post } from '@nestjs/common';
import { NombreDto } from '../juegos/dto';
import { JugadoresService } from './jugadores.service';

@Controller('login')
export class JugadoresController {
  constructor(private readonly jugadores: JugadoresService) {}

  @Post()
  entrar(@Body() body: NombreDto) {
    return this.jugadores.registrar(body.nombre);
  }
}
