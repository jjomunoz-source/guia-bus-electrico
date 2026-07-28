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

const DESVIOS_DEMO_KEY = "stu_desvios_demo";
const FALLAS_DEMO_KEY = "stu_fallas_demo";

function leerLocal(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave) || "[]");
  } catch {
    return [];
  }
}

function guardarLocal(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

function escaparTexto(valor) {
  const nodo = document.createElement("span");
  nodo.textContent = valor;
  return nodo.innerHTML;
}

function formatearFecha(valor) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(valor));
}

function obtenerDesviosVigentes() {
  const ahora = Date.now();
  return leerLocal(DESVIOS_DEMO_KEY).filter(desvio => new Date(desvio.fin).getTime() > ahora);
}

function renderizarDesvios() {
  const listado = document.getElementById("desvios-listado");
  if (!listado) return;

  const desvios = obtenerDesviosVigentes();
  const contadorMenu = document.getElementById("menu-desvios-contador");
  const contadorRecorridos = document.getElementById("recorridos-desvios-contador");
  const estado = document.getElementById("desvios-estado-general");

  [contadorMenu, contadorRecorridos].forEach(contador => {
    if (contador) contador.textContent = String(desvios.length);
  });

  estado.textContent = desvios.length ? `${desvios.length} vigente${desvios.length === 1 ? "" : "s"}` : "Sin desvíos";
  estado.classList.toggle("pill-alerta", desvios.length > 0);
  estado.classList.toggle("pill-ok", desvios.length === 0);

  if (!desvios.length) {
    listado.innerHTML = `
      <div class="estado-vacio">
        <span aria-hidden="true">✅</span>
        <strong>No hay desvíos no programados vigentes</strong>
        <p>El recorrido habitual se mantiene. Verifica nuevamente antes de iniciar tu servicio.</p>
      </div>`;
    return;
  }

  listado.innerHTML = desvios
    .sort((a, b) => new Date(a.fin) - new Date(b.fin))
    .map(desvio => `
      <article class="tarjeta-desvio">
        <div class="tarjeta-desvio-cabecera">
          <span class="servicio">${escaparTexto(desvio.servicio)}</span>
          <span class="vigencia">Hasta ${formatearFecha(desvio.fin)}</span>
        </div>
        <h3>${escaparTexto(desvio.sector)}</h3>
        ${desvio.motivo ? `<p><strong>Motivo:</strong> ${escaparTexto(desvio.motivo)}</p>` : ""}
        <p class="instruccion-desvio">${escaparTexto(desvio.instrucciones)}</p>
        <p class="actualizacion">Publicado ${formatearFecha(desvio.creado)}</p>
        <button type="button" class="btn-secundario" data-cerrar-desvio="${desvio.id}">
          Finalizar desvío (demostración)
        </button>
      </article>`)
    .join("");
}

document.getElementById("desvio-form")?.addEventListener("submit", evento => {
  evento.preventDefault();
  const inicio = document.getElementById("desvio-inicio").value;
  const fin = document.getElementById("desvio-fin").value;
  const mensaje = document.getElementById("desvio-mensaje");

  if (new Date(fin) <= new Date(inicio)) {
    mensaje.textContent = "La fecha de término debe ser posterior al inicio.";
    mensaje.classList.add("error");
    return;
  }

  const desvios = leerLocal(DESVIOS_DEMO_KEY);
  desvios.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    servicio: document.getElementById("desvio-servicio").value,
    sector: document.getElementById("desvio-sector").value.trim(),
    instrucciones: document.getElementById("desvio-instrucciones").value.trim(),
    motivo: document.getElementById("desvio-motivo").value.trim(),
    inicio,
    fin,
    creado: new Date().toISOString()
  });
  guardarLocal(DESVIOS_DEMO_KEY, desvios);
  evento.target.reset();
  mensaje.textContent = "Desvío de demostración publicado correctamente.";
  mensaje.classList.remove("error");
  renderizarDesvios();
});

document.getElementById("desvios-listado")?.addEventListener("click", evento => {
  const boton = evento.target.closest("[data-cerrar-desvio]");
  if (!boton) return;
  const restantes = leerLocal(DESVIOS_DEMO_KEY)
    .filter(desvio => desvio.id !== boton.dataset.cerrarDesvio);
  guardarLocal(DESVIOS_DEMO_KEY, restantes);
  renderizarDesvios();
});

document.getElementById("falla-form")?.addEventListener("submit", evento => {
  evento.preventDefault();
  const reportes = leerLocal(FALLAS_DEMO_KEY);
  const correlativo = String(reportes.length + 1).padStart(4, "0");
  const ticket = `STU-${new Date().getFullYear()}-${correlativo}`;
  const prioridad = document.getElementById("falla-prioridad").value;

  reportes.push({
    ticket,
    bus: document.getElementById("falla-bus").value.trim(),
    patente: document.getElementById("falla-patente").value.trim().toUpperCase(),
    conductor: document.getElementById("falla-conductor").value.trim(),
    identificacion: document.getElementById("falla-id-conductor").value.trim(),
    servicio: document.getElementById("falla-servicio").value.trim(),
    ubicacion: document.getElementById("falla-ubicacion").value.trim(),
    tipo: document.getElementById("falla-tipo").value,
    prioridad,
    descripcion: document.getElementById("falla-descripcion").value.trim(),
    enPatio: document.getElementById("falla-en-patio").checked,
    estado: "Reportada",
    creado: new Date().toISOString()
  });
  guardarLocal(FALLAS_DEMO_KEY, reportes);

  const confirmacion = document.getElementById("falla-confirmacion");
  confirmacion.innerHTML = `
    <strong>✅ Reporte registrado para la demostración</strong>
    <p>Ticket <b>${ticket}</b> · Estado: <b>Reportada</b></p>
    <p class="${prioridad === "critica" ? "texto-critico" : ""}">
      ${prioridad === "critica"
        ? "Bus marcado como no disponible hasta revisión autorizada."
        : "El reporte quedaría disponible para seguimiento operativo."}
    </p>`;
  confirmacion.classList.remove("oculto");
  evento.target.reset();
  confirmacion.scrollIntoView({ behavior: "smooth", block: "center" });
});

function prepararFechasDesvio() {
  const inicio = document.getElementById("desvio-inicio");
  const fin = document.getElementById("desvio-fin");
  if (!inicio || inicio.value) return;

  const ahora = new Date();
  const despues = new Date(ahora.getTime() + 20 * 60 * 1000);
  const local = fecha => {
    const ajustada = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
    return ajustada.toISOString().slice(0, 16);
  };
  inicio.value = local(ahora);
  fin.value = local(despues);
}

prepararFechasDesvio();
renderizarDesvios();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.error("No fue posible registrar el modo offline:", error);
    });
  });
}
