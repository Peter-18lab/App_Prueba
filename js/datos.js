/* ==========================================================
   DATOS.JS — AQUÍ EDITAS TODO EL CONTENIDO
   No necesitas tocar HTML, CSS ni el resto del JavaScript
   para cambiar textos, nombres o el mensaje final.
   ========================================================== */

const DATOS = {
  // Nombre de la persona invitada (se dibuja como firma, primera rayita)
  invitado: "Dayra Guardiola",

  // Tu nombre (se dibuja como firma, segunda rayita)
  anfitrion: "Pedro González",

  // Palabra que aparece debajo de cada rayita
  etiquetaFirma: "Asistencia",

  // Texto del botón al final de la carta
  textoBoton: "Acepto",

  // Pista que aparece debajo del sobre
  pistaSobre: "Toca el sobre para abrirlo",

  // CONTENIDO DE LA CARTA
  // Cada elemento del arreglo es un párrafo. Agrega o quita los que quieras.
  carta: {
    saludo: "Querida Dayra:",
    parrafos: [
      "Es muy posible que lo que vaya a decir te parezca una locura. Pero no quiero andar con rodeos; pues este sentimiento no lo quiero ocultar más. Tengo miedo que no sientas lo mismo, pero más miedo me da guardarme este sentimiento",
      "No es por capricho ni soledad, simplemente, algo en ti me cautivo. Y dada la inmensidad del tiempo y la inmensidad del universo, serie un placer inmenso para mi compartir un tiempo contigo.",
      "Por eso te hago esta invitación, para volvernos locos de risa, ebrios de nada y pasear sin prisa por las calles. La idea es simplemente pasar un buen rato, platicar a gusto e irnos conociendo poco a poco. Sin prisas ni expectativas, solo disfrutando el momento para ver que pasa",
      "El lugar ya está decidido, solo falta que aceptes.",
    ],
    despedida: "Con cariño,",
    remitente: "Pedro"
  },

  // MENSAJE FINAL (después de que el avión se va)
  // Cada elemento es una línea.
  mensajeFinal: [
    "La invitación ha sido aceptada",
    "♥ Nos vemos pronto ♥"
  ]
};
