import { HttpException } from '@nestjs/common';

export function numeroValido(valor: unknown): string {
  if (typeof valor !== 'string') {
    throw new HttpException({ mensaje: 'el numero se envia como texto' }, 400);
  }
  const numero = valor.trim();
  if (!/^\d{4}$/.test(numero)) {
    throw new HttpException({ mensaje: 'el numero debe tener 4 digitos, sin letras' }, 400);
  }
  if (new Set(numero).size !== 4) {
    throw new HttpException({ mensaje: 'los digitos no se pueden repetir' }, 400);
  }
  return numero;
}

export function evaluar(secreto: string, intento: string) {
  let picas = 0;
  let fijas = 0;
  for (let i = 0; i < 4; i++) {
    if (intento[i] === secreto[i]) {
      fijas++;
    } else if (secreto.includes(intento[i])) {
      picas++;
    }
  }
  return { picas, fijas };
}
