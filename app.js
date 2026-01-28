const menu = document.getElementById("menu");
const moduleSection = document.getElementById("module");
const moduleContent = document.getElementById("moduleContent");

function openModule(module) {
  menu.classList.add("hidden");
  moduleSection.classList.remove("hidden");

  let content = "";

  if (module === "conduccion") {
    content = `
      <h2>🚍 Conducción eficiente</h2>
      <p>Una conducción eficiente reduce el consumo de energía y el desgaste del bus.</p>
      <ul>
        <li>Aceleraciones suaves y progresivas</li>
        <li>Anticipar el tránsito y las detenciones</li>
        <li>Evitar aceleraciones innecesarias</li>
        <li>Mantener velocidad constante</li>
      </ul>
    `;
  }

  if (module === "regeneracion") {
    content = `
      <h2>🔋 Frenado regenerativo</h2>
      <p>El bus recarga energía al utilizar correctamente el pedal de freno.</p>
      <ul>
        <li>Presionar suavemente el pedal al inicio</li>
        <li>No es necesario llegar al frenado completo</li>
        <li>La regeneración se produce en la primera fase del pedal</li>
        <li>Anticipar detenciones maximiza la recuperación de energía</li>
      </ul>
      <p><strong>Nota:</strong> Un uso brusco del freno reduce la eficiencia del sistema.</p>
    `;
  }

  if (module === "clima") {
    content = `
      <h2>❄️ Uso del aire acondicionado</h2>
      <p>El sistema de climatización impacta directamente en la autonomía.</p>
      <ul>
        <li>Usar temperaturas moderadas</li>
        <li>Evitar cambios constantes de configuración</li>
        <li>Apagar el A/C cuando no sea necesario</li>
      </ul>
    `;
  }

  if (module === "cabina") {
    content = `
      <h2>💡 Cabina y controles</h2>
      <ul>
        <li>Ajustar correctamente el asiento</li>
        <li>Usar suspensión según condiciones del camino</li>
        <li>Encender luces solo cuando corresponde</li>
        <li>Evitar uso innecesario de sistemas auxiliares</li>
      </ul>
    `;
  }

  moduleContent.innerHTML = content;
}

function goBack() {
  moduleSection.classList.add("hidden");
  menu.classList.remove("hidden");
}
