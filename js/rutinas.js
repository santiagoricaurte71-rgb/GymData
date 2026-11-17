
"use strict";

// GYMDATA - PLANES DE ENTRENAMIENTO

let rutinas = [];
let ejerciciosRutinaActual = [];

try {
    const datos = JSON.parse(
        localStorage.getItem("gymdata_rutinas")
    );

    rutinas = Array.isArray(datos) ? datos : [];
} catch (error) {
    console.error("Error al cargar rutinas:", error);
}

// GUARDAR

function guardarRutinas() {
    try {
        localStorage.setItem(
            "gymdata_rutinas",
            JSON.stringify(rutinas)
        );
        return true;
    } catch (error) {
        console.error(error);
        alert("No fue posible guardar la rutina.");
        return false;
    }
}

function generarIdRutina() {
    return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString() +
          Math.random().toString(16).slice(2);
}

// CLIENTES DISPONIBLES

function cargarClientesRutina() {
    const selector = document.getElementById("clienteRutina");
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

// EJERCICIOS DISPONIBLES

function cargarEjerciciosRutina() {
    const selector = document.getElementById("ejercicioRutina");
    if (!selector) return;

    const anterior = selector.value;
    selector.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = "Selecciona un ejercicio";
    selector.appendChild(inicial);

    ejercicios.forEach(e => {
        const opcion = document.createElement("option");
        opcion.value = e.id;
        opcion.textContent = `${e.nombre} - ${e.grupo}`;
        selector.appendChild(opcion);
    });

    if (ejercicios.some(e => String(e.id) === anterior)) {
        selector.value = anterior;
    }
}

// AGREGAR EJERCICIO A LA RUTINA

function agregarEjercicioARutina() {
    const selector = document.getElementById("ejercicioRutina");
    const ejercicio = ejercicios.find(
        e => String(e.id) === String(selector.value)
    );

    if (!ejercicio) {
        alert("Selecciona un ejercicio válido.");
        return;
    }

    if (ejerciciosRutinaActual.some(
        e => String(e.id) === String(ejercicio.id)
    )) {
        alert("Este ejercicio ya está agregado.");
        return;
    }

    ejerciciosRutinaActual.push({
        id: ejercicio.id,
        nombre: ejercicio.nombre,
        grupo: ejercicio.grupo,
        series: ejercicio.series,
        repeticiones: ejercicio.repeticiones,
        descanso: ejercicio.descanso
    });

    selector.value = "";
    mostrarEjerciciosSeleccionados();
}

// MOSTRAR EJERCICIOS ELEGIDOS

function mostrarEjerciciosSeleccionados() {
    const contenedor = document.getElementById(
        "ejerciciosSeleccionadosRutina"
    );

    if (!contenedor) return;

    contenedor.replaceChildren();

    if (!ejerciciosRutinaActual.length) {
        const p = document.createElement("p");
        p.className = "mensaje-vacio";
        p.textContent = "Todavía no has agregado ejercicios.";
        contenedor.appendChild(p);
        return;
    }

    ejerciciosRutinaActual.forEach((e, indice) => {
        const fila = document.createElement("div");
        fila.className = "fila-ejercicio-rutina";

        const informacion = document.createElement("div");

        const titulo = document.createElement("strong");
        titulo.textContent = `${indice + 1}. ${e.nombre}`;

        const detalle = document.createElement("p");
        detalle.textContent =
            `${e.series} series · ${e.repeticiones} repeticiones · ` +
            `${e.descanso}s descanso`;

        informacion.append(titulo, detalle);

        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "boton-eliminar";
        quitar.textContent = "Quitar";

        quitar.addEventListener("click", () => {
            ejerciciosRutinaActual.splice(indice, 1);
            mostrarEjerciciosSeleccionados();
        });

        fila.append(informacion, quitar);
        contenedor.appendChild(fila);
    });
}

// REGISTRAR RUTINA

function registrarRutina() {
    const nombre = document.getElementById("nombreRutina")
        .value.trim();

    const clienteId =
        document.getElementById("clienteRutina").value;

    const dia =
        document.getElementById("diaRutina").value;

    const objetivo =
        document.getElementById("objetivoRutina").value;

    const cliente = clientes.find(
        c => String(c.id) === String(clienteId)
    );

    if (!nombre || !cliente || !dia || !objetivo) {
        alert("Completa correctamente los datos de la rutina.");
        return false;
    }

    const dias = [
        "Lunes", "Martes", "Miércoles",
        "Jueves", "Viernes", "Sábado", "Domingo"
    ];

    const objetivos = [
        "Hipertrofia", "Fuerza", "Resistencia",
        "Calistenia", "Acondicionamiento físico", "General"
    ];

    if (!dias.includes(dia) || !objetivos.includes(objetivo)) {
        alert("El día o el objetivo no son válidos.");
        return false;
    }

    if (!ejerciciosRutinaActual.length) {
        alert("Agrega al menos un ejercicio.");
        return false;
    }

    const nueva = {
        id: generarIdRutina(),
        nombre,
        clienteId: cliente.id,
        nombreCliente: cliente.nombre,
        dia,
        objetivo,
        ejercicios: ejerciciosRutinaActual.map(e => ({ ...e })),
        realizada: false,
        fechaRealizacion: null
    };

    rutinas.push(nueva);

    if (!guardarRutinas()) {
        rutinas.pop();
        return false;
    }

    ejerciciosRutinaActual = [];

    document.getElementById("formularioRutina").reset();

    mostrarEjerciciosSeleccionados();
    mostrarRutinas();

    alert("Rutina registrada correctamente.");
    return true;
}

// MOSTRAR RUTINAS

function mostrarRutinas() {
    const contenedor = document.getElementById("listaRutinas");
    const cantidad = document.getElementById("cantidadRutinas");
    const total = document.getElementById("totalRutinas");

    if (total) total.textContent = rutinas.length;

    if (cantidad) {
        cantidad.textContent = rutinas.length === 1
            ? "1 rutina"
            : `${rutinas.length} rutinas`;
    }

    if (!contenedor) return;
    contenedor.replaceChildren();

    if (!rutinas.length) {
        const p = document.createElement("p");
        p.className = "mensaje-vacio";
        p.textContent = "No hay rutinas registradas todavía.";
        contenedor.appendChild(p);
        return;
    }

    rutinas.forEach(r => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-cliente tarjeta-rutina";

        const encabezado = document.createElement("div");
        encabezado.className = "encabezado-rutina";

        const titulo = document.createElement("h3");
        titulo.textContent = r.nombre;

        const dia = document.createElement("span");
        dia.className = "etiqueta-muscular";
        dia.textContent = r.dia;

        encabezado.append(titulo, dia);

        const cliente = document.createElement("p");
        cliente.textContent = "Cliente: " + r.nombreCliente;

        const objetivo = document.createElement("p");
        objetivo.textContent = "Objetivo: " + r.objetivo;

        const lista = document.createElement("ol");
        lista.className = "lista-ejercicios-rutina";

        (r.ejercicios || []).forEach(e => {
            const li = document.createElement("li");
            li.textContent =
                `${e.nombre}: ${e.series} x ${e.repeticiones}, ` +
                `${e.descanso}s de descanso`;
            lista.appendChild(li);
        });

        const estado = document.createElement("span");
        estado.className = r.realizada
            ? "estado-membresia estado-activa"
            : "estado-membresia estado-pendiente";

        estado.textContent = r.realizada
            ? "Realizada"
            : "Pendiente";

        const acciones = document.createElement("div");
        acciones.className = "acciones-tarjeta";

        const completar = document.createElement("button");
        completar.type = "button";
        completar.className = "boton-editar";
        completar.textContent = r.realizada
            ? "Marcar pendiente"
            : "Marcar realizada";

        completar.addEventListener("click", () => {
            cambiarEstadoRutina(r.id);
        });

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "boton-eliminar";
        eliminar.textContent = "Eliminar";

        eliminar.addEventListener("click", () => {
            eliminarRutina(r.id);
        });

        acciones.append(completar, eliminar);

        tarjeta.append(
            encabezado, cliente, objetivo,
            lista, estado, acciones
        );

        contenedor.appendChild(tarjeta);
    });
}

