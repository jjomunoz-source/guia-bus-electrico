function mostrarModulo(id) {
  document.querySelector(".menu").style.display = "none";
  document.getElementById(id).classList.remove("oculto");
}

function volver() {
  document.querySelector(".menu").style.display = "flex";
  document.querySelectorAll(".modulo").forEach(modulo => {
    modulo.classList.add("oculto");
  });
}
function abrirRecorrido(nombre) { ... }
function volverRecorridos() { ... }
function irA(modulo) {
  document.getElementById('pre-salida').classList.add('oculto');
  document.getElementById('menu').classList.remove('oculto');
  mostrarModulo(modulo);
}
