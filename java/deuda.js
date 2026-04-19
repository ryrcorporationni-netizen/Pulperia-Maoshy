const API_URL = "https://servidor-pulperia-maoshy.onrender.com";
const urlParams = new URLSearchParams(window.location.search);
const cliente = urlParams.get("user");

if (cliente) {
  document.getElementById("cliente-nombre").innerText = cliente;
  document.getElementById("avatar-letra").innerText = cliente
    .charAt(0)
    .toUpperCase();
}

async function cargarEstadoCuenta() {
  if (!cliente) return;
  try {
    const resEstado = await fetch(`${API_URL}/api/estado-cuenta/${cliente}`);
    const infoGeneral = await resEstado.json();
    document.getElementById("monto-total").innerText =
      `C$ ${infoGeneral.deuda.toFixed(2)}`;

    const resLista = await fetch(
      `${API_URL}/api/creditos-pendientes/${cliente}`,
    );
    const creditos = await resLista.json();

    document.getElementById("count-items").innerText =
      `${creditos.length} Pendientes`;
    const tablaBody = document.getElementById("tabla-deuda-body");
    tablaBody.innerHTML = "";

    creditos.forEach((doc) => {
      const fila = document.createElement("tr");
      const monto = doc.total_item || 0;
      const fecha =
        doc.fecha && doc.fecha._seconds
          ? new Date(doc.fecha._seconds * 1000).toLocaleDateString()
          : "Hoy";

      fila.innerHTML = `
                        <td data-label="Fecha">${fecha}</td>
                        <td data-label="Producto"><strong>${doc.producto}</strong></td>
                        <td data-label="Monto" class="text-bold">C$ ${monto.toFixed(2)}</td>
                        <td class="text-center actions-cell">
                            <button class="btn-action pay" onclick="cancelarItem('${doc.id}', ${monto})">Liquidar</button>
                            <button class="btn-action abono" onclick="abonarItem('${doc.id}', ${monto})">Abonar</button>
                        </td>
                    `;
      tablaBody.appendChild(fila);
    });
  } catch (e) {
    console.error(e);
  }
}

async function cancelarItem(id, m) {
  if (!confirm(`¿Liquidar C$ ${m}?`)) return;
  const res = await fetch(`${API_URL}/api/pagar-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: cliente,
      creditoId: id,
      montoPagado: m,
      esAbono: false,
    }),
  });
  if (res.ok) cargarEstadoCuenta();
}

async function abonarItem(id, s) {
  const val = parseFloat(prompt(`Saldo actual: C$ ${s}. ¿Monto del abono?`));
  if (isNaN(val) || val <= 0 || val > s) return alert("Monto inválido");
  const res = await fetch(`${API_URL}/api/pagar-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: cliente,
      creditoId: id,
      montoPagado: val,
      esAbono: true,
    }),
  });
  if (res.ok) cargarEstadoCuenta();
}

cargarEstadoCuenta();
