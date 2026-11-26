/* ==========================================================
   AVION.JS
   - Pliega el sobre cerrado hasta convertirlo en avión de papel
     moviendo los puntos de sus 4 triángulos (pB, pL, pR, pF).
   - El avión despega, se aleja, regresa hacia la cámara y sale
     de la pantalla mientras la cámara se acerca al paisaje.
   - Muestra el mensaje final.
   Necesita window.INV (lo crea js/invitacion.js).
   ========================================================== */

(() => {
  const { el, anim, tween, suavizado, esperar } = INV;

  /* ---------- Formas: cada polígono es un triángulo [x,y]×3 ---------- */
  // K0: sobre cerrado (igual al dibujo del HTML)
  const K0 = {
    pB: [[-170, 115], [170, 115], [0, 5]],
    pL: [[-170, -115], [0, 5], [-170, 115]],
    pR: [[170, -115], [0, 5], [170, 115]],
    pF: [[-170, -115], [170, -115], [0, 25]]
  };

  // K1: paso intermedio, el sobre se "dobla por la mitad" (más bajo y angosto)
  const K1 = {};
  Object.keys(K0).forEach((k) => {
    K1[k] = K0[k].map(([x, y]) => [x * 0.96, y * 0.5]);
  });

  // K2: avión de papel apuntando a la derecha
  const K2 = {
    pB: [[185, -5], [-120, 8], [-30, 78]],      // quilla (parte oscura de abajo)
    pL: [[185, -5], [-175, -85], [-120, 8]],    // ala de arriba
    pR: [[185, -5], [-120, 8], [-160, 95]],     // ala de abajo
    pF: [[185, -5], [-90, -60], [-60, -12]]     // pliegue claro sobre el ala
  };

  // Colores: de sobre a avión (el avión tiene más contraste entre caras)
  const COLORES = {
    pB: ["#e4d2a8", "#b99f6a"],
    pL: ["#f1e3c1", "#fbf3dd"],
    pR: ["#eadbb4", "#d8c698"],
    pF: ["#f7ecd1", "#fffaf0"]
  };

  const mezcla = (a, b, t) => a + (b - a) * t;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const color = (c0, c1, t) => {
    const a = hex(c0), b = hex(c1);
    return "rgb(" + a.map((v, i) => Math.round(mezcla(v, b[i], t))).join(",") + ")";
  };

  function puntosEntre(A, B, t) {
    return A.map(([x, y], i) => `${mezcla(x, B[i][0], t).toFixed(2)},${mezcla(y, B[i][1], t).toFixed(2)}`).join(" ");
  }

  // p va de 0 a 1: primero K0→K1 (hasta 0.4), luego K1→K2
  function ponerForma(p) {
    const [de, a, t] = p < 0.4 ? [K0, K1, p / 0.4] : [K1, K2, (p - 0.4) / 0.6];
    Object.keys(K0).forEach((k) => {
      const poly = document.getElementById(k);
      poly.setAttribute("points", puntosEntre(de[k], a[k], t));
      poly.setAttribute("fill", color(COLORES[k][0], COLORES[k][1], p));
    });
  }

  /* ---------- Plegado ---------- */
  async function plegar() {
    el.sobreAtras.style.visibility = "hidden";   // ya no se ve el interior
    el.carta.style.visibility = "hidden";        // la carta ya va dentro del sobre
    anim(el.sello, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
    await esperar(150);
    await tween(1700, suavizado.entradaSalida, ponerForma);
    await esperar(250);
  }

  /* ---------- Vuelo ---------- */
  async function volar() {
    const sobre = el.sobreFrente;

    // El avión se inclina antes de salir
    await anim(sobre,
      [{ transform: "translate(0,0) rotate(0deg) scale(1)" }, { transform: "translate(0,-14px) rotate(-8deg) scale(1)" }],
      { duration: 450, easing: "ease-out" });

    // Cámara: se acerca lentamente al paisaje durante todo el vuelo
    anim(el.escena, [{ transform: "scale(1)" }, { transform: "scale(1.12)" }], { duration: 3800, easing: "ease-in-out" });

    // Trayecto: sube y se aleja → da la vuelta → regresa y pasa frente a la cámara
    const vuelo = anim(sobre, [
      { offset: 0,    transform: "translate(0,-14px) rotate(-8deg) scale(1)",           opacity: 1, easing: "cubic-bezier(.3,0,.5,1)" },
      { offset: 0.40, transform: "translate(34vw,-30vh) rotate(-22deg) scale(.30)",     opacity: 1, easing: "ease-in-out" },
      { offset: 0.55, transform: "translate(30vw,-40vh) rotate(-85deg) scale(.26)",     opacity: 1, easing: "ease-in-out" },
      { offset: 0.68, transform: "translate(14vw,-34vh) rotate(-150deg) scale(.32)",    opacity: 1, easing: "cubic-bezier(.5,0,.9,.6)" },
      { offset: 0.93, transform: "translate(-80vw,70vh) rotate(-205deg) scale(12)",     opacity: 1 },
      { offset: 1,    transform: "translate(-90vw,80vh) rotate(-205deg) scale(13)",     opacity: 0 }
    ], { duration: 3600, easing: "linear" });

    await esperar(2900);     // el mensaje empieza antes de que el avión termine de salir
    mostrarMensaje();
    await vuelo;
    el.stage.style.display = "none";
  }

  /* ---------- Mensaje final ---------- */
  async function mostrarMensaje() {
    const entrada = [
      { opacity: 0, transform: "translateY(16px)", filter: "blur(8px)" },
      { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
    ];
    anim(el.final, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200 });
    await anim(el.finalA, entrada, { duration: 1300, easing: "cubic-bezier(.2,.7,.2,1)" });
    await esperar(350);
    await anim(el.finalB, entrada, { duration: 1300, easing: "cubic-bezier(.2,.7,.2,1)" });
  }

  INV.plegarYVolar = async () => {
    await plegar();
    await volar();
  };
})();
