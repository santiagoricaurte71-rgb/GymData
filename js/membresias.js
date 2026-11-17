
"use strict";

// GYMDATA - GESTION DE MEMBRESIAS

let membresias = [];

try {
    const datos = JSON.parse(
        localStorage.getItem("gymdata_membresias")
    );

    membresias = Array.isArray(datos) ? datos : [];
} catch (error) {
    console.error("Error al cargar membresías:", error);
}

const planesMembresia = {
    Mensual: 30,
    Trimestral: 90,
    Semestral: 180
};

// GUARDAR

function guardarMembresias() {
    try {
        localStorage.setItem(
            "gymdata_membresias",
            JSON.stringify(membresias)
        );
        return true;
    } catch (error) {
        console.error(error);
        alert("No fue posible guardar la membresía.");
        return false;
    }
}

// FECHAS

function fechaLocal(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function calcularVencimiento(inicio, duracion) {
    const [anio, mes, dia] = inicio.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);

    if (
        fecha.getFullYear() !== anio ||
        fecha.getMonth() !== mes - 1 ||
        fecha.getDate() !== dia
    ) {
        return null;
    }

    fecha.setDate(fecha.getDate() + duracion);
    return fechaLocal(fecha);
}

function formatearFecha(fecha) {
    if (!fecha) return "";
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
}

function obtenerEstado(vencimiento) {
    return vencimiento < fechaLocal(new Date())
        ? "Vencida"
        : "Activa";
}

// SELECTOR DE CLIENTES

function cargarClientesMembresia() {
    const selector = document.getElementById("clienteMembresia");
    if (!selector) return;

    const anterior = selector.value;
    selector.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = "Selecciona un cliente";
    selector.appendChild(inicial);

    clientes.forEach(cliente => {
        const opcion = document.createElement("option");
        opcion.value = cliente.id;
        opcion.textContent = cliente.nombre;
        selector.appendChild(opcion);
    });

    if (clientes.some(c => String(c.id) === anterior)) {
        selector.value = anterior;
    }
}

// REGISTRAR MEMBRESIA

function registrarMembresia(clienteId, plan, inicio) {
    const cliente = clientes.find(
        c => String(c.id) === String(clienteId)
    );

    if (!cliente || !planesMembresia[plan] || !inicio) {
        alert("Completa correctamente los datos.");
        return false;
    }

    const vencimiento = calcularVencimiento(
        inicio,
        planesMembresia[plan]
    );

    if (!vencimiento) {
        alert("La fecha de inicio no es válida.");
        return false;
    }

    const tieneActiva = membresias.some(m =>
        String(m.clienteId) === String(clienteId) &&
        obtenerEstado(m.fechaVencimiento) === "Activa"
    );

    if (tieneActiva) {
        alert("Este cliente ya tiene una membresía activa.");
        return false;
    }

    const nueva = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),
        clienteId: cliente.id,
        nombreCliente: cliente.nombre,
        plan,
        fechaInicio: inicio,
        fechaVencimiento: vencimiento
    };

    membresias.push(nueva);

    if (!guardarMembresias()) {
        membresias.pop();
        return false;
    }

    mostrarMembresias();
    alert("Membresía registrada correctamente.");
    return true;
}

// MOSTRAR MEMBRESIAS

function mostrarMembresias() {
    const contenedor = document.getElementById("listaMembresias");

    const activas = membresias.filter(m =>
        obtenerEstado(m.fechaVencimiento) === "Activa"
    );

    const vencidas = membresias.filter(m =>
        obtenerEstado(m.fechaVencimiento) === "Vencida"
    );

    const totalActivas = document.getElementById("membresiasActivas");
    const totalVencidas = document.getElementById("membresiasVencidas");
    const cantidad = document.getElementById("cantidadMembresias");

    if (totalActivas) totalActivas.textContent = activas.length;
    if (totalVencidas) totalVencidas.textContent = vencidas.length;

    if (cantidad) {
        cantidad.textContent = membresias.length === 1
            ? "1 membresía"
            : `${membresias.length} membresías`;
    }

    if (!contenedor) return;
    contenedor.replaceChildren();

    if (!membresias.length) {
        const p = document.createElement("p");
        p.className = "mensaje-vacio";
        p.textContent = "No hay membresías registradas todavía.";
        contenedor.appendChild(p);
        return;
    }

    membresias.forEach(m => {
        const estado = obtenerEstado(m.fechaVencimiento);

        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-cliente tarjeta-membresia";

        const titulo = document.createElement("h3");
        titulo.textContent = m.nombreCliente;

        const plan = document.createElement("p");
        plan.textContent = "Plan: " + m.plan;

        const inicio = document.createElement("p");
        inicio.textContent =
            "Inicio: " + formatearFecha(m.fechaInicio);

        const vencimiento = document.createElement("p");
        vencimiento.textContent =
            "Vencimiento: " + formatearFecha(m.fechaVencimiento);

        const etiqueta = document.createElement("span");
        etiqueta.className = estado === "Activa"
            ? "estado-membresia estado-activa"
            : "estado-membresia estado-vencida";
        etiqueta.textContent = estado;

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton-eliminar";
        boton.textContent = "Eliminar membresía";

        boton.addEventListener("click", () => {
            eliminarMembresia(m.id);
        });

        tarjeta.append(
            titulo, plan, inicio, vencimiento, etiqueta, boton
        );
        contenedor.appendChild(tarjeta);
    });
}

// ELIMINAR

function eliminarMembresia(id) {
    if (!confirm("¿Eliminar esta membresía?")) return;

    const anteriores = [...membresias];
    membresias = membresias.filter(m => m.id !== id);

    if (!guardarMembresias()) {
        membresias = anteriores;
        return;
    }

    mostrarMembresias();
    alert("Membresía eliminada correctamente.");
}

// INICIALIZAR

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formularioMembresia");
    const fecha = document.getElementById("fechaInicio");

    if (fecha) fecha.value = fechaLocal(new Date());

    cargarClientesMembresia();
    mostrarMembresias();

    if (!formulario || !fecha) return;

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const clienteId =
            document.getElementById("clienteMembresia").value;
        const plan =
            document.getElementById("planMembresia").value;

        if (registrarMembresia(clienteId, plan, fecha.value)) {
            formulario.reset();
            fecha.value = fechaLocal(new Date());
        }
    });
});
