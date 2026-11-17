
"use strict";

// ==========================================
// GYMDATA - SEGUIMIENTO SEMANAL
// NODE.JS + EXPRESS + MYSQL
// ==========================================

// Sesiones consultadas desde MySQL.
// Los datos antiguos de localStorage no se borran.

let sesionesEntrenamiento = [];

const API_SESIONES = "/api/sesiones";

const diasSeguimiento = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo"
];

// ==========================================
// MANEJO DE FECHAS
// ==========================================

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
    if (!valor) return "-";

    return convertirFechaLocal(valor).toLocaleDateString(
        "es-CO",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
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

    resultado.setDate(
        resultado.getDate() + cantidad
    );

    return fechaISOlocal(resultado);
}

// ==========================================
// CONEXION CON API
// ==========================================

async function solicitarAPISesiones(
    url,
    opciones = {}
) {
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
            "No fue posible conectar con GymData. " +
            "Comprueba que el servidor esté funcionando."
        );
    }

    let resultado;

    try {
        resultado = await respuesta.json();

    } catch (error) {
        throw new Error(
            "El servidor no devolvió una respuesta válida."
        );
    }

    if (!respuesta.ok || resultado.success === false) {
        throw new Error(
            resultado.mensaje ||
            "No fue posible completar la operación."
        );
    }

    return resultado;
}

// ==========================================
// CARGAR CLIENTES
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

    if (
        clientes.some(
            cliente => String(cliente.id) === anterior
        )
    ) {
        selector.value = anterior;
    }
}

// ==========================================
// ACTUALIZAR CONTADOR
// ==========================================

function actualizarTotalSesiones() {
    const contador = document.getElementById(
        "totalSesiones"
    );

    if (contador) {
        contador.textContent =
            sesionesEntrenamiento.length;
    }
}

// ==========================================
// CARGAR SESIONES DESDE MYSQL
// ==========================================

async function cargarSesionesDesdeAPI() {
    try {
        const resultado = await solicitarAPISesiones(
            API_SESIONES
        );

        if (!Array.isArray(resultado.data)) {
            throw new Error(
                "El servidor no devolvió una lista de sesiones."
            );
        }

        sesionesEntrenamiento = resultado.data;

        actualizarPanelSeguimiento();

        return true;

    } catch (error) {
        console.error(
            "Error al cargar sesiones:",
            error
        );

        mostrarErrorSeguimiento(error.message);

        return false;
    }
}

// ==========================================
// MOSTRAR ERRORES
// ==========================================

function mostrarErrorSeguimiento(mensaje) {
    const contenedor = document.getElementById(
        "planSemanal"
    );

    if (!contenedor) return;

    contenedor.replaceChildren();

    const aviso = document.createElement("p");
    aviso.className = "mensaje-vacio";
    aviso.textContent = mensaje;

    contenedor.appendChild(aviso);
}

// ==========================================
// REGISTRAR ENTRENAMIENTO
// ==========================================

async function registrarSesion(rutina, fecha) {
    const hoy = fechaISOlocal(new Date());

    if (fecha > hoy) {
        alert(
            "No puedes registrar entrenamientos futuros."
        );
        return false;
    }

    const duplicada = sesionesEntrenamiento.some(
        sesion =>
            String(sesion.rutinaId) === String(rutina.id) &&
            sesion.fecha === fecha
    );

    if (duplicada) {
        alert(
            "Este entrenamiento ya fue registrado " +
            "en esa fecha."
        );
        return false;
    }

    try {
        const resultado = await solicitarAPISesiones(
            API_SESIONES,
            {
                method: "POST",
                body: JSON.stringify({
                    rutinaId: rutina.id,
                    fecha
                })
            }
        );

        await cargarSesionesDesdeAPI();

        alert(
            resultado.mensaje ||
            "Entrenamiento registrado correctamente."
        );

        return true;

    } catch (error) {
        console.error(
            "Error al registrar sesión:",
            error
        );

        alert(error.message);

        return false;
    }
}

// ==========================================
// ELIMINAR REGISTRO
// ==========================================

