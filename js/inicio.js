/* ==========================================================
   INICIO.JS
   1) Dibuja el fondo mecatrónico en <canvas>:
      engranajes que se acoplan, pistas de circuito con pulsos
      de corriente y ondas tipo osciloscopio.
   2) Maneja el botón "Inicio": acelera el fondo, abre una
      cortina circular y navega a invitacion.html.
   ========================================================== */

(() => {
  const canvas = document.getElementById("fondo");
  const ctx = canvas.getContext("2d");
  const btn = document.getElementById("btnInicio");
  const cortina = document.getElementById("cortina");

  const COLOR_FONDO = "#0a1018";
  const COLOR_ACERO = "95, 180, 214";   // rgb del acero (se usa con alfa)
  const COLOR_COBRE = "232, 161, 90";   // rgb del cobre

  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FACTOR_BASE = reducirMovimiento ? 0.2 : 1;

  let w = 0, h = 0, dpr = 1;
  let impulso = 1;            // multiplicador de velocidad (sube al pulsar Inicio)
  let impulsoObjetivo = 1;
  let tiempo = 0;

  let engranajes = [];
  let trazas = [];
  let pulsos = [];

  /* ---------------- Engranajes ---------------- */
  // r = radio primitivo, n = número de dientes. Con el mismo "módulo"
  // (r/n) dos engranajes pueden acoplarse.
  const MODULO = 5;

  class Engranaje {
    constructor(x, y, dientes, velocidad, esMotor, padre, theta) {
      this.x = x;
      this.y = y;
      this.n = dientes;
      this.r = dientes * MODULO;
      this.velocidad = velocidad;  // rad/s (solo para el engranaje motor)
      this.esMotor = esMotor;
      this.padre = padre;          // engranaje con el que se acopla
      this.theta = theta;          // ángulo de la línea de centros padre → este
      this.ang = 0;
    }

    actualizar(dt) {
      if (this.esMotor) {
        this.ang += this.velocidad * dt * impulso * FACTOR_BASE;
      } else {
        // Condición de acople: un diente del padre queda frente a un hueco de este.
        const p = this.padre;
        this.ang = this.theta + Math.PI - Math.PI / this.n - (p.n / this.n) * (this.theta - p.ang);
      }
    }

    dibujar() {
      const { x, y, n, r, ang } = this;
      const paso = (Math.PI * 2) / n;
      const raiz = r - MODULO * 0.55;
      const punta = r + MODULO * 0.55;

      ctx.beginPath();
      for (let k = 0; k < n; k++) {
        const a = ang + k * paso;
        const pts = [
          [raiz, a - paso * 0.27],
          [punta, a - paso * 0.13],
          [punta, a + paso * 0.13],
          [raiz, a + paso * 0.27]
        ];
        pts.forEach(([rad, an], i) => {
          const px = x + Math.cos(an) * rad;
          const py = y + Math.sin(an) * rad;
          if (k === 0 && i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(10, 16, 24, 0.9)";   // tapa las pistas que pasan por detrás
      ctx.fill();
      ctx.strokeStyle = `rgba(${COLOR_ACERO}, 0.38)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Aro interior y radios
      ctx.beginPath();
      ctx.arc(x, y, raiz * 0.62, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${COLOR_ACERO}, 0.22)`;
      ctx.stroke();

      const radios = n > 20 ? 6 : 4;
      ctx.beginPath();
      for (let k = 0; k < radios; k++) {
        const a = ang + (k * Math.PI * 2) / radios;
        ctx.moveTo(x + Math.cos(a) * raiz * 0.18, y + Math.sin(a) * raiz * 0.18);
        ctx.lineTo(x + Math.cos(a) * raiz * 0.62, y + Math.sin(a) * raiz * 0.62);
      }
      ctx.stroke();

      // Eje central en cobre
      ctx.beginPath();
      ctx.arc(x, y, raiz * 0.12, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${COLOR_COBRE}, 0.7)`;
      ctx.stroke();
    }
  }

  // Crea una cadena de engranajes acoplados a partir de un motor.
  // pasos: lista de [dientes, ángulo en radianes desde el engranaje anterior]
  function cadena(x, y, dientesMotor, velocidad, pasos) {
    const lista = [];
    let actual = new Engranaje(x, y, dientesMotor, velocidad, true, null, 0);
    lista.push(actual);
    pasos.forEach(([dientes, theta]) => {
      const nr = dientes * MODULO;
      const dist = actual.r + nr;
      const g = new Engranaje(
        actual.x + Math.cos(theta) * dist,
        actual.y + Math.sin(theta) * dist,
        dientes, 0, false, actual, theta
      );
      lista.push(g);
      actual = g;
    });
    return lista;
  }

  /* ---------------- Pistas de circuito ---------------- */
  const CUADRICULA = 28;

  function crearTraza() {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let gx = Math.floor((Math.random() * w) / CUADRICULA);
    let gy = Math.floor((Math.random() * h) / CUADRICULA);
    const pts = [[gx * CUADRICULA, gy * CUADRICULA]];
    let dirAnterior = Math.floor(Math.random() * dirs.length);
    const segmentos = 4 + Math.floor(Math.random() * 5);

    for (let s = 0; s < segmentos; s++) {
      // Tiende a seguir recto o girar 45°
      const giro = [0, 0, 1, -1][Math.floor(Math.random() * 4)];
      const idx = (dirAnterior + giro + dirs.length) % dirs.length;
      const [dx, dy] = dirs[idx];
      const largo = 3 + Math.floor(Math.random() * 7);
      const nx = gx + dx * largo;
      const ny = gy + dy * largo;
      if (nx < 0 || ny < 0 || nx * CUADRICULA > w || ny * CUADRICULA > h) break;
      gx = nx; gy = ny; dirAnterior = idx;
      pts.push([gx * CUADRICULA, gy * CUADRICULA]);
    }
    if (pts.length < 3) return null;

    // Longitudes acumuladas para mover los pulsos a lo largo de la pista
    const acum = [0];
    for (let i = 1; i < pts.length; i++) {
      acum.push(acum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    return { pts, acum, total: acum[acum.length - 1] };
  }

  function posicionEnTraza(t, d) {
    let i = 1;
    while (i < t.acum.length - 1 && t.acum[i] < d) i++;
    const f = (d - t.acum[i - 1]) / (t.acum[i] - t.acum[i - 1] || 1);
    return [
      t.pts[i - 1][0] + (t.pts[i][0] - t.pts[i - 1][0]) * f,
      t.pts[i - 1][1] + (t.pts[i][1] - t.pts[i - 1][1]) * f
    ];
  }

  /* ---------------- Construcción de la escena ---------------- */
  function construir() {
    const u = Math.min(w, h);
    const e = Math.max(0.7, Math.min(1.5, u / 700)); // escala según el tamaño de pantalla

    // Dientes escalados (el módulo es fijo, así que cambia el tamaño con el nº de dientes)
    const d = (n) => Math.max(8, Math.round(n * e));

    engranajes = [
      ...cadena(w * 0.10, h * 0.20, d(16), 0.35, [[d(10), 0.5], [d(14), -0.35], [d(9), 0.7]]),
      ...cadena(w * 0.90, h * 0.80, d(18), -0.3, [[d(11), Math.PI + 0.55], [d(15), Math.PI - 0.4]]),
      ...cadena(w * 0.82, h * 0.12, d(9), 0.6, [[d(13), 2.3], [d(8), 1.6]]),
      ...cadena(w * 0.14, h * 0.86, d(8), -0.7, [[d(12), -0.5], [d(7), -1.2]])
    ];

    const cantidad = Math.max(24, Math.min(70, Math.round((w * h) / 22000)));
    trazas = [];
    while (trazas.length < cantidad) {
      const t = crearTraza();
      if (t) trazas.push(t);
    }

    pulsos = trazas
      .filter(() => Math.random() < 0.55)
      .map((t) => ({
        traza: t,
        d: Math.random() * t.total,
        v: 40 + Math.random() * 70
      }));
  }

  function ajustarTamano() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    construir();
  }

  /* ---------------- Dibujo por cuadro ---------------- */
  function dibujarCuadricula() {
    ctx.strokeStyle = `rgba(${COLOR_ACERO}, 0.045)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += CUADRICULA * 2) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = 0; y <= h; y += CUADRICULA * 2) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();
  }

  function dibujarTrazas() {
    ctx.lineWidth = 1.4;
    ctx.lineJoin = "round";
    trazas.forEach((t) => {
      ctx.beginPath();
      t.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = `rgba(${COLOR_ACERO}, 0.16)`;
      ctx.stroke();

      // Pads (círculos) en los extremos
      [t.pts[0], t.pts[t.pts.length - 1]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${COLOR_COBRE}, 0.4)`;
        ctx.stroke();
      });
    });
  }

  function dibujarPulsos(dt) {
    pulsos.forEach((p) => {
      p.d += p.v * dt * impulso * FACTOR_BASE;
      if (p.d > p.traza.total) p.d = 0;

      // Cola del pulso: varios puntos que se van apagando
      for (let k = 0; k < 10; k++) {
        const dd = p.d - k * 4;
        if (dd < 0) break;
        const [x, y] = posicionEnTraza(p.traza, dd);
        ctx.beginPath();
        ctx.arc(x, y, 2.6 - k * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR_COBRE}, ${0.9 - k * 0.09})`;
        ctx.fill();
      }
    });
  }

  function dibujarOndas() {
    const base = h * 0.5;
    const capas = [
      { amp: 26, frec: 0.011, vel: 1.1, alfa: 0.12 },
      { amp: 16, frec: 0.019, vel: -1.6, alfa: 0.1 },
      { amp: 9,  frec: 0.034, vel: 2.4, alfa: 0.08 }
    ];
    capas.forEach((c, i) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = base + (i - 1) * 46 +
          Math.sin(x * c.frec + tiempo * c.vel * FACTOR_BASE) * c.amp *
          (0.6 + 0.4 * Math.sin(x * 0.004 + tiempo * 0.5 * FACTOR_BASE));
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${COLOR_ACERO}, ${c.alfa})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
  }

  let ultimo = performance.now();
  function cuadro(ahora) {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    tiempo += dt;

    // El impulso se acerca suavemente a su objetivo
    impulso += (impulsoObjetivo - impulso) * Math.min(1, dt * 4);

    ctx.fillStyle = COLOR_FONDO;
    ctx.fillRect(0, 0, w, h);

    dibujarCuadricula();
    dibujarOndas();
    dibujarTrazas();
    dibujarPulsos(dt);

    engranajes.forEach((g) => g.actualizar(dt));
    engranajes.forEach((g) => g.dibujar());

    requestAnimationFrame(cuadro);
  }

  /* ---------------- Botón Inicio + transición ---------------- */
  function irALaInvitacion() {
    btn.disabled = true;
    impulsoObjetivo = 7;   // el fondo se acelera

    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const radioFinal = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 20;

    const anim = cortina.animate(
      [
        { clipPath: `circle(0px at ${cx}px ${cy}px)` },
        { clipPath: `circle(${radioFinal}px at ${cx}px ${cy}px)` }
      ],
      { duration: reducirMovimiento ? 1 : 1100, delay: reducirMovimiento ? 0 : 350, easing: "cubic-bezier(.7,0,.3,1)", fill: "forwards" }
    );
    anim.onfinish = () => { window.location.href = "invitacion.html"; };
  }

  btn.addEventListener("click", irALaInvitacion);

  // Si el usuario vuelve con el botón "atrás", se restablece la pantalla
  window.addEventListener("pageshow", (ev) => {
    if (ev.persisted) {
      cortina.getAnimations().forEach((a) => a.cancel());
      btn.disabled = false;
      impulsoObjetivo = 1;
    }
  });

  window.addEventListener("resize", ajustarTamano);
  ajustarTamano();
  requestAnimationFrame(cuadro);
})();
