
"use strict";

// ==========================================
// GYMDATA - SEGUIMIENTO SEMANAL
// ==========================================

// Historial separado de las rutinas.
// Así una rutina puede completarse varias semanas.

let sesionesEntrenamiento = [];

try {
    const datos = JSON.parse(
        localStorage.getItem("gymdata_sesiones")
    );
    sesionesEntrenamiento = Array.isArray(datos)
        ? datos
        : [];
} catch (error) {
    console.error("Error al cargar sesiones:", error);
}

// ==========================================
// FUNCIONES DE FECHAS
// ==========================================

const diasSeguimiento = [
    "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado", "Domingo"
];

function fechaISOlocal(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function convertirFechaLocal(valor) {
    const [anio, mes, dia] = valor.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
}

function fechaLegible(valor) {
    return convertirFechaLocal(valor).toLocaleDateString(
        "es-CO",
        { day: "2-digit", month: "short", year: "numeric" }
    );
}

function lunesDeSemana(valor) {
    const fecha = convertirFechaLocal(valor);
    const dia = (fecha.getDay() + 6) % 7;
    fecha.setDate(fecha.getDate() - dia);
    return fecha;
}

function agregarDias(fecha, cantidad) {
    const resultado = new Date(fecha);
    resultado.setDate(resultado.getDate() + cantidad);
    return fechaISOlocal(resultado);
}

// ==========================================
// GUARDAR SESIONES
// ==========================================

function guardarSesiones() {
    try {
        localStorage.setItem(
            "gymdata_sesiones",
            JSON.stringify(sesionesEntrenamiento)
        );
        return true;
    } catch (error) {
        console.error("Error al guardar sesiones:", error);
        alert("No fue posible guardar el entrenamiento.");
        return false;
    }
}

// ==========================================
// SELECCIONAR CLIENTE
// ==========================================

function cargarClientesSeguimiento() {
    const selector = document.getElementById(
        "clienteSeguimiento"
    );

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

    if (clientes.some(
        cliente => String(cliente.id) === anterior
    )) {
        selector.value = anterior;
    }
}

// ==========================================
// TOTAL GENERAL
// ==========================================

function actualizarTotalSesiones() {
    const contador = document.getElementById("totalSesiones");

    if (contador) {
        contador.textContent = sesionesEntrenamiento.length;
    }
}

// ==========================================
// REGISTRAR UNA SESION
// ==========================================

function registrarSesion(rutina, fecha) {
    const hoy = fechaISOlocal(new Date());

    if (fecha > hoy) {
        alert("No puedes completar entrenamientos futuros.");
        return;
    }

    const duplicada = sesionesEntrenamiento.some(
        sesion =>
            String(sesion.rutinaId) === String(rutina.id) &&
            sesion.fecha === fecha
    );

    if (duplicada) {
        alert(
            "Este entrenamiento ya fue registrado en esa fecha."
        );
        return;
    }

    const nuevaSesion = {
        id: typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString() +
              Math.random().toString(16).slice(2),

        rutinaId: rutina.id,
        clienteId: rutina.clienteId,
        nombreCliente: rutina.nombreCliente,
        nombreRutina: rutina.nombre,
        fecha: fecha,
        fechaRegistro: new Date().toISOString()
    };

    sesionesEntrenamiento.push(nuevaSesion);

    if (!guardarSesiones()) {
        sesionesEntrenamiento.pop();
        return;
    }

    actualizarPanelSeguimiento();
    alert("Entrenamiento registrado correctamente.");
}

// ==========================================
// ELIMINAR REGISTRO
// ==========================================

function eliminarSesion(id) {
    if (!confirm(
        "¿Deseas eliminar este registro del historial?"
    )) {
        return;
    }

    const anteriores = [...sesionesEntrenamiento];

    sesionesEntrenamiento = sesionesEntrenamiento.filter(
        sesion => sesion.id !== id
    );

    if (!guardarSesiones()) {
        sesionesEntrenamiento = anteriores;
        return;
    }

    actualizarPanelSeguimiento();
}

// ==========================================
// CONSTRUIR ELEMENTOS SEGUROS
// ==========================================

function crearTexto(etiqueta, contenido, clase = "") {
    const elemento = document.createElement(etiqueta);
    elemento.textContent = contenido;

    if (clase) elemento.className = clase;

    return elemento;
}

// ==========================================
// MOSTRAR PLAN SEMANAL
// ==========================================

function mostrarPlanSemanal() {
    const contenedor = document.getElementById("planSemanal");
    const selector = document.getElementById(
        "clienteSeguimiento"
    );

    const fechaInput = document.getElementById(
        "semanaSeguimiento"
    );

    const titulo = document.getElementById("tituloSemana");
    const contador = document.getElementById(
        "contadorSemana"
    );

    if (!contenedor || !selector || !fechaInput) return;

    contenedor.replaceChildren();

    const clienteId = selector.value;

    if (!clienteId) {
        contenedor.appendChild(
            crearTexto(
                "p",
                "Selecciona un cliente para consultar su plan.",
                "mensaje-vacio"
            )
        );

        titulo.textContent = "Plan semanal";
        contador.textContent = "0 sesiones completadas";
        return;
    }

    const inicio = lunesDeSemana(
        fechaInput.value || fechaISOlocal(new Date())
    );

    const fechaInicio = fechaISOlocal(inicio);
    const fechaFin = agregarDias(inicio, 6);

    titulo.textContent =
        `Semana: ${fechaLegible(fechaInicio)} - ` +
        fechaLegible(fechaFin);

    const rutinasCliente = typeof rutinas !== "undefined"
        ? rutinas.filter(
            rutina =>
                String(rutina.clienteId) === String(clienteId)
        )
        : [];

    const sesionesSemana = sesionesEntrenamiento.filter(
        sesion =>
            String(sesion.clienteId) === String(clienteId) &&
            sesion.fecha >= fechaInicio &&
            sesion.fecha <= fechaFin
    );

    contador.textContent =
        `${sesionesSemana.length} sesiones completadas`;

    diasSeguimiento.forEach((dia, indice) => {
        const fecha = agregarDias(inicio, indice);

        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-dia";

        tarjeta.appendChild(
            crearTexto(
                "span",
                fechaLegible(fecha),
                "fecha-dia"
            )
        );

        tarjeta.appendChild(
            crearTexto("h3", dia)
        );

        const rutinasDia = rutinasCliente.filter(
            rutina => rutina.dia === dia
        );

        if (!rutinasDia.length) {
            tarjeta.appendChild(
                crearTexto(
                    "p",
                    "Día sin rutina asignada.",
                    "mensaje-vacio"
                )
            );
        }

        rutinasDia.forEach(rutina => {
            const bloque = document.createElement("div");
            bloque.className = "bloque-rutina-semana";

            bloque.appendChild(
                crearTexto("h4", rutina.nombre)
            );

            bloque.appendChild(
                crearTexto(
                    "p",
                    "Objetivo: " + rutina.objetivo
                )
            );

            const lista = document.createElement("ul");
            lista.className = "ejercicios-dia";

            (rutina.ejercicios || []).forEach(ejercicio => {
                lista.appendChild(
                    crearTexto(
                        "li",
                        `${ejercicio.nombre}: ` +
                        `${ejercicio.series} x ` +
                        `${ejercicio.repeticiones}`
                    )
                );
            });

            bloque.appendChild(lista);

            const completada = sesionesSemana.some(
                sesion =>
                    String(sesion.rutinaId) ===
                        String(rutina.id) &&
                    sesion.fecha === fecha
            );

            const estado = crearTexto(
                "span",
                completada ? "Realizada" : "Pendiente",
                completada
                    ? "estado-membresia estado-activa"
                    : "estado-membresia estado-pendiente"
            );

            bloque.appendChild(estado);

            if (!completada) {
                const boton = document.createElement("button");
                boton.type = "button";
                boton.className = "boton-completar";
                boton.textContent = "Marcar realizada";

                if (fecha > fechaISOlocal(new Date())) {
                    boton.disabled = true;
                    boton.title = "Fecha futura";
                }

                boton.addEventListener("click", () => {
                    registrarSesion(rutina, fecha);
                });

                bloque.appendChild(boton);
            }

            tarjeta.appendChild(bloque);
        });

        contenedor.appendChild(tarjeta);
    });
}

// ==========================================
// HISTORIAL
// ==========================================

function mostrarHistorialEntrenamientos() {
    const contenedor = document.getElementById(
        "historialEntrenamientos"
    );

    const cantidad = document.getElementById(
        "cantidadHistorial"
    );

    const clienteId = document.getElementById(
        "clienteSeguimiento"
    )?.value;

    if (!contenedor) return;

    contenedor.replaceChildren();

    const filtradas = sesionesEntrenamiento
        .filter(sesion =>
            !clienteId ||
            String(sesion.clienteId) === String(clienteId)
        )
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

    if (cantidad) {
        cantidad.textContent = `${filtradas.length} registros`;
    }

    if (!filtradas.length) {
        contenedor.appendChild(
            crearTexto(
                "p",
                "No hay entrenamientos registrados.",
                "mensaje-vacio"
            )
        );
        return;
    }

    filtradas.forEach(sesion => {
        const fila = document.createElement("div");
        fila.className = "fila-historial";

        const informacion = document.createElement("div");

        informacion.appendChild(
            crearTexto("strong", sesion.nombreRutina)
        );

        informacion.appendChild(
            crearTexto(
                "p",
                `${sesion.nombreCliente} · ` +
                fechaLegible(sesion.fecha)
            )
        );

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton-eliminar";
        boton.textContent = "Eliminar";

        boton.addEventListener("click", () => {
            eliminarSesion(sesion.id);
        });

        fila.append(informacion, boton);
        contenedor.appendChild(fila);
    });
}

// ==========================================
// ACTUALIZAR PANEL
// ==========================================

function actualizarPanelSeguimiento() {
    actualizarTotalSesiones();
    mostrarPlanSemanal();
    mostrarHistorialEntrenamientos();
}

// ==========================================
// INICIALIZAR
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const cliente = document.getElementById(
        "clienteSeguimiento"
    );

    const semana = document.getElementById(
        "semanaSeguimiento"
    );

    if (!cliente || !semana) return;

    semana.value = fechaISOlocal(new Date());

    cargarClientesSeguimiento();

    cliente.addEventListener(
        "change",
        actualizarPanelSeguimiento
    );

    semana.addEventListener(
        "change",
        actualizarPanelSeguimiento
    );

    // Al entrar al módulo, actualizar clientes y rutinas.
    document.querySelector('a[href="#seguimiento"]')
        ?.addEventListener("click", () => {
            cargarClientesSeguimiento();
            actualizarPanelSeguimiento();
        });

    // Actualizar si la pestaña vuelve a estar visible.
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            actualizarPanelSeguimiento();
        }
    });

    actualizarPanelSeguimiento();
});
