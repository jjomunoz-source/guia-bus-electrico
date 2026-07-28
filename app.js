function ocultarModulos() {
  document.querySelectorAll(".modulo").forEach(modulo => {
    modulo.classList.add("oculto");
  });
}

function abrir(id) {
  const destino = document.getElementById(id);
  if (!destino) {
    console.error(`Módulo no encontrado: ${id}`);
    return;
  }

  document.getElementById("pre-salida").classList.add("oculto");
  document.getElementById("menu").classList.add("oculto");
  ocultarModulos();
  destino.classList.remove("oculto");
  window.scrollTo(0, 0);
}

function volver() {
  ocultarModulos();
  document.querySelectorAll(".submodulo").forEach(submodulo => {
    submodulo.classList.add("oculto");
  });
  document.getElementById("menu").classList.remove("oculto");
  window.scrollTo(0, 0);
}

function mostrarSub(id) {
  const destino = document.getElementById(id);
  if (!destino) {
    console.error(`Submódulo no encontrado: ${id}`);
    return;
  }

  document.querySelectorAll(".submodulo").forEach(submodulo => {
    submodulo.classList.add("oculto");
  });
  destino.classList.remove("oculto");
}

function entrarApp() {
  document.getElementById("pre-salida").classList.add("oculto");
  document.getElementById("menu").classList.remove("oculto");
  window.scrollTo(0, 0);
}

function irA(modulo) {
  const estado = modulo === "recorridos"
    ? document.getElementById("ok-recorrido")
    : document.getElementById("ok-regen");

  if (estado) {
    estado.textContent = "Revisando";
  }
  abrir(modulo);
}

const DIRECTORIO_TOKEN_KEY = "stu_directorio_token";

function obtenerDirectorioApi() {
  return window.STU_DIRECTORY_API || "";
}

function mostrarMensajeDirectorio(mensaje, esError = false) {
  const elemento = document.getElementById("directorio-mensaje");
  elemento.textContent = mensaje;
  elemento.classList.toggle("error", esError);
}

function crearContacto(contacto) {
  const fila = document.createElement("div");
  fila.className = "directorio-contacto";

  const nombre = document.createElement("span");
  nombre.textContent = contacto.nombre;

  const telefono = document.createElement("a");
  telefono.href = `tel:${contacto.telefono}`;
  telefono.textContent = contacto.telefonoVisible || contacto.telefono;
  telefono.setAttribute("aria-label", `Llamar a ${contacto.nombre}`);

  fila.append(nombre, telefono);
  return fila;
}

function renderizarDirectorio(grupos) {
  const listado = document.getElementById("directorio-listado");
  listado.replaceChildren();

  grupos.forEach(grupo => {
    const seccion = document.createElement("section");
    seccion.className = "directorio-grupo";

    const titulo = document.createElement("h3");
    titulo.textContent = grupo.titulo;
    seccion.appendChild(titulo);

    grupo.contactos.forEach(contacto => {
      seccion.appendChild(crearContacto(contacto));
    });
    listado.appendChild(seccion);
  });

  document.getElementById("directorio-acceso").classList.add("oculto");
  document.getElementById("directorio-contenido").classList.remove("oculto");
}

async function solicitarDirectorio(credencial) {
  const api = obtenerDirectorioApi();
  if (!api || api.includes("REEMPLAZAR")) {
    throw new Error("El directorio protegido aún no está configurado.");
  }

  const respuesta = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(credencial)
  });

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.error || "No fue posible abrir el directorio.");
  }
  return datos;
}

async function iniciarDirectorio() {
  const token = localStorage.getItem(DIRECTORIO_TOKEN_KEY);
  if (!token) {
    return;
  }

  try {
    const datos = await solicitarDirectorio({ token });
    renderizarDirectorio(datos.grupos);
  } catch {
    localStorage.removeItem(DIRECTORIO_TOKEN_KEY);
  }
}

document.getElementById("directorio-form")?.addEventListener("submit", async evento => {
  evento.preventDefault();
  const entrada = document.getElementById("directorio-pin");
  const boton = evento.submitter;
  const pin = entrada.value.trim();

  boton.disabled = true;
  mostrarMensajeDirectorio("Verificando acceso…");

  try {
    const datos = await solicitarDirectorio({ pin });
    localStorage.setItem(DIRECTORIO_TOKEN_KEY, datos.token);
    entrada.value = "";
    mostrarMensajeDirectorio("");
    renderizarDirectorio(datos.grupos);
  } catch (error) {
    mostrarMensajeDirectorio(error.message, true);
  } finally {
    boton.disabled = false;
  }
});

document.getElementById("directorio-cerrar")?.addEventListener("click", () => {
  localStorage.removeItem(DIRECTORIO_TOKEN_KEY);
  document.getElementById("directorio-contenido").classList.add("oculto");
  document.getElementById("directorio-acceso").classList.remove("oculto");
  mostrarMensajeDirectorio("Acceso cerrado.");
});

iniciarDirectorio();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.error("No fue posible registrar el modo offline:", error);
    });
  });
}
