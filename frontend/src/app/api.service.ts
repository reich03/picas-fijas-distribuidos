import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

export interface Intento {
  jugador: string;
  numero: string;
  picas: number;
  fijas: number;
}

export interface Juego {
  id: string;
  estado: 'por_iniciar' | 'en_juego' | 'terminado';
  creador: string;
  jugadores: string[];
  turno: string | null;
  ganador: string | null;
  intentos: Intento[];
}

export interface Jugada {
  fijas: number;
  picas: number;
  gano: boolean;
  turno: string | null;
  estado: string;
  ganador: string | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  pod = 'local';

  constructor(private http: HttpClient) {}

  login(nombre: string) {
    return this.pedir<{ nombre: string }>('post', '/login', { nombre });
  }

  listar() {
    return this.pedir<Juego[]>('get', '/juego');
  }

  crear(nombre: string, numero: string) {
    return this.pedir<Juego>('post', '/juego', { nombre, numero });
  }

  unirse(id: string, nombre: string, numero: string) {
    return this.pedir<Juego>('put', `/juego/${id}`, { nombre, numero });
  }

  jugar(id: string, nombre: string, numero: string) {
    return this.pedir<Jugada>('post', `/juego/${id}/jugar`, { nombre, numero });
  }

  private pedir<T>(metodo: 'get' | 'post' | 'put', ruta: string, body?: unknown): Observable<T> {
    const url = `/api${ruta}`;
    const req =
      metodo === 'get'
        ? this.http.get<T>(url, { observe: 'response' })
        : metodo === 'post'
          ? this.http.post<T>(url, body, { observe: 'response' })
          : this.http.put<T>(url, body, { observe: 'response' });
    return req.pipe(
      tap((res: HttpResponse<T>) => {
        const pod = res.headers.get('x-pod');
        if (pod) {
          this.pod = pod;
        }
      }),
      map((res) => res.body as T),
    );
  }
}
