const base = process.argv[2] || 'http://localhost:3000';

async function req(method, ruta, body) {
  const res = await fetch(base + ruta, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  let data = null;
  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = texto;
    }
  }
  return { status: res.status, data, pod: res.headers.get('x-pod') };
}

function assert(cond, msg) {
  if (!cond) {
    console.error('fallo:', msg);
    process.exit(1);
  }
}

const salud = await req('GET', '/salud');
assert(salud.status === 200 && salud.data.ok, 'salud');
assert(salud.pod, 'header del pod');

const sinLogin = await req('POST', '/juego', { nombre: 'ana', numero: '4271' });
assert(sinLogin.status === 401, 'crear sin login');

await req('POST', '/login', { nombre: 'ana' });
await req('POST', '/login', { nombre: 'beto' });

const repetido = await req('POST', '/juego', { nombre: 'ana', numero: '1123' });
assert(repetido.status === 400, 'digitos repetidos');

const letras = await req('POST', '/juego', { nombre: 'ana', numero: '12a4' });
assert(letras.status === 400, 'letras en el numero');

const creado = await req('POST', '/juego', { nombre: 'ana', numero: '4271' });
assert(creado.status === 201, 'crear juego');
const id = creado.data.id;
assert(!JSON.stringify(creado.data).includes('secreto'), 'no publica el secreto');

const temprano = await req('POST', `/juego/${id}/jugar`, { nombre: 'ana', numero: '1234' });
assert(temprano.status === 409, 'jugar antes de iniciar');

const unido = await req('PUT', `/juego/${id}`, { nombre: 'beto', numero: '8135' });
assert(unido.status === 200 && unido.data.estado === 'en_juego', 'unirse');
assert(unido.data.turno === 'ana' || unido.data.turno === 'beto', 'turno inicial');

const otro = unido.data.turno === 'ana' ? 'beto' : 'ana';
const fuera = await req('POST', `/juego/${id}/jugar`, { nombre: otro, numero: '1234' });
assert(fuera.status === 409, 'turno de otro jugador');

let ejemplo = false;
for (let i = 0; i < 8; i++) {
  const estado = await req('GET', `/juego/${id}`);
  if (estado.data.estado === 'terminado') {
    break;
  }
  const turno = estado.data.turno;
  const numero = turno === 'beto' ? (ejemplo ? '4271' : '1234') : '9086';
  const jugada = await req('POST', `/juego/${id}/jugar`, { nombre: turno, numero });
  assert(jugada.status === 201, `jugada ${numero}`);
  if (turno === 'beto' && numero === '1234') {
    assert(jugada.data.fijas === 1 && jugada.data.picas === 2, '1234 contra 4271');
    ejemplo = true;
  }
  if (numero === '4271') {
    assert(jugada.data.gano === true && jugada.data.ganador === 'beto', 'beto gana');
  }
}

const fin = await req('GET', `/juego/${id}`);
assert(fin.data.estado === 'terminado' && fin.data.ganador === 'beto', 'estado final');
assert(!JSON.stringify(fin.data).includes('8135'), 'el secreto no sale en el estado');

const lista = await req('GET', '/juego?estado=terminado');
assert(lista.data.some((juego) => juego.id === id && juego.creador === 'ana'), 'listado');

console.log('ok', id, salud.pod);
