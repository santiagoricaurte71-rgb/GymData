
"use strict";

// GYMDATA - GESTION DE CLIENTES

let clientes = [];

try {
    const datos = JSON.parse(
        localStorage.getItem("gymdata_clientes")
    );

    clientes = Array.isArray(datos) ? datos : [];
} catch (error) {
    console.error("Error al cargar clientes:", error);
}

// GUARDAR CLIENTES

function guardarClientes() {
    try {
        localStorage.setItem(
            "gymdata_clientes",
            JSON.stringify(clientes)
        );
        return true;
    } catch (error) {
        console.error(error);
        alert("No fue posible guardar los clientes.");
        return false;
    }
}

// FECHA ACTUAL

function fechaRegistroActual() {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}/${hoy.getFullYear()}`;
}

// REGISTRAR CLIENTE

function registrarCliente(nombre, documento, telefono) {
    nombre = nombre.trim();
    documento = documento.trim();
    telefono = telefono.trim();

    if (!nombre || !documento || !telefono) {
        alert("Completa todos los campos.");
        return false;
    }

    if (clientes.some(c => c.documento === documento)) {
        alert("Ya existe un cliente con ese documento.");
        return false;
    }

    const nuevo = {
        id: generarIdCliente(),
        nombre,
        documento,
        telefono,
        fechaRegistro: fechaRegistroActual()
    };

    clientes.push(nuevo);

    if (!guardarClientes()) {
        clientes.pop();
        return false;
    }

    mostrarClientes();
    actualizarSelectoresClientes();

    alert("Cliente registrado correctamente.");
    return true;
}

function generarIdCliente() {
    return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString() +
          Math.random().toString(16).slice(2);
}

// ACTUALIZAR SELECTORES

function actualizarSelectoresClientes() {
    if (typeof cargarClientesMembresia === "function") {
        cargarClientesMembresia();
    }

    if (typeof cargarClientesRutina === "function") {
        cargarClientesRutina();
    }
}

// MOSTRAR CLIENTES

function mostrarClientes() {
    const contenedor = document.getElementById("listaClientes");
    const total = document.getElementById("totalClientes");
    const cantidad = document.getElementById("cantidadClientes");

    if (total) total.textContent = clientes.length;

    if (cantidad) {
        cantidad.textContent = clientes.length === 1
            ? "1 cliente"
            : `${clientes.length} clientes`;
    }

    if (!contenedor) return;

    contenedor.replaceChildren();

    if (clientes.length === 0) {
        const p = document.createElement("p");
        p.className = "mensaje-vacio";
        p.textContent = "No hay clientes registrados todavía.";
        contenedor.appendChild(p);
        return;
    }

    clientes.forEach(cliente => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-cliente";

        const titulo = document.createElement("h3");
        titulo.textContent = cliente.nombre;

        const documento = document.createElement("p");
        documento.textContent = "Documento: " + cliente.documento;

        const telefono = document.createElement("p");
        telefono.textContent = "Teléfono: " + cliente.telefono;

        const fecha = document.createElement("p");
        fecha.textContent =
            "Registro: " + (cliente.fechaRegistro || "Sin fecha");

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton-eliminar";
        boton.textContent = "Eliminar cliente";

        boton.addEventListener("click", () => {
            eliminarCliente(cliente.id);
        });

        tarjeta.append(titulo, documento, telefono, fecha, boton);
        contenedor.appendChild(tarjeta);
    });
}

// ELIMINAR CLIENTE

function eliminarCliente(id) {
    const tieneMembresias =
        typeof membresias !== "undefined" &&
        membresias.some(m => String(m.clienteId) === String(id));

    const tieneRutinas =
        typeof rutinas !== "undefined" &&
        rutinas.some(r => String(r.clienteId) === String(id));

    if (tieneMembresias || tieneRutinas) {
        alert(
            "El cliente tiene membresías o rutinas asociadas. " +
            "Gestiona esos registros antes de eliminarlo."
        );
        return;
    }

    if (!confirm("¿Eliminar este cliente?")) return;

    const anteriores = [...clientes];

    clientes = clientes.filter(c => String(c.id) !== String(id));

    if (!guardarClientes()) {
        clientes = anteriores;
        return;
    }

    mostrarClientes();
    actualizarSelectoresClientes();
    alert("Cliente eliminado correctamente.");
}

// INICIALIZAR

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formularioCliente");

    mostrarClientes();

    if (!formulario) return;

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const nombre =
            document.getElementById("nombreCliente").value;
        const documento =
            document.getElementById("documentoCliente").value;
        const telefono =
            document.getElementById("telefonoCliente").value;

        if (registrarCliente(nombre, documento, telefono)) {
            formulario.reset();
        }
    });
});
