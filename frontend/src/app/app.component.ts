import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ApiService, Juego, Jugada } from './api.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, TableModule, TagModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnDestroy {
  nombre = '';
  sesion = '';
  secreto = '';
  intento = '';
  error = '';
  dialogo = false;
  juegos: Juego[] = [];
  seleccion: Juego | null = null;
  ultimo: Jugada | null = null;
  private timer?: ReturnType<typeof setInterval>;

  constructor(public api: ApiService) {
    const guardado = localStorage.getItem('jugador');
    if (guardado) {
      this.sesion = guardado;
      this.empezarReloj();
    }
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  entrar() {
    this.error = '';
    this.api.login(this.nombre).subscribe({
      next: (res) => {
        this.sesion = res.nombre;
        localStorage.setItem('jugador', res.nombre);
        this.empezarReloj();
      },
      error: (e) => {
        this.error = e.error?.mensaje || 'no se pudo entrar';
      },
    });
  }

  salir() {
    localStorage.removeItem('jugador');
    this.sesion = '';
    this.juegos = [];
    this.seleccion = null;
    this.ultimo = null;
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  crear() {
    this.error = '';
    this.api.crear(this.sesion, this.secreto).subscribe({
      next: (juego) => {
        this.dialogo = false;
        this.secreto = '';
        this.seleccion = juego;
        this.ultimo = null;
        this.cargar();
      },
      error: (e) => {
        this.error = e.error?.mensaje || 'no se pudo crear el juego';
      },
    });
  }

  unirse() {
    if (!this.seleccion) {
      return;
    }
    this.error = '';
    this.api.unirse(this.seleccion.id, this.sesion, this.secreto).subscribe({
      next: (juego) => {
        this.seleccion = juego;
        this.secreto = '';
        this.ultimo = null;
        this.cargar();
      },
      error: (e) => {
        this.error = e.error?.mensaje || 'no se pudo unir';
      },
    });
  }

  jugar() {
    if (!this.seleccion) {
      return;
    }
    this.error = '';
    this.api.jugar(this.seleccion.id, this.sesion, this.intento).subscribe({
      next: (jugada) => {
        this.ultimo = jugada;
        this.intento = '';
        this.cargar();
      },
      error: (e) => {
        this.error = e.error?.mensaje || 'no se pudo jugar';
      },
    });
  }

  puedoUnirme() {
    return Boolean(
      this.seleccion && this.seleccion.estado === 'por_iniciar' && this.seleccion.creador !== this.sesion,
    );
  }

  esMiTurno() {
    return Boolean(this.seleccion && this.seleccion.estado === 'en_juego' && this.seleccion.turno === this.sesion);
  }

  etiqueta(estado: string) {
    if (estado === 'por_iniciar') {
      return 'por iniciar';
    }
    if (estado === 'en_juego') {
      return 'en juego';
    }
    return 'terminado';
  }

  severidad(estado: string): 'success' | 'info' | 'warn' {
    if (estado === 'terminado') {
      return 'success';
    }
    if (estado === 'en_juego') {
      return 'info';
    }
    return 'warn';
  }

  private empezarReloj() {
    this.cargar();
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => this.cargar(), 2000);
  }

  private cargar() {
    this.api.listar().subscribe({
      next: (juegos) => {
        this.juegos = juegos;
        if (!this.seleccion) {
          return;
        }
        const fresco = juegos.find((juego) => juego.id === this.seleccion?.id);
        if (fresco) {
          this.seleccion = fresco;
        }
      },
    });
  }
}
