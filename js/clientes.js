
"use strict";

// ==========================================
// GYMDATA - CLIENTES
// CONEXION NODE.JS + EXPRESS + MYSQL
// ==========================================

let clientes = [];

const API_CLIENTES = "/api/clientes";

// ==========================================
// PETICIONES AL SERVIDOR
// ==========================================

async function solicitarAPIClientes(url, opciones = {}) {
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...(opciones.headers || {})
        }
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok || resultado.success === false) {
        throw new Error(
            resultado.mensaje || "Error al consultar el servidor."
        );
    }

    return resultado;
}

// ==========================================
// CARGAR CLIENTES DESDE MYSQL
// ==========================================

async function cargarClientesDesdeAPI() {
    try {
        const resultado = await solicitarAPIClientes(
            API_CLIENTES
        );

        clientes = resultado.data;

        mostrarClientes();
        actualizarSelectoresClientes();

    } catch (error) {
        console.error(error);
        alert("No fue posible cargar los clientes desde MySQL.");
    }
}

// ==========================================
// ACTUALIZAR OTROS MODULOS
// ==========================================

function actualizarSelectoresClientes() {
    if (typeof cargarClientesMembresia === "function") {
        cargarClientesMembresia();
    }

    if (typeof cargarClientesRutina === "function") {
        cargarClientesRutina();
    }

    if (typeof cargarClientesSeguimiento === "function") {
        cargarClientesSeguimiento();
    }
}

// ==========================================
// REGISTRAR CLIENTE
// ==========================================

async function registrarCliente(nombre, documento, telefono) {
    nombre = nombre.trim();
    documento = documento.trim();
    telefono = telefono.trim();

    if (!nombre || !documento || !telefono) {
        alert("Completa todos los campos.");
        return false;
    }

    try {
        const resultado = await solicitarAPIClientes(
            API_CLIENTES,
            {
                method: "POST",
                body: JSON.stringify({
                    nombre,
                    documento,
                    telefono
                })
            }
        );

        await cargarClientesDesdeAPI();

        alert(
            resultado.mensaje ||
            "Cliente registrado correctamente."
        );

        return true;

    } catch (error) {
        alert(error.message);
        return false;
    }
}

// ==========================================
// MOSTRAR CLIENTES
// ==========================================

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
        const mensaje = document.createElement("p");
        mensaje.className = "mensaje-vacio";
        mensaje.textContent =
            "No hay clientes registrados en MySQL.";

        contenedor.appendChild(mensaje);
        return;
    }

    clientes.forEach(cliente => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-cliente";

        const nombre = document.createElement("h3");
        nombre.textContent = cliente.nombre;

        const documento = document.createElement("p");
        documento.textContent =
            "Documento: " + cliente.documento;

        const telefono = document.createElement("p");
        telefono.textContent =
            "Teléfono: " + cliente.telefono;

        const fecha = document.createElement("p");

        fecha.textContent = cliente.fechaRegistro
            ? "Registro: " + new Date(
                cliente.fechaRegistro
            ).toLocaleDateString("es-CO", {
                timeZone: "UTC"
            })
            : "Sin fecha";

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "boton-eliminar";
        eliminar.textContent = "Eliminar cliente";

        eliminar.addEventListener("click", async () => {
            await eliminarCliente(cliente.id);
        });

        tarjeta.append(
            nombre,
            documento,
            telefono,
            fecha,
            eliminar
        );

        contenedor.appendChild(tarjeta);
    });
}

// ==========================================
// ELIMINAR CLIENTE
// ==========================================

async function eliminarCliente(id) {
    const tieneMembresia = (
        typeof membresias !== "undefined" &&
        membresias.some(
            item => String(item.clienteId) === String(id)
        )
    );

    const tieneRutina = (
        typeof rutinas !== "undefined" &&
        rutinas.some(
            item => String(item.clienteId) === String(id)
        )
    );

    if (tieneMembresia || tieneRutina) {
        alert(
            "Este cliente tiene membresías o rutinas " +
            "asociadas. No se puede eliminar."
        );
        return false;
    }

    if (!confirm("¿Deseas eliminar este cliente?")) {
        return false;
    }

    try {
        await solicitarAPIClientes(
            `${API_CLIENTES}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await cargarClientesDesdeAPI();

        alert("Cliente eliminado correctamente.");
        return true;

    } catch (error) {
        alert(error.message);
        return false;
    }
}

// ==========================================
// INICIALIZAR
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById(
        "formularioCliente"
    );

    cargarClientesDesdeAPI();

    if (!formulario) return;

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        const boton = formulario.querySelector(
            'button[type="submit"]'
        );

        if (boton) boton.disabled = true;

        try {
            const nombre = document.getElementById(
                "nombreCliente"
            ).value;

            const documento = document.getElementById(
                "documentoCliente"
            ).value;

            const telefono = document.getElementById(
                "telefonoCliente"
            ).value;

            const registrado = await registrarCliente(
                nombre,
                documento,
                telefono
            );

            if (registrado) formulario.reset();

        } finally {
            if (boton) boton.disabled = false;
        }
    });
});
