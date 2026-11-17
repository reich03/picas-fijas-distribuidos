import { HttpException, Injectable } from '@nestjs/common';
import { JugadoresService } from '../jugadores/jugadores.service';
import { RedisService } from '../redis/redis.service';
import { evaluar, numeroValido } from './numero';

type Estado = 'por_iniciar' | 'en_juego' | 'terminado';

export interface Intento {
  jugador: string;
  numero: string;
  picas: number;
  fijas: number;
}

interface Juego {
  id: string;
  estado: Estado;
  creador: string;
  jugador1: string;
  secreto1: string;
  jugador2?: string;
  secreto2?: string;
  turno?: string;
  ganador?: string | null;
  intentos: Intento[];
}

const ESTADOS: Estado[] = ['por_iniciar', 'en_juego', 'terminado'];

@Injectable()
export class JuegosService {
  constructor(
    private readonly redis: RedisService,
    private readonly jugadores: JugadoresService,
  ) {}

  async crear(nombre: string, numero: string) {
    const jugador = await this.jugadores.existe(nombre);
    const secreto = numeroValido(numero);
    const id = String(await this.redis.cliente.incr('juegos:seq'));
    const juego: Juego = {
      id,
      estado: 'por_iniciar',
      creador: jugador,
      jugador1: jugador,
      secreto1: secreto,
      ganador: null,
      intentos: [],
    };
    await this.guardar(juego);
    await this.redis.cliente.sadd('juegos', id);
    return this.vista(juego);
  }

  async unirse(id: string, nombre: string, numero: string) {
    const jugador = await this.jugadores.existe(nombre);
    const secreto = numeroValido(numero);
    return this.conCandado(id, async () => {
      const juego = await this.leer(id);
      if (juego.estado !== 'por_iniciar') {
        throw new HttpException({ mensaje: 'ese juego ya no admite jugadores' }, 409);
      }
      if (juego.jugador1 === jugador) {
        throw new HttpException({ mensaje: 'no puedes unirte a tu propio juego' }, 409);
      }
      juego.jugador2 = jugador;
      juego.secreto2 = secreto;
      juego.estado = 'en_juego';
      juego.turno = Math.random() < 0.5 ? juego.jugador1 : jugador;
      await this.guardar(juego);
      return this.vista(juego);
    });
  }

  async jugar(id: string, nombre: string, numero: string) {
    const jugador = await this.jugadores.existe(nombre);
    const intento = numeroValido(numero);
    return this.conCandado(id, async () => {
      const juego = await this.leer(id);
      if (juego.estado === 'por_iniciar') {
        throw new HttpException({ mensaje: 'el juego aun no inicia' }, 409);
      }
      if (juego.estado === 'terminado') {
        throw new HttpException({ mensaje: 'el juego ya termino' }, 409);
      }
      if (juego.jugador1 !== jugador && juego.jugador2 !== jugador) {
        throw new HttpException({ mensaje: 'no estas en este juego' }, 403);
      }
      if (juego.turno !== jugador) {
        throw new HttpException({ mensaje: 'no es tu turno' }, 409);
      }
      const secreto = jugador === juego.jugador1 ? juego.secreto2 : juego.secreto1;
      if (!secreto) {
        throw new HttpException({ mensaje: 'el juego no tiene rival' }, 409);
      }
      const resultado = evaluar(secreto, intento);
      juego.intentos.push({
        jugador,
        numero: intento,
        picas: resultado.picas,
        fijas: resultado.fijas,
      });
      if (resultado.fijas === 4) {
        juego.estado = 'terminado';
        juego.ganador = jugador;
        juego.turno = undefined;
      } else {
        juego.turno = jugador === juego.jugador1 ? juego.jugador2 : juego.jugador1;
      }
      await this.guardar(juego);
      return {
        fijas: resultado.fijas,
        picas: resultado.picas,
        gano: resultado.fijas === 4,
        turno: juego.turno ?? null,
        estado: juego.estado,
        ganador: juego.ganador ?? null,
      };
    });
  }

  async uno(id: string) {
    const juego = await this.leer(id);
    return this.vista(juego);
  }

  async listar(estado?: string) {
    if (estado && !ESTADOS.includes(estado as Estado)) {
      throw new HttpException({ mensaje: 'estado invalido' }, 400);
    }
    const ids = await this.redis.cliente.smembers('juegos');
    if (ids.length === 0) {
      return [];
    }
    const crudos = await this.redis.cliente.mget(...ids.map((id) => `juego:${id}`));
    return crudos
      .filter((item): item is string => Boolean(item))
      .map((item) => JSON.parse(item) as Juego)
      .filter((juego) => !estado || juego.estado === estado)
      .sort((a, b) => Number(b.id) - Number(a.id))
      .map((juego) => this.vista(juego));
  }

  private vista(juego: Juego) {
    return {
      id: juego.id,
      estado: juego.estado,
      creador: juego.creador,
      jugadores: juego.jugador2 ? [juego.jugador1, juego.jugador2] : [juego.jugador1],
      turno: juego.turno ?? null,
      ganador: juego.ganador ?? null,
      intentos: juego.intentos,
    };
  }

  private async leer(id: string) {
    const crudo = await this.redis.cliente.get(`juego:${id}`);
    if (!crudo) {
      throw new HttpException({ mensaje: 'juego no encontrado' }, 404);
    }
    return JSON.parse(crudo) as Juego;
  }

  private async guardar(juego: Juego) {
    await this.redis.cliente.set(`juego:${juego.id}`, JSON.stringify(juego));
  }

  private async conCandado<T>(id: string, fn: () => Promise<T>) {
    const clave = `lock:juego:${id}`;
    const token = await this.redis.bloquear(clave);
    if (!token) {
      throw new HttpException({ mensaje: 'el juego esta ocupado, intenta de nuevo' }, 409);
    }
    try {
      return await fn();
    } finally {
      await this.redis.soltar(clave, token);
    }
  }
}
