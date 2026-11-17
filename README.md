# Picas y Fijas

Trabajo de Sistemas Distribuidos. Es el juego de picas y fijas, pero para jugarlo entre dos por peticiones HTTP.

El backend lo hice en Nest y el frontend en Angular con PrimeNG. Las partidas no las dejo en la memoria del proceso: las guardo en Redis. Por eso la api puede tener 2 pods. El Service manda cada peticion al pod que le toque y los dos leen el mismo Redis, entonces el juego no se pierde si cae en el otro pod.

## Como funciona

Cada jugador tiene un numero secreto de 4 digitos y no se pueden repetir. El numero lo mando como texto, por ejemplo `"0123"`, porque si lo mando como numero se pierde el cero de adelante.

Si el digito esta en la misma posicion es una fija. Si esta en el numero pero en otra posicion es una pica.

El ejemplo del enunciado: secreto `4271`, intento `1234`. Eso da 1 fija y 2 picas. La fija es el 2. Las picas son el 1 y el 4.

Gana el primero que adivina el numero del otro. Cuando entra el segundo jugador la partida arranca y el primer turno lo escojo al azar.

Antes de crear, unirse o jugar hay que hacer login. El nombre es el jugador, no maneja clave. En los GET no devuelvo los numeros secretos.

## Endpoints

POST /login
```json
{"nombre":"ana"}
```
Registra el nombre.

POST /juego
```json
{"nombre":"ana","numero":"4271"}
```
Crea la partida con el secreto de quien la abre. Queda en `por_iniciar` hasta que entre el otro.

PUT /juego/{id}
```json
{"nombre":"beto","numero":"8135"}
```
El segundo se une, manda su secreto y ahi si empieza. El turno inicial sale al azar.

POST /juego/{id}/jugar
```json
{"nombre":"beto","numero":"1234"}
```
Solo deja jugar si es el turno de ese nombre. La respuesta trae `fijas`, `picas`, `gano`, `turno`, `estado` y `ganador`.

GET /juego/{id}
Muestra esa partida: `por_iniciar`, `en_juego` o `terminado`. Si ya termino, dice quien gano. Tambien van los intentos, pero sin los secretos.

GET /juego
Lista las partidas, quien las creo y en que van. Si quiero solo las terminadas uso `?estado=terminado`. Tambien sirve `por_iniciar` y `en_juego`.

GET /salud
Lo uso para las probes de Kubernetes. Revisa que Redis responda y devuelve el nombre del pod. En el navegador, arriba, sale ese pod porque la api lo manda en la cabecera `x-pod`.

Si el numero trae letras, no tiene 4 digitos o repite cifras, la api lo rechaza.

## Correrlo en el pc

Primero levanto Redis:

```bash
docker run -d --name redis-picas -p 6379:6379 redis:7-alpine
```

La api, en una terminal:

```bash
cd backend
npm install
npm run start:dev
```

El frontend, en otra:

```bash
cd frontend
npm install
npm start
```

Abro http://localhost:4200. El front llama a `/api` y Angular lo reenvia a la api en el puerto 3000.

Para probar una partida completa sin el navegador:

```bash
node pruebas/flujo.mjs http://localhost:3000
```

Si no quiero correr npm y prefiero dejarlo todo en contenedores:

```bash
docker compose up --build
```

Ahi la pagina queda en http://localhost:8080.

## Imagenes para Kubernetes

En Killercoda el cluster no ve las imagenes que arme en mi pc. Las subo a Docker Hub y el repositorio tiene que quedar publico, si no el pod no las puede bajar.

```bash
docker build -t reich03/picas-fijas-api:1.0 ./backend
docker build -t reich03/picas-fijas-web:1.0 ./frontend
docker login
docker push reich03/picas-fijas-api:1.0
docker push reich03/picas-fijas-web:1.0
```

Si el usuario de Docker Hub no es `reich03`, lo cambio en esos comandos y tambien en `k8s/api.yml` y `k8s/web.yml`.

## Kubernetes

Esto lo corro en Killercoda, en el orden de los archivos:

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

`kubectl get pods` tiene que mostrar 2 pods de la api, 1 de Redis y 1 del frontend. Redis va con un volumen vacio del pod, no use base de datos aparte. Los dos pods de la api comparten ese Redis.

El port-forward lo dejo corriendo y en Killercoda abro la pagina por Traffic / Ports, puerto 8080. Si recargo, el nombre del pod de arriba puede cambiar, porque el Service reparte entre los dos.
