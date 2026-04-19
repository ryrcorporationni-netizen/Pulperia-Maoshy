const authForm = document.getElementById("auth-form");
const selectionArea = document.getElementById("selection-area");
const switchArea = document.querySelector(".switch-area");
const messageBox = document.getElementById("message");

// Control de vistas principales
function toggleView(view) {
  if (view === "SELECTION") {
    authForm.classList.add("hidden");
    switchArea.classList.add("hidden");
    selectionArea.classList.remove("hidden");
    document.getElementById("form-title").innerText = "Crear Cuenta";
  } else {
    authForm.classList.remove("hidden");
    switchArea.classList.remove("hidden");
    selectionArea.classList.add("hidden");
    document.getElementById("form-title").innerText = "Pulpería Maoshy";
  }
}

// Control de Modales
function closeModals() {
  document.getElementById("modal-cliente").style.display = "none";
  document.getElementById("modal-admin").style.display = "none";
}

document.getElementById("card-cliente").onclick = () => {
  document.getElementById("modal-cliente").style.display = "block";
};

document.getElementById("card-admin").onclick = () => {
  document.getElementById("modal-admin").style.display = "block";
};

// Cerrar al hacer clic fuera
window.onclick = (e) => {
  if (e.target.className === "modal") closeModals();
};

// Función de Envío General
async function apiRequest(url, data) {
  messageBox.style.display = "none";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) {
      showMsg("Bienvenido, " + (result.nombre || result.username), false);
      localStorage.setItem("username", result.username);
      localStorage.setItem("rol", result.rol);
      setTimeout(() => {
        window.location.href =
          result.rol === "admin"
            ? "html/admin_dashboard.html"
            : "html/cliente_dashboard.html";
      }, 1500);
    } else {
      showMsg(result.error || "Error en el proceso", true);
    }
  } catch (err) {
    showMsg("Sin conexión con el servidor.", true);
  }
}

// Listeners de Formularios
authForm.onsubmit = (e) => {
  e.preventDefault();
  apiRequest("https://servidor-pulperia-maoshy.onrender.com/login", {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
  });
};

document.getElementById("form-reg-cliente").onsubmit = (e) => {
  e.preventDefault();
  apiRequest("https://servidor-pulperia-maoshy.onrender.com/registro-cliente", {
    username: document.getElementById("cli-user").value,
    password: document.getElementById("cli-pass").value,
  });
};

document.getElementById("form-reg-admin").onsubmit = (e) => {
  e.preventDefault();
  apiRequest("https://servidor-pulperia-maoshy.onrender.com/registro-admin", {
    username: document.getElementById("adm-user").value,
    nombre: document.getElementById("adm-name").value,
    correo: document.getElementById("adm-email").value,
    password: document.getElementById("adm-pass").value,
    masterKey: document.getElementById("adm-master").value,
  });
};

function showMsg(text, isError) {
  messageBox.innerText = text;
  messageBox.className = isError ? "message error" : "message success";
  messageBox.style.display = "block";
}
