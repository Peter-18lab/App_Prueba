/* ==========================================================
   PAISAJE.JS
   Completa el paisaje del fondo (invitacion.html):
   - pinos de la línea de árboles lejana y del primer plano
   - destellos del sol sobre el lago
   - luciérnagas (canvas)
   Todo se genera con código para no depender de imágenes
   externas: la página funciona con solo estos archivos.
   ========================================================== */

(() => {
  const NS = "http://www.w3.org/2000/svg";

  // Generador pseudoaleatorio con semilla: el paisaje se ve igual en cada visita.
  function semilla(s) {
    return () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = semilla(2024);

  // Un pino = 4 triángulos apilados + tronco, devuelto como texto de path.
  function pino(x, base, alto) {
    const ancho = alto * 0.36;
    let d = "";
    for (let i = 0; i < 4; i++) {
      const apice = base - alto + i * alto * 0.2;
      const suelo = base - alto + alto * (0.4 + i * 0.2);
      const mitad = (ancho / 2) * (0.5 + (0.5 * i) / 3);
      d += `M${x.toFixed(1)} ${apice.toFixed(1)}L${(x - mitad).toFixed(1)} ${suelo.toFixed(1)}L${(x + mitad).toFixed(1)} ${suelo.toFixed(1)}Z`;
    }
    d += `M${(x - alto * 0.02).toFixed(1)} ${(base - alto * 0.04).toFixed(1)}h${(alto * 0.04).toFixed(1)}v${(alto * 0.05).toFixed(1)}h${(-alto * 0.04).toFixed(1)}Z`;
    return d;
  }

  function trazo(contenedor, d, relleno, opacidad = 1) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    p.setAttribute("fill", relleno);
    if (opacidad < 1) p.setAttribute("opacity", opacidad);
    contenedor.appendChild(p);
  }

  /* ---------- Árboles ---------- */
  const lejanos = document.getElementById("arbolesLejanos");
  const cercanos = document.getElementById("arbolesCerca");

  // Línea de árboles en la orilla lejana del lago
  let d = "";
  for (let x = -10; x < 1620; x += 11 + rnd() * 8) {
    d += pino(x, 656, 24 + rnd() * 26);
  }
  trazo(lejanos, d, "#2a4943");

  // Orilla oscura a los lados del lago
  const orillaIzq = document.createElementNS(NS, "path");
  orillaIzq.setAttribute("d", "M0 900 L0 770 Q150 800 330 860 Q420 885 470 900 Z");
  orillaIzq.setAttribute("fill", "#16302a");
  cercanos.appendChild(orillaIzq);
  const orillaDer = document.createElementNS(NS, "path");
  orillaDer.setAttribute("d", "M1600 900 L1600 790 Q1450 810 1300 870 Q1250 890 1210 900 Z");
  orillaDer.setAttribute("fill", "#16302a");
  cercanos.appendChild(orillaDer);

  // Pinos grandes de primer plano: dos filas (la de atrás más clara)
  let atrasI = "", atrasD = "", frenteI = "", frenteD = "";
  for (let i = 0; i < 6; i++) {
    atrasI  += pino(30 + i * 55 + rnd() * 25,   930, 330 + rnd() * 140);
    atrasD  += pino(1570 - i * 55 - rnd() * 25, 930, 330 + rnd() * 140);
  }
  for (let i = 0; i < 4; i++) {
    frenteI += pino(20 + i * 85 + rnd() * 30,   960, 470 + rnd() * 160);
    frenteD += pino(1580 - i * 85 - rnd() * 30, 960, 470 + rnd() * 160);
  }
  const grupoAtras = document.createElementNS(NS, "g");
  trazo(grupoAtras, atrasI + atrasD, "#1f4339");
  cercanos.insertBefore(grupoAtras, orillaIzq);
  trazo(cercanos, frenteI + frenteD, "#122922");

  /* ---------- Destellos del sol en el lago ---------- */
  const reflejo = document.getElementById("reflejoSol");
  for (let y = 668, i = 0; y < 870; y += 13, i++) {
    const ancho = 36 + (y - 668) * 0.55 + rnd() * 30;
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("x", (1040 - ancho / 2 + (rnd() - 0.5) * 20).toFixed(1));
    r.setAttribute("y", y);
    r.setAttribute("width", ancho.toFixed(1));
    r.setAttribute("height", 2.5 + i * 0.12);
    r.setAttribute("rx", 1.5);
    r.setAttribute("fill", "#fff0c8");
    r.setAttribute("class", "destello");
    r.style.animationDelay = (-rnd() * 3.2).toFixed(2) + "s";
    r.style.animationDuration = (2.4 + rnd() * 2).toFixed(2) + "s";
    reflejo.appendChild(r);
  }

  /* ---------- Luciérnagas ---------- */
  const canvas = document.getElementById("luciernagas");
  const ctx = canvas.getContext("2d");
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, bichos = [];

  function ajustar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = w < 600 ? 22 : 40;
    bichos = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: h * (0.35 + Math.random() * 0.6),
      r: 1.2 + Math.random() * 1.6,
      fase: Math.random() * Math.PI * 2,
      vel: 0.3 + Math.random() * 0.6,
      rx: 12 + Math.random() * 30,
      ry: 8 + Math.random() * 22
    }));
  }

  let t = 0, ultimo = performance.now();
  function cuadro(ahora) {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    t += dt;
    ctx.clearRect(0, 0, w, h);
    ctx.shadowColor = "rgba(255, 214, 120, 0.9)";
    ctx.shadowBlur = 12;
    bichos.forEach((b) => {
      const x = b.x + Math.cos(t * b.vel + b.fase) * b.rx;
      const y = b.y + Math.sin(t * b.vel * 1.3 + b.fase) * b.ry;
      const brillo = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6 * b.vel + b.fase * 2));
      ctx.fillStyle = `rgba(255, 232, 150, ${brillo})`;
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (!reducir) requestAnimationFrame(cuadro);
  }

  window.addEventListener("resize", ajustar);
  ajustar();
  requestAnimationFrame(cuadro);
})();
