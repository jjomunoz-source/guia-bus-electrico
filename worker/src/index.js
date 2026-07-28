const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64Url(bytes) {
  let binario = "";
  bytes.forEach(byte => {
    binario += String.fromCharCode(byte);
  });
  return btoa(binario)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function desdeBase64Url(valor) {
  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const binario = atob(base64 + relleno);
  return Uint8Array.from(binario, caracter => caracter.charCodeAt(0));
}

async function claveHmac(secreto) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function crearToken(secreto, ttl) {
  const carga = {
    exp: Math.floor(Date.now() / 1000) + ttl,
    scope: "directorio"
  };
  const cargaCodificada = base64Url(encoder.encode(JSON.stringify(carga)));
  const firma = await crypto.subtle.sign(
    "HMAC",
    await claveHmac(secreto),
    encoder.encode(cargaCodificada)
  );
  return `${cargaCodificada}.${base64Url(new Uint8Array(firma))}`;
}

async function tokenValido(token, secreto) {
  if (!token || !token.includes(".")) {
    return false;
  }

  try {
    const [cargaCodificada, firmaCodificada] = token.split(".");
    const firmaValida = await crypto.subtle.verify(
      "HMAC",
      await claveHmac(secreto),
      desdeBase64Url(firmaCodificada),
      encoder.encode(cargaCodificada)
    );
    if (!firmaValida) {
      return false;
    }

    const carga = JSON.parse(decoder.decode(desdeBase64Url(cargaCodificada)));
    return carga.scope === "directorio" &&
      Number.isFinite(carga.exp) &&
      carga.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

async function valoresIguales(valorA, valorB) {
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(valorA)),
    crypto.subtle.digest("SHA-256", encoder.encode(valorB))
  ]);
  const a = new Uint8Array(hashA);
  const b = new Uint8Array(hashB);
  let diferencia = a.length ^ b.length;
  for (let indice = 0; indice < Math.max(a.length, b.length); indice += 1) {
    diferencia |= (a[indice] || 0) ^ (b[indice] || 0);
  }
  return diferencia === 0;
}

function respuestaJson(cuerpo, estado, origen) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origen,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
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
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    if (request.method !== "POST" || url.pathname !== "/directorio") {
      return respuestaJson({ error: "Ruta no disponible." }, 404, origenPermitido);
    }

    if (!env.ACCESS_PIN || !env.AUTH_SECRET || !env.CONTACTS_JSON) {
      return respuestaJson({ error: "Servicio no configurado." }, 503, origenPermitido);
    }

    const cuerpo = await request.json().catch(() => ({}));
    const autorizadoPorToken = await tokenValido(cuerpo.token, env.AUTH_SECRET);
    const autorizadoPorPin = typeof cuerpo.pin === "string" &&
      await valoresIguales(cuerpo.pin, env.ACCESS_PIN);

    if (!autorizadoPorToken && !autorizadoPorPin) {
      return respuestaJson({ error: "PIN incorrecto o acceso vencido." }, 401, origenPermitido);
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

    const token = autorizadoPorPin
      ? await crearToken(env.AUTH_SECRET, Number(env.TOKEN_TTL_SECONDS) || 604800)
      : cuerpo.token;

    return respuestaJson({ grupos, token }, 200, origenPermitido);
  }
};
