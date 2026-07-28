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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.error("No fue posible registrar el modo offline:", error);
    });
  });
}
