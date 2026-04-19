const USERNAME = localStorage.getItem("username");

function actualizarCielo() {
  const sky = document.getElementById("sky-background");
  const astro = document.querySelector(".astro");
  const ahora = new Date();
  const hora = ahora.getHours();
  const minutos = ahora.getMinutes();

  // 1. GESTIÓN DE FASES
  sky.classList.remove("dia", "mediodia", "tarde", "noche");
  document.body.classList.remove("dia", "mediodia", "tarde", "noche");

  let fase = "";

  // 0 a 5: Madrugada (Noche)
  if (hora >= 0 && hora < 6) {
    fase = "noche";
  }
  // 6 a 10: Mañana (Día)
  else if (hora >= 6 && hora < 11) {
    fase = "dia";
  }
  // 11 a 15: Mediodía (Sol fuerte) - Aquí entra el 12 PM (Mediodía)
  else if (hora >= 11 && hora < 16) {
    fase = "mediodia";
  }
  // 16 a 18: Tarde (Atardecer)
  else if (hora >= 16 && hora < 19) {
    fase = "tarde";
  }
  // 19 a 23: Noche
  else {
    fase = "noche";
  }

  sky.classList.add(fase);
  document.body.classList.add(fase);

  // 2. CÁLCULO DE POSICIÓN HORIZONTAL (0% a 100%)
  const totalMinutosDia = 24 * 60;
  const minutosActuales = hora * 60 + minutos;
  const porcentajeProgreso = (minutosActuales / totalMinutosDia) * 100;

  const margenIzquierdo = 10;
  const rangoMovimiento = 80;
  const posicionHorizontal =
    margenIzquierdo + porcentajeProgreso * (rangoMovimiento / 100);

  astro.style.left = `${posicionHorizontal}vw`;

  // 3. AJUSTE DE ALTURA INTELIGENTE (Detección de Pantalla)
  const esMovil = window.innerWidth <= 600;

  // Usamos unidades 'vh' (porcentaje de la altura de la ventana)
  // En escritorio (50px arriba es poco), en móvil (220px es mucho)
  // 'baseAltura' define el centro de la franja donde se moverá el sol
  let baseAltura;
  let amplitudArco;

  if (esMovil) {
    // En móvil, lo bajamos para que libre el menú,
    // pero usamos vh para que sea relativo al largo del cel
    baseAltura = 40; // 35% de la altura de la pantalla
    amplitudArco = 10; // Sube y baja un 10%
  } else {
    // En escritorio, puede estar más arriba
    baseAltura = 20; // 20% de la altura de la pantalla
    amplitudArco = 12;
  }

  // Cálculo de la parábola (arco)
  const radianes = (porcentajeProgreso / 100) * Math.PI;
  const desplazamientoArco = Math.sin(radianes) * amplitudArco;

  // Calculamos la posición final en 'vh'
  const posicionVertical = baseAltura - desplazamientoArco;

  astro.style.top = `${posicionVertical}vh`;
  astro.style.bottom = "auto"; // Limpiamos cualquier ajuste anterior
}

// Escuchar si el usuario voltea el teléfono o cambia el tamaño de la ventana
window.addEventListener("resize", actualizarCielo);
// Ejecutar cada minuto para que el sol se mueva en "tiempo real"
setInterval(actualizarCielo, 60000);


// Agrega esto dentro de tu función cargarInicio() o al cargar la página
function mostrarNombreUsuario() {
    const nombreParaMostrar = localStorage.getItem("username");
    const el = document.getElementById("user-display");
    
    if (nombreParaMostrar && el) {
        // Capitalizamos la primera letra para que se vea mejor
        el.innerText = nombreParaMostrar.charAt(0).toUpperCase() + nombreParaMostrar.slice(1);
    }
}

// Actualiza tu DOMContentLoaded para incluir la función
document.addEventListener("DOMContentLoaded", () => {
    actualizarCielo();
    mostrarNombreUsuario(); // <--- Nueva función
    cargarInicio();
});

// =======================
// NAVEGACIÓN LIMPIA
// =======================
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabId = btn.dataset.tab;

    // Botones
    document
      .querySelectorAll(".nav-item")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Secciones
    document
      .querySelectorAll(".tab")
      .forEach((tab) => tab.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");

    // Carga por sección
    if (tabId === "inicio") cargarInicio();
    if (tabId === "catalogo") cargarCatalogo();
    if (tabId === "historial") cargarHistorial();
  });
});

// =======================
// INICIO AUTOMÁTICO
// =======================
document.addEventListener("DOMContentLoaded", () => {
  cargarInicio();
});

// =======================
// FUNCIONES
// =======================
let url = "https://servidor-pulperia-maoshy.onrender.com";