async function eliminarSesion(id) {
    if (
        !confirm(
            "¿Deseas eliminar este registro de entrenamiento?"
        )
    ) {
        return false;
    }

    try {
        const resultado = await solicitarAPISesiones(
            `${API_SESIONES}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await cargarSesionesDesdeAPI();

        alert(
            resultado.mensaje ||
            "Sesión eliminada correctamente."
        );

        return true;

    } catch (error) {
        console.error(
            "Error al eliminar sesión:",
            error
        );

        alert(error.message);

        return false;
    }
}

// ==========================================
// CREAR ELEMENTOS HTML SEGUROS
// ==========================================

function crearTexto(
    etiqueta,
    contenido,
    clase = ""
) {
    const elemento = document.createElement(etiqueta);

    elemento.textContent = contenido;

    if (clase) {
        elemento.className = clase;
    }

    return elemento;
}

// ==========================================
// MOSTRAR PLAN SEMANAL
// ==========================================

function mostrarPlanSemanal() {
    const contenedor = document.getElementById(
        "planSemanal"
    );

    const selector = document.getElementById(
        "clienteSeguimiento"
    );

    const fechaInput = document.getElementById(
        "semanaSeguimiento"
    );

    const titulo = document.getElementById(
        "tituloSemana"
    );

    const contador = document.getElementById(
        "contadorSemana"
    );

    if (
        !contenedor ||
        !selector ||
        !fechaInput
    ) {
        return;
    }

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

        if (titulo) {
            titulo.textContent = "Plan semanal";
        }

        if (contador) {
            contador.textContent =
                "0 sesiones completadas";
        }

        return;
    }

    const inicio = lunesDeSemana(
        fechaInput.value ||
        fechaISOlocal(new Date())
    );

    const fechaInicio = fechaISOlocal(inicio);
    const fechaFin = agregarDias(inicio, 6);

    if (titulo) {
        titulo.textContent =
            `Semana: ${fechaLegible(fechaInicio)} - ` +
            fechaLegible(fechaFin);
    }

    const rutinasCliente =
        typeof rutinas !== "undefined"
            ? rutinas.filter(
                rutina =>
                    String(rutina.clienteId) ===
                    String(clienteId)
            )
            : [];

    const sesionesSemana = sesionesEntrenamiento.filter(
        sesion =>
            String(sesion.clienteId) ===
                String(clienteId) &&
            sesion.fecha >= fechaInicio &&
            sesion.fecha <= fechaFin
    );

    if (contador) {
        contador.textContent =
            `${sesionesSemana.length} sesiones completadas`;
    }

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

        if (rutinasDia.length === 0) {
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

            (rutina.ejercicios || []).forEach(
                ejercicio => {
                    lista.appendChild(
                        crearTexto(
                            "li",
                            `${ejercicio.nombre}: ` +
                            `${ejercicio.series} x ` +
                            `${ejercicio.repeticiones}`
                        )
                    );
                }
            );

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
                    boton.title =
                        "No puedes registrar fechas futuras.";
                }

                boton.addEventListener(
                    "click",
                    async () => {
                        boton.disabled = true;

                        try {
                            await registrarSesion(
                                rutina,
                                fecha
                            );
                        } finally {
                            boton.disabled = false;
                        }
                    }
                );

                bloque.appendChild(boton);
            }

            tarjeta.appendChild(bloque);
        });

        contenedor.appendChild(tarjeta);
    });
}

// ==========================================
// MOSTRAR HISTORIAL
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
        .filter(
            sesion =>
                !clienteId ||
                String(sesion.clienteId) ===
                    String(clienteId)
        )
        .sort(
            (a, b) =>
                b.fecha.localeCompare(a.fecha)
        );

    if (cantidad) {
        cantidad.textContent =
            `${filtradas.length} registros`;
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
            crearTexto(
                "strong",
                sesion.nombreRutina
            )
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

        boton.addEventListener("click", async () => {
            boton.disabled = true;

            try {
                await eliminarSesion(sesion.id);
            } finally {
                boton.disabled = false;
            }
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

    if (
        typeof actualizarEstadisticas === "function"
    ) {
        actualizarEstadisticas();
    }
}

// ==========================================
// INICIALIZAR
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const selector = document.getElementById(
        "clienteSeguimiento"
    );

    const semana = document.getElementById(
        "semanaSeguimiento"
    );

    if (!selector || !semana) return;

    semana.value = fechaISOlocal(new Date());

    cargarClientesSeguimiento();

    selector.addEventListener(
        "change",
        actualizarPanelSeguimiento
    );

    semana.addEventListener(
        "change",
        actualizarPanelSeguimiento
    );

    document.querySelector('a[href="#seguimiento"]')
        ?.addEventListener("click", async () => {
            cargarClientesSeguimiento();
            await cargarSesionesDesdeAPI();
        });

    cargarSesionesDesdeAPI();
});
