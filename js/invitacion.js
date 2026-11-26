/* ==========================================================
   INVITACION.JS — lógica principal de la página de la carta
   Secuencia:
     1) entrada (se retira el telón verde)
     2) clic en el sobre  -> se abre la solapa, sale la carta
     3) botón Acepto      -> aparecen las rayitas y se dibujan las firmas
     4) la carta vuelve al sobre y se cierra la solapa
     5) js/avion.js       -> el sobre se pliega, vuela y sale el mensaje final
   ========================================================== */

(() => {
  const $ = (id) => document.getElementById(id);
  const raiz = document.documentElement;

  const el = {
    telon: $("telon"), escena: $("escena"), stage: $("stage"),
    sobreAtras: $("sobreAtras"), sobreFrente: $("sobreFrente"),
    solapaAtras: $("solapaAtras"), pF: $("pF"), sello: $("sello"), selloForma: $("selloForma"),
    carta: $("carta"), cuerpo: $("cartaCuerpo"),
    btnSobre: $("btnSobre"), pista: $("pista"),
    btnAcepto: $("btnAcepto"), zonaAccion: $("zonaAccion"), firmas: $("firmas"),
    firmaInvitado: $("firmaInvitado"), firmaAnfitrion: $("firmaAnfitrion"),
    final: $("final"), finalA: $("finalA"), finalB: $("finalB")
  };

  /* ---------------- Utilidades de animación ---------------- */
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = reducir ? 0.25 : 1; // factor de tiempo: con "reducir movimiento" todo es 4 veces más rápido

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms * T));

  // Anima con la Web Animations API y deja aplicado el estado final.
  function anim(elemento, frames, opciones) {
    const a = elemento.animate(frames, {
      fill: "forwards",
      easing: "ease",
      ...opciones,
      duration: opciones.duration * T,
      delay: (opciones.delay || 0) * T
    });
    return a.finished.then(() => {
      try { a.commitStyles(); } catch (e) { /* elemento oculto: no pasa nada */ }
      a.cancel();
    });
  }

  // Animación manual (para mover los puntos de los polígonos SVG).
  const suavizado = {
    entradaSalida: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    salida: (p) => 1 - Math.pow(1 - p, 3)
  };
  function tween(duracion, ease, fn) {
    return new Promise((resolver) => {
      const t0 = performance.now();
      const d = duracion * T;
      (function paso(ahora) {
        const p = Math.min(1, (ahora - t0) / d);
        fn(ease(p));
        p < 1 ? requestAnimationFrame(paso) : resolver();
      })(t0);
    });
  }

  /* ---------------- Medidas responsivas ---------------- */
  const PROPORCION_SOBRE = 230 / 340;
  const M = {};
  let estadoCarta = "dentro";

  function medir() {
    M.ew = Math.min(340, window.innerWidth * 0.8);
    M.eh = M.ew * PROPORCION_SOBRE;
    M.lw = Math.min(560, window.innerWidth * 0.92);
    M.lh = Math.min(window.innerHeight * 0.86, 720);
    raiz.style.setProperty("--ew", M.ew + "px");
    raiz.style.setProperty("--lw", M.lw + "px");
    raiz.style.setProperty("--lh", M.lh + "px");

    M.s0 = (M.ew * 0.88) / M.lw;                              // escala de la carta dentro del sobre
    const visible = M.eh * 0.8;                               // alto de carta que cabe en el sobre
    M.clipDentro = Math.max(0, M.lh - visible / M.s0);        // lo que se recorta abajo (sin escala)
    M.yDentro = -M.eh / 2 + M.eh * 0.1;                       // borde superior de la carta dentro
    M.yAsoma = M.yDentro - M.eh * 0.62;                       // asomando por la solapa
    M.yLectura = -M.lh / 2;                                   // centrada en pantalla
  }

  function estadoDeCarta(nombre) {
    const e = {
      dentro:  { y: M.yDentro,  s: M.s0, c: M.clipDentro },
      asoma:   { y: M.yAsoma,   s: M.s0, c: M.clipDentro },
      lectura: { y: M.yLectura, s: 1,    c: 0 }
    }[nombre];
    return {
      transform: `translateY(${e.y}px) scale(${e.s})`,
      clipPath: `inset(0px 0px ${e.c}px 0px)`
    };
  }
  function ponerCarta(nombre) {
    estadoCarta = nombre;
    Object.assign(el.carta.style, estadoDeCarta(nombre));
  }
  function moverCarta(nombre, duracion, easing) {
    estadoCarta = nombre;
    return anim(el.carta, [estadoDeCarta(nombre)], { duration: duracion, easing });
  }

  /* ---------------- Solapa y sello ---------------- */
  // t = 0 cerrada, 0.5 de canto (plana), 1 totalmente abierta (hacia arriba)
  function ponerSolapa(t) {
    const punta = -115 + 140 * Math.cos(Math.PI * t);
    const pts = `-170,-115 170,-115 0,${punta.toFixed(2)}`;
    if (t < 0.5) {
      el.pF.setAttribute("points", pts);
      el.pF.setAttribute("visibility", "visible");
      el.solapaAtras.setAttribute("visibility", "hidden");
    } else {
      el.solapaAtras.setAttribute("points", pts);
      el.solapaAtras.setAttribute("visibility", "visible");
      el.pF.setAttribute("visibility", "hidden");
    }
    el.sello.setAttribute("opacity", t < 0.04 ? 1 : 0);
  }

  // Sello de cera con forma de engrane (guiño a la mecatrónica)
  function dibujarSello() {
    const dientes = 10, rExt = 16, rInt = 12.5;
    let d = "";
    for (let i = 0; i < dientes * 2; i++) {
      const a = (Math.PI * i) / dientes - Math.PI / 2;
      const r = i % 2 === 0 ? rExt : rInt;
      d += (i ? "L" : "M") + (Math.cos(a) * r).toFixed(2) + " " + (Math.sin(a) * r).toFixed(2);
    }
    el.selloForma.setAttribute("d", d + "Z");
    el.sello.setAttribute("transform", "translate(0 3)");
  }

  /* ---------------- Contenido (viene de datos.js) ---------------- */
  function cargarTextos() {
    $("saludo").textContent = DATOS.carta.saludo;
    const cont = $("parrafos");
    DATOS.carta.parrafos.forEach((texto) => {
      const p = document.createElement("p");
      p.textContent = texto;
      cont.appendChild(p);
    });
    $("despedida").textContent = DATOS.carta.despedida;
    $("remitente").textContent = DATOS.carta.remitente;
    el.btnAcepto.querySelector(".btn-acepto-texto").textContent = DATOS.textoBoton;
    el.pista.textContent = DATOS.pistaSobre;
    el.firmaInvitado.textContent = DATOS.invitado;
    el.firmaAnfitrion.textContent = DATOS.anfitrion;
    document.querySelectorAll(".etiqueta").forEach((e) => (e.textContent = DATOS.etiquetaFirma));
    el.finalA.textContent = DATOS.mensajeFinal[0] || "";
    el.finalB.textContent = DATOS.mensajeFinal[1] || "";
  }

  /* ---------------- 1) Entrada ---------------- */
  async function entrada() {
    // Espera a que carguen las tipografías (máx. 1.5 s) para que las firmas salgan bien
    await Promise.race([
      Promise.all([document.fonts.load('3rem "Mrs Saint Delafield"'), document.fonts.ready]),
      new Promise((r) => setTimeout(r, 1500))
    ]);
    anim(el.escena, [{ transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 2600, easing: "cubic-bezier(.2,.7,.2,1)" });
    await anim(el.telon, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500, easing: "ease-in-out" });
    el.telon.style.display = "none";
    anim(el.pista, [{ opacity: 0 }, { opacity: 1 }], { duration: 800 });
  }

  /* ---------------- 2) Abrir el sobre ---------------- */
  async function abrirSobre() {
    el.btnSobre.hidden = true;
    el.pista.style.display = "none";

    // Detiene el vaivén suavemente (sin salto)
    const actual = getComputedStyle(el.stage).transform;
    el.stage.classList.remove("flota");
    await anim(el.stage, [{ transform: actual === "none" ? "translateY(0)" : actual }, { transform: "translateY(0)" }], { duration: 250 });

    await tween(700, suavizado.entradaSalida, (p) => ponerSolapa(p));           // abre la solapa
    await moverCarta("asoma", 800, "cubic-bezier(.3,.7,.2,1)");                // la carta sube
    await esperar(250);

    // El sobre baja y se desvanece mientras la carta crece hasta ser legible
    const salidaSobre = [el.sobreAtras, el.sobreFrente].map((s) =>
      anim(s, [{ transform: "translateY(0) scale(1)", opacity: 1 }, { transform: "translateY(40vh) scale(.92)", opacity: 0 }],
        { duration: 800, easing: "cubic-bezier(.5,0,.8,.4)" }));
    await Promise.all([moverCarta("lectura", 1000, "cubic-bezier(.3,.7,.2,1)"), ...salidaSobre]);

    el.cuerpo.style.overflowY = "auto";
    el.cuerpo.focus({ preventScroll: true });
  }

  /* ---------------- 3) Aceptar y firmar ---------------- */
  // Reduce la tipografía de la firma si el nombre no cabe en su rayita
  function ajustarFirma(trazo) {
    trazo.style.fontSize = "";
    const disponible = trazo.parentElement.clientWidth;
    const real = trazo.getBoundingClientRect().width;
    if (real > disponible) {
      const base = parseFloat(getComputedStyle(trazo).fontSize);
      trazo.style.fontSize = (base * (disponible / real) * 0.97).toFixed(1) + "px";
    }
  }

  function dibujarFirma(trazo) {
    const duracion = 700 + trazo.textContent.length * 85;
    return anim(trazo,
      [{ clipPath: "inset(-40% 100% -40% -10%)" }, { clipPath: "inset(-40% -10% -40% -10%)" }],
      { duration: duracion, easing: "cubic-bezier(.45,.05,.55,.95)" });
  }

  async function aceptar() {
    el.btnAcepto.disabled = true;
    await anim(el.zonaAccion, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
    el.zonaAccion.style.display = "none";

    el.firmas.style.display = "grid";
    el.cuerpo.scrollTo({ top: el.cuerpo.scrollHeight, behavior: reducir ? "auto" : "smooth" });
    el.firmas.querySelectorAll(".trazo").forEach(ajustarFirma);
    await esperar(600);

    const lineas = el.firmas.querySelectorAll(".linea");
    const etiquetas = el.firmas.querySelectorAll(".etiqueta");

    // Las dos rayitas se dibujan de izquierda a derecha, y aparece la palabra debajo
    await Promise.all([...lineas].map((l, i) =>
      anim(l, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 700, delay: i * 180, easing: "cubic-bezier(.6,0,.2,1)" })));
    await Promise.all([...etiquetas].map((e) => anim(e, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 })));
    await esperar(200);

    await dibujarFirma(el.firmaInvitado);    // primero la firma de la persona invitada
    await esperar(250);
    await dibujarFirma(el.firmaAnfitrion);   // después la tuya
    await esperar(1100);

    await guardarCarta();
    await INV.plegarYVolar();
  }

  /* ---------------- 4) La carta vuelve al sobre ---------------- */
  async function guardarCarta() {
    el.cuerpo.style.overflowY = "hidden";

    const llegadaSobre = [el.sobreAtras, el.sobreFrente].map((s) =>
      anim(s, [{ transform: "translateY(40vh) scale(.92)", opacity: 0 }, { transform: "translateY(0) scale(1)", opacity: 1 }],
        { duration: 800, delay: 400, easing: "cubic-bezier(.2,.7,.2,1)" }));
    await Promise.all([moverCarta("asoma", 1000, "cubic-bezier(.6,0,.3,1)"), ...llegadaSobre]);

    await moverCarta("dentro", 700, "cubic-bezier(.5,0,.3,1)");               // la carta entra
    await esperar(150);
    await tween(700, suavizado.entradaSalida, (p) => ponerSolapa(1 - p));     // se cierra la solapa
    await esperar(350);
  }

  /* ---------------- Arranque ---------------- */
  function iniciar() {
    cargarTextos();
    medir();
    dibujarSello();
    ponerSolapa(0);
    ponerCarta("dentro");
    el.cuerpo.style.overflowY = "hidden";
    el.stage.classList.add("flota");

    el.btnSobre.addEventListener("click", abrirSobre);
    el.btnAcepto.addEventListener("click", aceptar);
    window.addEventListener("resize", () => {
      medir();
      if (estadoCarta === "dentro" || estadoCarta === "lectura") ponerCarta(estadoCarta);
    });

    entrada();
  }

  // Lo que necesita js/avion.js
  window.INV = { el, M, anim, tween, suavizado, esperar, reducir, T };

  iniciar();
})();
