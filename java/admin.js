// Seguridad básica: Si no hay rol admin, devolver al login
if (localStorage.getItem("rol") !== "admin") {
  window.location.href = "login.html";
}

let url = "https://servidor-pulperia-maoshy.onrender.com";

// Variables Globales para Venta
let carrito = [];
const scannerVenta = new Html5Qrcode("reader-venta");
let isScanningVenta = false;

// Control del botón de escaneo en Venta
// Control del botón de escaneo en Venta
document.getElementById("scan-venta-btn").addEventListener("click", () => {
  const readerDiv = document.getElementById("reader-venta");

  if (!isScanningVenta) {
    readerDiv.style.display = "block";

    // Configuración de formatos específicos para productos (barcodes)
    const config = {
      fps: 20, // Aumentamos los frames por segundo para capturas más rápidas
      qrbox: { width: 300, height: 150 }, // Caja alargada ideal para códigos de barras
      aspectRatio: 1.0,
      // PRIORIDAD: Formatos de productos comerciales
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
    };

    scannerVenta
      .start(
        { facingMode: "environment" }, // Usa la cámara trasera
        config,
        (decodedText) => {
          // Feedback visual rápido: Borde verde al reconocer
          readerDiv.style.border = "5px solid #28a745";

          agregarAlCarritoPorCodigo(decodedText);
          console.log("Detectado:", decodedText);

          // Resetear color de borde después de 500ms
          setTimeout(() => {
            readerDiv.style.border = "none";
          }, 500);
        },
      )
      .catch((err) => {
        console.error("Error cámara venta:", err);
        alert("Asegúrate de dar permisos de cámara y usar HTTPS o localhost.");
      });

    isScanningVenta = true;
    document.getElementById("scan-venta-btn").innerText = "🛑 Detener Cámara";
  } else {
    detenerEscanerVenta();
  }
});

function detenerEscanerVenta() {
  scannerVenta.stop();
  document.getElementById("reader-venta").style.display = "none";
  isScanningVenta = false;
  document.getElementById("scan-venta-btn").innerText = "📸 Escanear Producto";
}

async function agregarAlCarritoPorCodigo(codigo) {
  try {
    const res = await fetch(`${url}/api/productos/${codigo}`);
    if (!res.ok) throw new Error("Producto no encontrado");

    const producto = await res.json();

    // Verificar si ya está en el carrito para solo sumar cantidad
    const existe = carrito.find((item) => item.codigo === codigo);
    if (existe) {
      if (existe.cantidad < producto.stock) {
        existe.cantidad++;
      } else {
        alert("Sin stock suficiente en inventario");
      }
    } else {
      if (producto.stock > 0) {
        carrito.push({
          codigo: producto.codigo,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
        });
      } else {
        alert("Producto agotado");
      }
    }

    actualizarTablaVenta();
  } catch (err) {
    console.error(err);
    // Podrías poner un sonido de error aquí
  }
}

function actualizarTablaVenta() {
  const tbody = document.querySelector("#tabla-venta tbody");
  const totalLabel = document.getElementById("venta-total-monto");
  tbody.innerHTML = "";
  let totalGeneral = 0;

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    totalGeneral += subtotal;

    const fila = document.createElement("tr");
    fila.innerHTML = `
            <td>${item.nombre}</td>
            <td>C$ ${item.precio.toFixed(2)}</td>
            <td>
                <button onclick="cambiarCantidad(${index}, -1)">-</button>
                ${item.cantidad}
                <button onclick="cambiarCantidad(${index}, 1)">+</button>
            </td>
            <td>C$ ${subtotal.toFixed(2)}</td>
        `;
    tbody.appendChild(fila);
  });

  totalLabel.innerText = totalGeneral.toFixed(2);
}

function cambiarCantidad(index, valor) {
  carrito[index].cantidad += valor;
  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }
  actualizarTablaVenta();
}

