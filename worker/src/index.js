function respuestaJson(cuerpo, estado, origen) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origen,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origen = request.headers.get("Origin") || "";
    const origenPermitido = env.ALLOWED_ORIGIN;

    if (origen !== origenPermitido) {
      return respuestaJson({ error: "Origen no autorizado." }, 403, origenPermitido);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origenPermitido,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    if (request.method !== "GET" || url.pathname !== "/directorio") {
      return respuestaJson({ error: "Ruta no disponible." }, 404, origenPermitido);
    }

    if (!env.CONTACTS_JSON) {
      return respuestaJson({ error: "Servicio no configurado." }, 503, origenPermitido);
    }

    let grupos;
    try {
      grupos = JSON.parse(env.CONTACTS_JSON).grupos;
      if (!Array.isArray(grupos)) {
        throw new Error("Formato inválido");
      }
    } catch {
      return respuestaJson({ error: "Directorio temporalmente no disponible." }, 503, origenPermitido);
    }

    return respuestaJson({ grupos }, 200, origenPermitido);
  }
};