// CAMBIAR ESTADO

function cambiarEstadoRutina(id) {
    const rutina = rutinas.find(r => r.id === id);
    if (!rutina) return;

    const anterior = rutina.realizada;
    const fechaAnterior = rutina.fechaRealizacion;

    rutina.realizada = !rutina.realizada;
    rutina.fechaRealizacion = rutina.realizada
        ? new Date().toISOString()
        : null;

    if (!guardarRutinas()) {
        rutina.realizada = anterior;
        rutina.fechaRealizacion = fechaAnterior;
        return;
    }

    mostrarRutinas();
}

// ELIMINAR

function eliminarRutina(id) {
    if (!confirm("¿Eliminar esta rutina?")) return;

    const anteriores = [...rutinas];
    rutinas = rutinas.filter(r => r.id !== id);

    if (!guardarRutinas()) {
        rutinas = anteriores;
        return;
    }

    mostrarRutinas();
    alert("Rutina eliminada correctamente.");
}

// INICIALIZAR

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formularioRutina");

    cargarClientesRutina();
    cargarEjerciciosRutina();
    mostrarEjerciciosSeleccionados();
    mostrarRutinas();

    if (!formulario) return;

    document.getElementById("agregarEjercicioRutina")
        .addEventListener("click", agregarEjercicioARutina);

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        registrarRutina();
    });
});
