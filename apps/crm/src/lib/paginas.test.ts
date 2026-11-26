import { describe, expect, it } from "vitest";
import {
  contraste,
  modelosPagina,
  paletasPagina,
  plantillaPorId,
  preguntasDeTexto,
  resolverTema,
  textoSobre,
  bloquesDeTexto,
  listaImagenes,
  SLUG_VALIDO,
  slugDe,
  urlSegura,
} from "@tinta/compartido/paginas";

describe("slugDe", () => {
  it("quita tildes, mayúsculas y signos", () => {
    expect(slugDe("Cuidados después del tatuaje")).toBe("cuidados-despues-del-tatuaje");
    expect(slugDe("  ¡Jornada flash! Ñu & co.  ")).toBe("jornada-flash-nu-co");
  });

  it("siempre da una dirección válida o vacía", () => {
    for (const texto of ["---", "a--b", "x".repeat(90) + " y", "Año 2026"]) {
      const slug = slugDe(texto);
      expect(slug === "" || SLUG_VALIDO.test(slug)).toBe(true);
      expect(slug.length).toBeLessThanOrEqual(80);
    }
  });
});

describe("urlSegura", () => {
  it("acepta rutas propias y https", () => {
    expect(urlSegura("/fotos/flash/rosa.webp")).toBe(true);
    expect(urlSegura("https://ejemplo.com/a.jpg")).toBe(true);
  });

  it("rechaza esquemas peligrosos y rutas a otro dominio", () => {
    expect(urlSegura("javascript:alert(1)")).toBe(false);
    expect(urlSegura("//otro-sitio.com/a.jpg")).toBe(false);
    expect(urlSegura("http://ejemplo.com")).toBe(false);
  });
});

describe("bloquesDeTexto", () => {
  it("separa párrafos por línea en blanco y reconoce subtítulos", () => {
    expect(bloquesDeTexto("## Primeros días\r\n\r\nLava con jabón.\nSin frotar.\n\n\nSol no.")).toEqual([
      { tipo: "subtitulo", texto: "Primeros días" },
      { tipo: "parrafo", texto: "Lava con jabón.\nSin frotar." },
      { tipo: "parrafo", texto: "Sol no." },
    ]);
  });
});

describe("listaImagenes", () => {
  it("una por línea, sin vacías ni inseguras", () => {
    expect(listaImagenes("/a.webp\n\n javascript:x \nhttps://b.com/c.jpg ")).toEqual([
      "/a.webp",
      "https://b.com/c.jpg",
    ]);
  });
});

describe("preguntasDeTexto", () => {
  it("agrupa los párrafos bajo su pregunta", () => {
    expect(preguntasDeTexto("Suelto\n\n## ¿Duele?\n\nUn poco.\n\nDepende.\n\n## ¿Precio?\n\nCerrado.")).toEqual([
      { pregunta: "¿Duele?", respuesta: ["Un poco.", "Depende."] },
      { pregunta: "¿Precio?", respuesta: ["Cerrado."] },
    ]);
  });
});

describe("tema", () => {
  it("resuelve lo vacío o roto a la paleta por defecto", () => {
    expect(resolverTema(undefined)).toEqual({ paleta: "tinta", ...colores(paletasPagina.tinta), letra: "editorial" });
    expect(resolverTema({ paleta: "nada", acento: "rojo", letra: "comic" }).acento).toBe(paletasPagina.tinta.acento);
  });

  it("los retoques a mano mandan sobre la paleta", () => {
    expect(resolverTema({ paleta: "neon", acento: "#FF0000", letra: "moderna" })).toMatchObject({
      paleta: "neon",
      fondo: paletasPagina.neon.fondo,
      acento: "#ff0000",
      letra: "moderna",
    });
  });

  it("todas las paletas se leen (AA) y el texto sobre el acento también", () => {
    for (const paleta of Object.values(paletasPagina)) {
      expect(contraste(paleta.texto, paleta.fondo)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(textoSobre(paleta.acento), paleta.acento)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("modelos", () => {
  it("cada modelo usa una plantilla real, rellena lo obligatorio y solo enlaza a sitios seguros", () => {
    for (const modelo of modelosPagina) {
      const plantilla = plantillaPorId(modelo.plantilla);
      expect(plantilla, modelo.id).toBeDefined();
      expect(SLUG_VALIDO.test(slugDe(modelo.titulo))).toBe(true);
      for (const campo of plantilla!.campos) {
        const valor = modelo.contenido[campo.clave] ?? "";
        if (campo.obligatorio) expect(valor, `${modelo.id}.${campo.clave}`).not.toBe("");
        if (campo.tipo === "imagen" || campo.tipo === "enlace") expect(!valor || urlSegura(valor)).toBe(true);
        if (campo.tipo === "imagenes") expect(listaImagenes(valor).length).toBe(valor.split("\n").length);
      }
    }
  });
});

function colores({ fondo, texto, acento }: { fondo: string; texto: string; acento: string }) {
  return { fondo, texto, acento };
}
