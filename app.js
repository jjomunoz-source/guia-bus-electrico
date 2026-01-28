function openModule(modulo) {
  const menu = document.getElementById("menu");
  const content = document.getElementById("content");

  menu.style.display = "none";
  content.style.display = "block";

  if (modulo === "regeneracion") {
    content.innerHTML = `
      <h2>🔋 Frenado regenerativo</h2>

      <p><strong>¿Cómo funciona?</strong></p>
      <p>
        En el bus eléctrico FOTON U12, la regeneración de energía se activa
        al presionar suavemente el pedal de freno, sin llegar a un frenado brusco.
      </p>

      <p><strong>Buenas prácticas:</strong></p>
      <ul>
        <li>Anticipar detenciones</li>
        <li>Presionar el freno de forma progresiva</li>
        <li>Evitar frenadas fuertes innecesarias</li>
      </ul>

      <p><strong>Beneficios:</strong></p>
      <ul>
        <li>Mayor autonomía</li>
        <li>Menor desgaste del sistema de frenos</li>
        <li>Conducción más suave y eficiente</li>
      </ul>

      <button onclick="goBack()">⬅ Volver al menú</button>
    `;
  }

  // módulos futuros (dejamos preparado)
  if (modulo === "conduccion") {
    content.innerHTML = `<h2>🚍 Conducción eficiente</h2><p>Módulo en desarrollo</p><button onclick="goBack()">⬅ Volver</button>`;
  }

  if (modulo === "clima") {
    content.innerHTML = `<h2>❄️ Uso del aire acondicionado</h2><p>Módulo en desarrollo</p><button onclick="goBack()">⬅ Volver</button>`;
  }

  if (modulo === "cabina") {
    content.innerHTML = `<h2>💡 Cabina y controles</h2><p>Módulo en desarrollo</p><button onclick="goBack()">⬅ Volver</button>`;
  }
}

function goBack() {
  document.getElementById("content").style.display = "none";
  document.getElementById("menu").style.display = "block";
}


