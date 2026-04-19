// --- 1. CONFIGURACIÓN INICIAL (DEBE IR PRIMERO) ---
const API_URL = "https://servidor-pulperia-maoshy.onrender.com";

const urlParams = new URLSearchParams(window.location.search);
const cliente = urlParams.get("user") || "Usuario";
document.getElementById("user-display").innerText = cliente;
document.getElementById("fecha-actual").innerText =
  new Date().toLocaleDateString();

// --- 2. FUNCIONES DE APOYO ---
function abrirModal(id) {
  document.getElementById(id).style.display = "block";
}
function cerrarModal(id) {
  document.getElementById(id).style.display = "none";

  // Detener escáner si está activo
  if (isScanningInv) {
    detenerEscanerInv();
  }
}
const scannerInv = new Html5Qrcode("reader-inv");
let isScanningInv = false;

document.getElementById("p-barcode").addEventListener("input", (e) => {
  if (e.target.value.length >= 5) {
    obtenerDatosProducto(e.target.value);
  }
});

document.getElementById("scan-inv-btn").addEventListener("click", () => {
  const readerDiv = document.getElementById("reader-inv");

  if (!isScanningInv) {
    readerDiv.style.display = "block";

    scannerInv
      .start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: { width: 250, height: 150 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
        },
        (decodedText) => {
          // 1. Poner el código en el input correcto
          document.getElementById("p-barcode").value = decodedText;

          // 2. Ejecutar búsqueda automática
          obtenerDatosProducto(decodedText);

          // 3. Detener cámara
          detenerEscanerInv();
        },
      )
      .catch((err) => {
        console.error("Error al iniciar cámara:", err);
        alert("No se pudo acceder a la cámara. Verifica los permisos.");
      });

    isScanningInv = true;
    document.getElementById("scan-inv-btn").innerText = "🛑 Detener Cámara";
  } else {
    detenerEscanerInv();
  }
});

function detenerEscanerInv() {
  if (isScanningInv) {
    scannerInv
      .stop()
      .then(() => {
        document.getElementById("reader-inv").style.display = "none";
        isScanningInv = false;
        document.getElementById("scan-inv-btn").innerText =
          "📸 Escanear Producto";
      })
      .catch((err) => console.log("Error al detener:", err));
  }
}

// --- 4. BÚSQUEDA DE PRODUCTO ---
async function obtenerDatosProducto(codigo) {
    if (!codigo) return;
    try {
        const response = await fetch(`${API_URL}/api/productos/${codigo}`);
        if (!response.ok) throw new Error("No registrado");
        const data = await response.json();

        // Rellenamos el formulario del modal
        document.getElementById("p-nombre").value = data.nombre;
        document.getElementById("p-precio").value = data.precio;
    } catch (e) {
        console.error(e);
        alert("⚠️ El código [" + codigo + "] no existe en el inventario.");
    }
}

// --- 4. ENVÍO DE DATOS (GUARDADO) ---
document
  .getElementById("form-compra-inv")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      username: cliente,
      productoId: document.getElementById("p-barcode").value,
      cantidad: parseFloat(document.getElementById("p-cantidad").value),
      esServicioManual: false,
    };

    try {
      const res = await fetch(`${API_URL}/procesar-credito`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Producto registrado en la cuenta");
        cerrarModal("modal-compra");
        e.target.reset();
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (error) {
      console.error("Error al conectar:", error);
      alert("No se pudo conectar con el servidor");
    }
  });

// --- 5. SERVICIOS EXTERNOS (MANUAL) CORREGIDO ---
// --- 5. SERVICIOS EXTERNOS (MANUAL) - CORRECCIÓN DE ERROR 500 ---
document.getElementById("form-servicios-ext").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");
    
    const datos = {
        username: cliente,
        esServicioManual: true,
        // MANDAMOS UN ID FICTICIO PARA QUE EL SERVIDOR NO FALLE AL CREAR LA REFERENCIA
        productoId: "SERVICIO_MANUAL", 
        nombreManual: inputs[0].value,
        cantidad: parseFloat(inputs[1].value),
        precioManual: parseFloat(inputs[2].value),
    };

    try {
        const res = await fetch(`${API_URL}/procesar-credito`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ Servicio guardado correctamente");
            cerrarModal("modal-servicios");
            e.target.reset();
        } else {
            alert("❌ Error: " + data.error);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con Render");
    }
});

window.onclick = (event) => {
  if (event.target.className === "cr-modal") {
    event.target.style.display = "none";

    if (isScanningInv) {
      detenerEscanerInv();
    }
  }
};
