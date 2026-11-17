
"use strict";

// ==========================================
// GYMDATA - RUTINAS CON MYSQL
// ==========================================

let rutinas = [];
let ejerciciosRutinaActual = [];

const API_RUTINAS = "/api/rutinas";

// ==========================================
// PETICIONES A LA API
// ==========================================

async function solicitarAPIRutinas(url, opciones = {}) {
    let respuesta;

    try {
        respuesta = await fetch(url, {
            ...opciones,
            headers: {
                "Content-Type": "application/json",
                ...(opciones.headers || {})
            }
        });

    } catch (error) {
        throw new Error(
            "No se pudo conectar con el servidor GymData."
        );
    }

    let resultado;

    try {
        resultado = await respuesta.json();
    } catch (error) {
        throw new Error(
            "El servidor devolvió una respuesta no válida."
        );
    }

    if (!respuesta.ok || resultado.success === false) {
        throw new Error(
            resultado.mensaje || "Ocurrió un error."
        );
    }

    return resultado;
}

// ==========================================
// CARGAR CLIENTES
// ==========================================

function cargarClientesRutina() {
    const selector = document.getElementById("clienteRutina");

    if (!selector) return;

    const anterior = selector.value;
    selector.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = "Selecciona un cliente";
    selector.appendChild(inicial);

    if (typeof clientes === "undefined") return;

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

// ==========================================
// CARGAR EJERCICIOS
// ==========================================

function cargarEjerciciosRutina() {
    const selector = document.getElementById("ejercicioRutina");

    if (!selector) return;

    const anterior = selector.value;

    selector.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = "Selecciona un ejercicio";
    selector.appendChild(inicial);

    if (typeof ejercicios === "undefined") return;

    ejercicios.forEach(ejercicio => {
        const opcion = document.createElement("option");

        opcion.value = ejercicio.id;
        opcion.textContent =
            ejercicio.nombre + " - " + ejercicio.grupo;

        selector.appendChild(opcion);
    });

    if (ejercicios.some(e => String(e.id) === anterior)) {
        selector.value = anterior;
    }
}

// ==========================================
// AGREGAR EJERCICIO
// ==========================================

function agregarEjercicioARutina() {
    const selector = document.getElementById("ejercicioRutina");

    const ejercicio = ejercicios.find(
        e => String(e.id) === String(selector.value)
    );

    if (!ejercicio) {
        alert("Selecciona un ejercicio.");
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

// ==========================================
// MOSTRAR EJERCICIOS SELECCIONADOS
// ==========================================

function mostrarEjerciciosSeleccionados() {
    const contenedor = document.getElementById(
        "ejerciciosSeleccionadosRutina"
    );

    if (!contenedor) return;

    contenedor.replaceChildren();

    if (ejerciciosRutinaActual.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "mensaje-vacio";
        mensaje.textContent =
            "Todavía no has agregado ejercicios.";

        contenedor.appendChild(mensaje);
        return;
    }

    ejerciciosRutinaActual.forEach((item, indice) => {
        const fila = document.createElement("div");
        fila.className = "fila-ejercicio-rutina";

        const informacion = document.createElement("div");

        const titulo = document.createElement("strong");
        titulo.textContent =
            `${indice + 1}. ${item.nombre}`;

        const detalle = document.createElement("p");
        detalle.textContent =
            `${item.series} series · ` +
            `${item.repeticiones} repeticiones · ` +
            `${item.descanso}s descanso`;

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

// ==========================================
// CONSULTAR RUTINAS DESDE MYSQL
// ==========================================

async function cargarRutinasDesdeAPI() {
    try {
        const resultado = await solicitarAPIRutinas(
            API_RUTINAS
        );

        if (!Array.isArray(resultado.data)) {
            throw new Error(
                "La API no devolvió una lista válida."
            );
        }

        rutinas = resultado.data;

        mostrarRutinas();

        if (
            typeof actualizarPanelSeguimiento === "function"
        ) {
            actualizarPanelSeguimiento();
        }

        return true;

    } catch (error) {
        console.error("Cargar rutinas:", error);

        const contenedor = document.getElementById(
            "listaRutinas"
        );

        if (contenedor) {
            contenedor.replaceChildren();

            const mensaje = document.createElement("p");
            mensaje.className = "mensaje-vacio";
            mensaje.textContent = error.message;

            contenedor.appendChild(mensaje);
        }

        return false;
    }
}

// ==========================================
// GUARDAR RUTINA
// ==========================================

async function registrarRutina() {
    const nombre = document.getElementById(
        "nombreRutina"
    ).value.trim();

    const clienteId = document.getElementById(
        "clienteRutina"
    ).value;

    const dia = document.getElementById(
        "diaRutina"
    ).value;

    const objetivo = document.getElementById(
        "objetivoRutina"
    ).value;

    if (!nombre || !clienteId || !dia || !objetivo) {
        alert("Completa todos los campos.");
        return false;
    }

    if (!ejerciciosRutinaActual.length) {
        alert("Agrega al menos un ejercicio.");
        return false;
    }

    try {
        const resultado = await solicitarAPIRutinas(
            API_RUTINAS,
            {
                method: "POST",
                body: JSON.stringify({
                    nombre,
                    clienteId,
                    dia,
                    objetivo,
                    ejercicios: ejerciciosRutinaActual.map(
                        e => e.id
                    )
                })
            }
        );

        await cargarRutinasDesdeAPI();

        ejerciciosRutinaActual = [];
        mostrarEjerciciosSeleccionados();

        document.getElementById(
            "formularioRutina"
        ).reset();

        alert(
            resultado.mensaje ||
            "Rutina registrada correctamente."
        );

        return true;

    } catch (error) {
        console.error("Registrar rutina:", error);
        alert(error.message);
        return false;
    }
}

// ==========================================
// MOSTRAR RUTINAS
// ==========================================

function mostrarRutinas() {
    const contenedor = document.getElementById("listaRutinas");

    const cantidad = document.getElementById(
        "cantidadRutinas"
    );

    const total = document.getElementById(
        "totalRutinas"
    );

    if (total) {
        total.textContent = rutinas.length;
    }

    if (cantidad) {
        cantidad.textContent = rutinas.length === 1
            ? "1 rutina"
            : `${rutinas.length} rutinas`;
    }

    if (!contenedor) return;

    contenedor.replaceChildren();

    if (rutinas.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "mensaje-vacio";
        mensaje.textContent =
            "No hay rutinas registradas en MySQL.";

        contenedor.appendChild(mensaje);
        return;
    }

    rutinas.forEach(rutina => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-cliente tarjeta-rutina";

        const encabezado = document.createElement("div");
        encabezado.className = "encabezado-rutina";

        const titulo = document.createElement("h3");
        titulo.textContent = rutina.nombre;

        const dia = document.createElement("span");
        dia.className = "etiqueta-muscular";
        dia.textContent = rutina.dia;

        encabezado.append(titulo, dia);

        const cliente = document.createElement("p");
        cliente.textContent =
            "Cliente: " + rutina.nombreCliente;

        const objetivo = document.createElement("p");
        objetivo.textContent =
            "Objetivo: " + rutina.objetivo;

        const lista = document.createElement("ol");
        lista.className = "lista-ejercicios-rutina";

        (rutina.ejercicios || []).forEach(ejercicio => {
            const elemento = document.createElement("li");

            elemento.textContent =
                `${ejercicio.nombre} — ` +
                `${ejercicio.series} x ` +
                `${ejercicio.repeticiones} ` +
                `(${ejercicio.descanso}s descanso)`;

            lista.appendChild(elemento);
        });

        const estado = document.createElement("span");

        estado.className = rutina.realizada
            ? "estado-membresia estado-activa"
            : "estado-membresia estado-pendiente";

        estado.textContent = rutina.realizada
            ? "Realizada"
            : "Pendiente";

        const acciones = document.createElement("div");
        acciones.className = "acciones-tarjeta";

        const botonEstado = document.createElement("button");
        botonEstado.type = "button";
        botonEstado.className = "boton-editar";

        botonEstado.textContent = rutina.realizada
            ? "Marcar pendiente"
            : "Marcar realizada";

        botonEstado.addEventListener("click", async () => {
            botonEstado.disabled = true;

            try {
                await cambiarEstadoRutina(rutina.id);
            } finally {
                botonEstado.disabled = false;
            }
        });

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "boton-eliminar";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", async () => {
            botonEliminar.disabled = true;

            try {
                await eliminarRutina(rutina.id);
            } finally {
                botonEliminar.disabled = false;
            }
        });

        acciones.append(botonEstado, botonEliminar);

        tarjeta.append(
            encabezado,
            cliente,
            objetivo,
            lista,
            estado,
            acciones
        );

        contenedor.appendChild(tarjeta);
    });
}

// ==========================================
// CAMBIAR ESTADO DE RUTINA
// ==========================================

async function cambiarEstadoRutina(id) {
    const rutina = rutinas.find(r => r.id === id);

    if (!rutina) return false;

    try {
        await solicitarAPIRutinas(
            `${API_RUTINAS}/${encodeURIComponent(id)}/estado`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    realizada: !rutina.realizada
                })
            }
        );

        await cargarRutinasDesdeAPI();

        return true;

    } catch (error) {
        alert(error.message);
        return false;
    }
}

