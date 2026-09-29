const DESVIOS_KEY = "desvios-activos";

function encabezadosCors(origen) {
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Pin",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function respuestaJson(cuerpo, estado, origen) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...encabezadosCors(origen),
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function texto(valor, largoMaximo) {
  return typeof valor === "string" ? valor.trim().slice(0, largoMaximo) : "";
}

function pinValido(request, env) {
  const recibido = request.headers.get("X-Admin-Pin") || "";
  return Boolean(env.DESVIOS_ADMIN_PIN && recibido === env.DESVIOS_ADMIN_PIN);
}

function claveImagen(id) {
  return `desvios/${id}/mapa`;
}

function tipoImagenValido(tipo) {
  return ["image/jpeg", "image/png", "image/webp"].includes(tipo);
}

async function responderImagenDesvio(env, origen, url) {
  if (!env.DESVIOS_IMAGES) {
    return respuestaJson({ error: "Almacenamiento de imágenes no configurado." }, 503, origen);
  }

  const partes = url.pathname.split("/").filter(Boolean);
  const objeto = await env.DESVIOS_IMAGES.get(claveImagen(partes[1] || ""));
  if (!objeto) return respuestaJson({ error: "Imagen no encontrada." }, 404, origen);

  const headers = new Headers(encabezadosCors(origen));
  objeto.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=3600");
  headers.set("ETag", objeto.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(objeto.body, { headers });
}

async function leerDesvios(env) {
  const datos = await env.DESVIOS_KV.get(DESVIOS_KEY, "json");
  return Array.isArray(datos) ? datos : [];
}

async function guardarDesvios(env, desvios) {
  await env.DESVIOS_KV.put(DESVIOS_KEY, JSON.stringify(desvios));
}

function vigentes(desvios) {
  const ahora = Date.now();
  return desvios
    .filter(desvio => new Date(desvio.fin).getTime() > ahora)
    .sort((a, b) => new Date(a.fin) - new Date(b.fin));
}

async function responderDirectorio(env, origen) {
  if (!env.CONTACTS_JSON) {
    return respuestaJson({ error: "Servicio no configurado." }, 503, origen);
  }

  try {
    const grupos = JSON.parse(env.CONTACTS_JSON).grupos;
    if (!Array.isArray(grupos)) throw new Error("Formato inválido");
    return respuestaJson({ grupos }, 200, origen);
  } catch {
    return respuestaJson({ error: "Directorio temporalmente no disponible." }, 503, origen);
  }
}

async function responderDesvios(request, env, origen, url) {
  if (!env.DESVIOS_KV) {
    return respuestaJson({ error: "Módulo de desvíos no configurado." }, 503, origen);
  }

  if (request.method === "GET" && url.pathname === "/desvios") {
    return respuestaJson({ desvios: vigentes(await leerDesvios(env)) }, 200, origen);
  }

  if (request.method === "POST" && url.pathname === "/desvios/login") {
    return pinValido(request, env)
      ? respuestaJson({ autorizado: true }, 200, origen)
      : respuestaJson({ error: "PIN incorrecto." }, 401, origen);
  }

  if (!pinValido(request, env)) {
    return respuestaJson({ error: "Acceso no autorizado." }, 401, origen);
  }

  if (request.method === "POST" && url.pathname === "/desvios") {
    let cuerpo;
    let imagen = null;
    try {
      if ((request.headers.get("Content-Type") || "").includes("multipart/form-data")) {
        const formulario = await request.formData();
        cuerpo = Object.fromEntries(formulario.entries());
        imagen = formulario.get("imagen");
      } else {
        cuerpo = await request.json();
      }
    } catch {
      return respuestaJson({ error: "Solicitud inválida." }, 400, origen);
    }

    const servicio = texto(cuerpo.servicio, 40);
    const sector = texto(cuerpo.sector, 100);
    const instrucciones = texto(cuerpo.instrucciones, 500);
    const motivo = texto(cuerpo.motivo, 140);
    const inicio = texto(cuerpo.inicio, 40);
    const fin = texto(cuerpo.fin, 40);
    const inicioMs = new Date(inicio).getTime();
    const finMs = new Date(fin).getTime();

    if (!servicio || !sector || !instrucciones || !Number.isFinite(inicioMs) ||
        !Number.isFinite(finMs) || finMs <= inicioMs || finMs <= Date.now()) {
      return respuestaJson({ error: "Revisa los datos y la vigencia del desvío." }, 400, origen);
    }

    if (imagen &&
        (typeof imagen.arrayBuffer !== "function" || !tipoImagenValido(imagen.type) || imagen.size > 3 * 1024 * 1024)) {
      return respuestaJson({ error: "La imagen debe ser JPG, PNG o WebP y pesar hasta 3 MB." }, 400, origen);
    }
    if (imagen && !env.DESVIOS_IMAGES) {
      return respuestaJson({ error: "Almacenamiento de imágenes no configurado." }, 503, origen);
    }

    const desvios = vigentes(await leerDesvios(env));
    const desvio = {
      id: crypto.randomUUID(),
      servicio,
      sector,
      instrucciones,
      motivo,
      inicio: new Date(inicioMs).toISOString(),
      fin: new Date(finMs).toISOString(),
      creado: new Date().toISOString(),
      tieneImagen: Boolean(imagen),
      imagenActualizada: imagen ? new Date().toISOString() : ""
    };

    if (imagen) {
      await env.DESVIOS_IMAGES.put(claveImagen(desvio.id), imagen.stream(), {
        httpMetadata: { contentType: imagen.type }
      });
    }
    desvios.push(desvio);
    try {
      await guardarDesvios(env, desvios);
    } catch (error) {
      if (imagen) await env.DESVIOS_IMAGES.delete(claveImagen(desvio.id));
      throw error;
    }
    return respuestaJson({ desvio }, 201, origen);
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/desvios/")) {
    const id = decodeURIComponent(url.pathname.slice("/desvios/".length));
    const desvios = await leerDesvios(env);
    const restantes = desvios.filter(desvio => desvio.id !== id);
    if (restantes.length === desvios.length) {
      return respuestaJson({ error: "Desvío no encontrado." }, 404, origen);
    }
    await guardarDesvios(env, restantes);
    if (env.DESVIOS_IMAGES) await env.DESVIOS_IMAGES.delete(claveImagen(id));
    return respuestaJson({ finalizado: true }, 200, origen);
  }

  return respuestaJson({ error: "Ruta no disponible." }, 404, origen);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origen = request.headers.get("Origin") || "";
    const origenPermitido = env.ALLOWED_ORIGIN;

    if (request.method === "GET" && /^\/desvios\/[^/]+\/imagen$/.test(url.pathname)) {
      return responderImagenDesvio(env, origenPermitido, url);
    }

    if (origen !== origenPermitido) {
      return respuestaJson({ error: "Origen no autorizado." }, 403, origenPermitido);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: encabezadosCors(origenPermitido) });
    }

    if (request.method === "GET" && url.pathname === "/directorio") {
      return responderDirectorio(env, origenPermitido);
    }

    if (url.pathname === "/desvios" || url.pathname.startsWith("/desvios/")) {
      return responderDesvios(request, env, origenPermitido, url);
    }

    return respuestaJson({ error: "Ruta no disponible." }, 404, origenPermitido);
  }
};