async function confirmarVenta() {
  if (carrito.length === 0) return alert("El carrito está vacío");

  if (!confirm("¿Finalizar venta en efectivo?")) return;

  try {
    const res = await fetch(`${url}/api/finalizar-venta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: carrito }),
    });

    if (res.ok) {
      alert("✅ Venta completada. Stock actualizado.");
      carrito = [];
      actualizarTablaVenta();
      detenerEscanerVenta();
    }
  } catch (err) {
    alert("Error al procesar la venta");
  }
}

// Función para guardar el producto (Asegúrate de que el ID del formulario sea product-form)
document
  .getElementById("product-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Capturamos los valores de los inputs
    const codigo = document.getElementById("p-codigo").value;
    const nombre = document.getElementById("p-nombre").value;
    const imagen = document.getElementById("p-imagen").value;
    const precio = parseFloat(document.getElementById("p-precio").value);

    // 2. Lógica de Stock: Sumamos el actual con el nuevo entrante
    const stockActual = parseInt(document.getElementById("p-stock").value) || 0;
    const stockNuevoEntrante =
      parseInt(document.getElementById("p-stock-nuevo").value) || 0;
    const stockTotal = stockActual + stockNuevoEntrante;

    // 3. Armamos el objeto final para el servidor
    const producto = {
      codigo: codigo,
      nombre: nombre,
      imagen: imagen,
      precio: precio,
      stock: stockTotal, // Enviamos el total ya sumado
    };

    try {
      const res = await fetch(`${url}/registrar-producto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ ${data.mensaje}. Stock total ahora: ${stockTotal}`);

        // Limpiar formulario
        document.getElementById("product-form").reset();

        // Ocultar el cuadro de stock nuevo para el próximo registro
        document.getElementById("contenedor-stock-nuevo").style.display =
          "none";

        // Actualizar la tabla de inventario si la función existe
        if (typeof cargarInventario === "function") {
          cargarInventario();
        }
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      alert(
        "❌ No se pudo conectar con el servidor. Revisa tu conexión en Render.",
      );
    }
  });

async function cargarInventario() {
  const tablaBody = document.querySelector("#inventory-table tbody");
  if (!tablaBody) return;

  try {
    const res = await fetch(`${url}/productos`);
    const productos = await res.json();

    tablaBody.innerHTML = ""; // Limpiar tabla

    productos.forEach((p) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
                <td>${p.codigo}</td>
                <td>${p.nombre}</td>
                <td>C$ ${p.precio.toFixed(2)}</td>
                <td class="${p.stock <= 5 ? "stock-bajo" : ""}">${p.stock}</td>
            `;
      // Al hacer clic en la fila, puedes cargar los datos arriba para editar
      fila.onclick = () => cargarDatosEnFormulario(p);
      tablaBody.appendChild(fila);
    });
  } catch (err) {
    console.error("Error al cargar inventario:", err);
  }
}

// Función para cargar clientes en la sección de Fiados
async function cargarListaClientes() {
  const listaDiv = document.getElementById("lista-deudores");
  listaDiv.innerHTML = "<p>Cargando clientes...</p>";

  try {
    const res = await fetch(`${url}/clientes`);
    const clientes = await res.json();

    listaDiv.innerHTML = ""; // Limpiar mensaje de carga

    if (clientes.length === 0) {
      listaDiv.innerHTML = "<p>No hay clientes registrados.</p>";
      return;
    }

    clientes.forEach((cliente) => {
      const card = document.createElement("div");
      card.className = "cliente-deuda-card";
      card.innerHTML = `
            <div class="cliente-info">
                <strong>${cliente.username}</strong>
            </div>
            <button class="btn-ver-deuda" onclick="verDeuda('${cliente.username}')">
                🔍 Ver Deuda
            </button>
            <button class="btn-fiado-compra" onclick="agregarCompra('${cliente.username}')">
                � Agregar Compra
            </button>
        `;
      listaDiv.appendChild(card);
    });
  } catch (err) {
    listaDiv.innerHTML = "<p>Error al conectar con el servidor.</p>";
  }
}

function verDeuda(username) {
  // Redirige pasando el nombre del cliente en la URL
  window.location.href = `deuda.html?user=${encodeURIComponent(username)}`;
}

function agregarCompra(username) {
  // Redirige pasando el nombre del cliente en la URL
  window.location.href = `credito.html?user=${encodeURIComponent(username)}`;
}

const inputBusqueda = document.getElementById("busqueda-cliente");

