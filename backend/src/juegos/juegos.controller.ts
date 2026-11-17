import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { NumeroDto } from './dto';
import { JuegosService } from './juegos.service';

@Controller()
export class JuegosController {
  constructor(private readonly juegos: JuegosService) {}

  @Post('juego')
  crear(@Body() body: NumeroDto) {
    return this.juegos.crear(body.nombre, body.numero);
  }

  @Get('juego')
  listar(@Query('estado') estado?: string) {
    return this.juegos.listar(estado);
  }

  @Get('juego/:id')
  uno(@Param('id') id: string) {
    return this.juegos.uno(id);
  }

  @Put('juego/:id')
  unirse(@Param('id') id: string, @Body() body: NumeroDto) {
    return this.juegos.unirse(id, body.nombre, body.numero);
  }

  @Post('juego/:id/jugar')
  jugar(@Param('id') id: string, @Body() body: NumeroDto) {
    return this.juegos.jugar(id, body.nombre, body.numero);
  }
}
