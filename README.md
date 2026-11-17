# Picas y Fijas

Juego de picas y fijas en version distribuida, para Sistemas Distribuidos.

Backend en NestJS, frontend en Angular con PrimeNG y el estado de las partidas en Redis. La API puede correr en varios pods porque todos leen y escriben el mismo Redis. El Service reparte las peticiones. Cada respuesta trae la cabecera `x-pod` con el nombre del pod que atendio.

El numero siempre se envia como texto de 4 digitos distintos, por ejemplo `"0123"`, para no perder el cero. El nombre del jugador es su identidad: hay que hacer login antes de crear, unirse o jugar.

## Endpoints

| Metodo | Ruta | Que hace | Cuerpo |
|---|---|---|---|
| POST | /login | Registra el nombre | `{"nombre":"ana"}` |
| POST | /juego | Crea un juego con el numero secreto | `{"nombre":"ana","numero":"4271"}` |
| PUT | /juego/{id} | El segundo jugador se une y el juego arranca. El primer turno sale al azar | `{"nombre":"beto","numero":"8135"}` |
| POST | /juego/{id}/jugar | Intento, solo si es su turno | `{"nombre":"beto","numero":"1234"}` |
| GET | /juego/{id} | Estado: por_iniciar, en_juego o terminado. Si termino, dice quien gano | |
| GET | /juego | Lista los juegos, quien los creo y el estado. Filtro opcional `?estado=terminado` | |
| GET | /salud | Revisa Redis y devuelve el nombre del pod | |

Ejemplo: secreto `4271`, intento `1234`, respuesta una fija y dos picas. La fija es el 2. Las picas son el 1 y el 4.

La respuesta de jugar trae `fijas`, `picas`, `gano`, `turno`, `estado` y `ganador`. Los numeros secretos no salen en ningun GET.

## Local

Hace falta Redis.

```bash
docker run -d --name redis-picas -p 6379:6379 redis:7-alpine
cd backend
npm install
npm run start:dev
```

En otra terminal:

```bash
cd frontend
npm install
npm start
```

Abrir http://localhost:4200. El frontend llama a `/api` y Angular lo reenvia al puerto 3000.

```bash
node pruebas/flujo.mjs http://localhost:3000
```

Tambien se puede levantar todo con Docker:

```bash
docker compose up --build
```

La pagina queda en http://localhost:8080.

## Imagenes

En Killercoda el cluster no tiene las imagenes de la maquina local. Hay que subirlas a Docker Hub (el repositorio debe ser publico).

```bash
docker build -t reich03/picas-fijas-api:1.0 ./backend
docker build -t reich03/picas-fijas-web:1.0 ./frontend
docker login
docker push reich03/picas-fijas-api:1.0
docker push reich03/picas-fijas-web:1.0
```

Si el usuario de Docker Hub es otro, cambia el nombre en estos comandos y en `k8s/api.yml` y `k8s/web.yml`.

## Kubernetes

```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/redis.yml
kubectl apply -f k8s/api.yml
kubectl apply -f k8s/web.yml
kubectl rollout status deployment/picas-fijas-api -n picas-fijas
kubectl get pods -n picas-fijas
kubectl port-forward -n picas-fijas service/picas-fijas-web --address 0.0.0.0 8080:80
```

`kubectl get pods` muestra dos pods de la API, uno de Redis y uno del frontend. Los dos de la API comparten Redis, asi que un juego creado por un pod lo ve el otro. En la pagina, el texto `pod` cambia segun cual atendio la ultima peticion.

En Killercoda la pagina se abre por Traffic / Ports, puerto 8080.