async function cargarInicio() {
  const res = await fetch(`${url}/api/cliente/perfil-detallado/${USERNAME}`);
  const data = await res.json();

  document.getElementById("deuda-total").innerText =
    `C$ ${data.deuda_total.toFixed(2)}`;

  document.getElementById("estado-cuenta").innerText = data.estado_cuenta;

  const lista = document.getElementById("lista-hoy");
  lista.innerHTML = data.resumen.pendientes
    .slice(0, 5)
    .map((i) => `<div>${i.producto} - C$ ${i.total_item}</div>`)
    .join("");
}

async function cargarCatalogo() {
  const res = await fetch("${url}/api/productos");
  const productos = await res.json();

  const grid = document.getElementById("grid-productos");

  grid.innerHTML = productos
    .map(
      (p) => `
    <div class="producto">
      <p>${p.nombre}</p>
      <strong>C$ ${p.precio_venta}</strong>
    </div>
  `,
    )
    .join("");
}

async function cargarHistorial() {
  const res = await fetch(`${url}/api/cliente/perfil-detallado/${USERNAME}`);
  const data = await res.json();

  // Renderizar Pendientes (Sin botón borrar)
  document.getElementById("lista-pendientes").innerHTML =
    data.resumen.pendientes
      .map(
        (p) => `
    <div class="item-historial">
      <div class="info">
        <strong>${p.producto}</strong>
        <span>${p.fecha_formateada}</span>
      </div>
      <div class="detalles">
        <span>Cant: ${p.cantidad || 1}</span>
        <strong>C$ ${p.total_item.toFixed(2)}</strong>
      </div>
    </div>
  `,
      )
      .join("");

  // Renderizar Pagados (Con botón borrar)
  document.getElementById("lista-pagados").innerHTML = data.resumen.pagados
    .map(
      (p) => `
    <div class="item-historial">
      <div class="info">
        <strong>${p.producto}</strong>
        <span>${p.fecha_formateada}</span>
      </div>
      <div class="detalles">
        <span>Cant: ${p.cantidad || 1}</span>
        <strong>C$ ${p.total_item.toFixed(2)}</strong>
        <button class="btn-borrar" onclick="borrarRegistro('${p.id}')">Borrar</button>
      </div>
    </div>
  `,
    )
    .join("");
}

async function borrarRegistro(docId) {
  if (
    !confirm(
      "¿Estás seguro de que quieres quitar este registro de tu historial?",
    )
  )
    return;

  try {
    const res = await fetch(
      `${url}/api/cliente/borrar-registro/${USERNAME}/${docId}`,
      {
        method: "DELETE",
      },
    );

    if (res.ok) {
      cargarHistorial(); // Recargar la lista
    } else {
      alert("Error al borrar el registro");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function cargarCatalogo() {
  const grid = document.getElementById("grid-productos");
  grid.innerHTML = "<p>Cargando productos...</p>";

  try {
    const res = await fetch(`${url}/api/productos`);
    const productos = await res.json();

    if (!productos || productos.length === 0) {
      grid.innerHTML = "<p>No hay productos disponibles por ahora.</p>";
      return;
    }

    grid.innerHTML = productos
      .map((p) => {
        const urlImagen = `https://lh3.googleusercontent.com/d/${p.imagen}`;

        // Lógica para el botón si no hay stock
        const sinStock = p.stock <= 0;
        const textoBoton = sinStock ? "Agotado" : "Comprar";
        const estiloBoton = sinStock
          ? "background: #ccc; cursor: not-allowed;"
          : "background: #2563eb; color: white;";

        return `
        <div class="producto card">
          <div class="img-container">
            <img src="${urlImagen}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/150?text=Sin+Imagen'">
          </div>
          <div class="producto-info">
            <p class="p-nombre" style="font-weight: bold; margin-bottom: 5px;">${p.nombre}</p>
            
            <span style="font-size: 0.8rem; color: ${sinStock ? "#ef4444" : "#64748b"};">
               Disponibles: ${p.stock}
            </span>

            <strong class="p-precio" style="color: #2563eb; display: block; margin: 8px 0; font-size: 1.2rem;">
               C$ ${p.precio}
            </strong>

            <!-- <button class="btn-comprar" 
                    ${sinStock ? "disabled" : ""}
                    onclick="comprarProducto('${p.id}', '${p.nombre}')"
                    style="border: none; padding: 10px; border-radius: 8px; width: 100%; font-weight: 600; transition: 0.3s; ${estiloBoton}">
              ${textoBoton}
            </button> -->
          </div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Error al cargar catálogo:", error);
    grid.innerHTML = "<p>Error al conectar con el servidor.</p>";
  }
}

function comprarProducto(productoId) {
  // Aquí puedes añadir la lógica para comprar el producto
  alert(`Has comprado el producto con ID: ${productoId}`);
}

function toggleAcordeon(header) {
  // Obtenemos el contenedor padre (el item del acordeón)
  const item = header.parentElement;

  // Alternamos la clase 'open'
  item.classList.toggle("open");
}

// =======================
// LOGOUT
// =======================
function logout() {
  localStorage.removeItem("username");
  location.href = "../login.html";
}