// ==========================================
// ELIMINAR RUTINA
// ==========================================

async function eliminarRutina(id) {
    if (!confirm("¿Deseas eliminar esta rutina?")) {
        return false;
    }

    try {
        await solicitarAPIRutinas(
            `${API_RUTINAS}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await cargarRutinasDesdeAPI();

        alert("Rutina eliminada correctamente.");

        return true;

    } catch (error) {
        alert(error.message);
        return false;
    }
}

// ==========================================
// INICIALIZAR MODULO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById(
        "formularioRutina"
    );

    if (!formulario) return;

    cargarClientesRutina();
    cargarEjerciciosRutina();
    mostrarEjerciciosSeleccionados();

    cargarRutinasDesdeAPI();

    document.getElementById(
        "agregarEjercicioRutina"
    ).addEventListener(
        "click",
        agregarEjercicioARutina
    );

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        const boton = formulario.querySelector(
            'button[type="submit"]'
        );

        if (boton) boton.disabled = true;

        try {
            await registrarRutina();

        } finally {
            if (boton) boton.disabled = false;
        }
    });

    document.querySelector('a[href="#rutinas"]')
        ?.addEventListener("click", () => {
            cargarClientesRutina();
            cargarEjerciciosRutina();
            cargarRutinasDesdeAPI();
        });
});