inputBusqueda.addEventListener("input", function () {
  const texto = this.value.toLowerCase().trim();

  const clientes = document.querySelectorAll(".cliente-deuda-card");

  clientes.forEach((cliente) => {
    const nombre = cliente.querySelector("strong").innerText.toLowerCase();

    if (nombre.includes(texto)) {
      cliente.style.display = "block";
    } else {
      cliente.style.display = "none";
    }
  });
});

// Modificamos tu función openTab para que cargue los clientes al entrar a 'seccion-fiado'
function openTab(tabId) {
  const contents = document.querySelectorAll(".tab-content");
  contents.forEach((content) => content.classList.remove("active"));

  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => btn.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  event.currentTarget.classList.add("active");

  if (tabId === "seccion-inventario") {
    cargarInventario();
  }

  // SI LA PESTAÑA ES FIADO, CARGAMOS LOS CLIENTES
  if (tabId === "seccion-fiado") {
    cargarListaClientes();
  }
}
// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "../login.html";
});

// Variable para controlar el tiempo de espera (Debounce)
let timeoutBusqueda = null;

document.addEventListener("DOMContentLoaded", () => {
    const inputCodigo = document.getElementById("p-codigo");

    // Evento 'input': Se dispara al escribir, borrar o PEGAR
    inputCodigo.addEventListener("input", () => {
        const codigo = inputCodigo.value.trim();

        // Limpiamos el contador cada vez que el usuario presiona una tecla
        clearTimeout(timeoutBusqueda);

        // Si el código es muy corto (ej. menos de 3 caracteres), no buscamos aún
        if (codigo.length < 3) return; 

        // Esperamos 500ms después de la última tecla para buscar
        timeoutBusqueda = setTimeout(() => {
            console.log("Buscando automáticamente:", codigo);
            buscarProductoEnInventario(codigo);
        }, 500); 
    });
});
const scannerInv = new Html5Qrcode("reader-inv");
let isScanningInv = false;

document.getElementById("scan-inv-btn").addEventListener("click", () => {
  const readerDiv = document.getElementById("reader-inv");

  if (!isScanningInv) {
    readerDiv.style.display = "block";

    scannerInv
      .start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: { width: 280, height: 150 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
        },
        (decodedText) => {
          // 1. Poner el código en la caja de texto
          document.getElementById("p-codigo").value = decodedText;

          // 2. Realizar la búsqueda inmediatamente
          buscarProductoEnInventario(decodedText);

          // 3. Apagar la cámara de una vez
          detenerEscanerInv();
        },
      )
      .catch((err) => console.error("Error cámara:", err));

    isScanningInv = true;
    document.getElementById("scan-inv-btn").innerText = "🛑 Detener";
  } else {
    detenerEscanerInv();
  }
});

function detenerEscanerInv() {
  scannerInv.stop();
  document.getElementById("reader-inv").style.display = "none";
  isScanningInv = false;
  document.getElementById("scan-inv-btn").innerText =
    "📸 Escanear para Registrar/Editar";
}

async function buscarProductoEnInventario(codigo) {

  const divStockNuevo = document.getElementById("contenedor-stock-nuevo");
  const inputStockNuevo = document.getElementById("p-stock-nuevo");

  try {
    // Hacemos el fetch a tu servidor de Render
    const res = await fetch(`${url}/api/productos/${codigo}`);

    if (res.ok) {
      const producto = await res.json();

      // Rellenamos los campos con la info encontrada
      document.getElementById("p-nombre").value = producto.nombre || "";
      document.getElementById("p-imagen").value = producto.imagen || "";
      document.getElementById("p-precio").value =
        producto.precio_venta || producto.precio || 0;
      document.getElementById("p-stock").value = producto.stock || 0;

      // MOSTRAR cuadro de suma porque el producto ya existe
      divStockNuevo.style.display = "block";
      inputStockNuevo.value = 0; // Resetear el valor de suma

      console.log("Filtro aplicado para:", producto.nombre);
    } else {
      // Si no existe, solo dejamos el código y limpiamos el resto para que vos decidás qué hacer
      document.getElementById("p-nombre").value = "";
      document.getElementById("p-imagen").value = "";
      document.getElementById("p-precio").value = "";
      document.getElementById("p-stock").value = "";
      divStockNuevo.style.display = "none";
      console.log("Código nuevo, sin datos previos.");
    }
  } catch (error) {
    console.error("Error en la búsqueda:", error);
  }
}