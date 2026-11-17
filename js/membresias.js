
"use strict";

// ==========================================
// GYMDATA - GESTION DE MEMBRESIAS
// CONEXION CON MYSQL
// ==========================================

// Las membresias ahora se consultan desde MySQL.
// No eliminamos los registros antiguos de localStorage.

let membresias = [];

const API_MEMBRESIAS = "/api/membresias";

// ==========================================
// FECHAS
// ==========================================

function fechaLocal(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function formatearFecha(fecha) {
    if (!fecha) return "-";

    const partes = fecha.slice(0, 10).split("-");

    if (partes.length !== 3) return "-";

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerEstado(fechaVencimiento, fechaInicio) {
    const hoy = fechaLocal(new Date());

    if (fechaVencimiento < hoy) {
        return "Vencida";
    }

    if (fechaInicio && fechaInicio > hoy) {
        return "Programada";
    }

    return "Activa";
}

// ==========================================
// CREAR SELECTOR DE METODO DE PAGO
// ==========================================

function crearSelectorMetodoPago() {
    const formulario = document.getElementById(
        "formularioMembresia"
    );

    if (!formulario) return;

    // Evitar duplicar el campo.
    if (document.getElementById("metodoPagoMembresia")) {
        return;
    }

    const grupo = document.createElement("div");
    grupo.className = "grupo-formulario";

    const etiqueta = document.createElement("label");
    etiqueta.htmlFor = "metodoPagoMembresia";
    etiqueta.textContent = "Método de pago";

    const selector = document.createElement("select");
    selector.id = "metodoPagoMembresia";
    selector.required = true;

    const opciones = [
        { valor: "", texto: "Selecciona el método de pago" },
        { valor: "Nequi", texto: "Nequi" },
        { valor: "Tarjeta", texto: "Tarjeta" }
    ];

    opciones.forEach(item => {
        const opcion = document.createElement("option");
        opcion.value = item.valor;
        opcion.textContent = item.texto;

        selector.appendChild(opcion);
    });

    grupo.append(etiqueta, selector);

    const boton = formulario.querySelector(
        'button[type="submit"]'
    );

    formulario.insertBefore(grupo, boton);
}

// ==========================================
// COMUNICACION CON API
// ==========================================

async function solicitarAPIMembresias(
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
            "Ocurrió un error con la membresía."
        );
    }

    return resultado;
}

// ==========================================
// CARGAR CLIENTES EN EL SELECTOR
// ==========================================

function cargarClientesMembresia() {
    const selector = document.getElementById(
        "clienteMembresia"
    );

    if (!selector) return;

    const seleccionAnterior = selector.value;

    selector.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = "Selecciona un cliente";

    selector.appendChild(inicial);

    if (typeof clientes === "undefined") {
        return;
    }

    clientes.forEach(cliente => {
        const opcion = document.createElement("option");

        opcion.value = cliente.id;
        opcion.textContent = cliente.nombre;

        selector.appendChild(opcion);
    });

    const existe = clientes.some(
        cliente =>
            String(cliente.id) === seleccionAnterior
    );

    if (existe) {
        selector.value = seleccionAnterior;
    }
}

// ==========================================
// CONSULTAR MEMBRESIAS DESDE MYSQL
// ==========================================

async function cargarMembresiasDesdeAPI() {
    try {
        const resultado = await solicitarAPIMembresias(
            API_MEMBRESIAS
        );

        if (!Array.isArray(resultado.data)) {
            throw new Error(
                "La API no devolvió una lista válida."
            );
        }

        membresias = resultado.data;

        mostrarMembresias();

        return true;

    } catch (error) {
        console.error(
            "Error al consultar membresías:",
            error
        );

        const contenedor = document.getElementById(
            "listaMembresias"
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
// REGISTRAR MEMBRESIA
// ==========================================

async function registrarMembresia(
    clienteId,
    plan,
    fechaInicio,
    metodoPago
) {
    if (
        !clienteId ||
        !plan ||
        !fechaInicio ||
        !metodoPago
    ) {
        alert("Completa todos los campos.");
        return false;
    }

    if (!["Nequi", "Tarjeta"].includes(metodoPago)) {
        alert("Selecciona un método de pago válido.");
        return false;
    }

    try {
        const resultado = await solicitarAPIMembresias(
            API_MEMBRESIAS,
            {
                method: "POST",
                body: JSON.stringify({
                    clienteId,
                    plan,
                    fechaInicio,
                    metodoPago
                })
            }
        );

        await cargarMembresiasDesdeAPI();

        alert(
            resultado.mensaje ||
            "Membresía registrada correctamente."
        );

        return true;

    } catch (error) {
        console.error(
            "Error al registrar membresía:",
            error
        );

        alert(error.message);

        return false;
    }
}

// ==========================================
// MOSTRAR MEMBRESIAS
// ==========================================

function mostrarMembresias() {
    const contenedor = document.getElementById(
        "listaMembresias"
    );

    const contadorActivas = document.getElementById(
        "membresiasActivas"
    );

    const contadorVencidas = document.getElementById(
        "membresiasVencidas"
    );

    const cantidad = document.getElementById(
        "cantidadMembresias"
    );

    const activas = membresias.filter(
        item =>
            obtenerEstado(
                item.fechaVencimiento,
                item.fechaInicio
            ) === "Activa"
    );

    const vencidas = membresias.filter(
        item =>
            obtenerEstado(
                item.fechaVencimiento,
                item.fechaInicio
            ) === "Vencida"
    );

    if (contadorActivas) {
        contadorActivas.textContent = activas.length;
    }

    if (contadorVencidas) {
        contadorVencidas.textContent = vencidas.length;
    }

    if (cantidad) {
        cantidad.textContent = membresias.length === 1
            ? "1 membresía"
            : `${membresias.length} membresías`;
    }

    if (!contenedor) return;

    contenedor.replaceChildren();

    if (membresias.length === 0) {
        const mensaje = document.createElement("p");

        mensaje.className = "mensaje-vacio";
        mensaje.textContent =
            "No hay membresías registradas en MySQL.";

        contenedor.appendChild(mensaje);
        return;
    }

    membresias.forEach(membresia => {
        const estado = obtenerEstado(
            membresia.fechaVencimiento,
            membresia.fechaInicio
        );

        const tarjeta = document.createElement("article");
        tarjeta.className =
            "tarjeta-cliente tarjeta-membresia";

        const titulo = document.createElement("h3");
        titulo.textContent = membresia.nombreCliente;

        const plan = document.createElement("p");
        plan.textContent =
            "Plan: " + membresia.plan;

        const inicio = document.createElement("p");
        inicio.textContent =
            "Inicio: " +
            formatearFecha(membresia.fechaInicio);

        const vencimiento = document.createElement("p");
        vencimiento.textContent =
            "Vencimiento: " +
            formatearFecha(membresia.fechaVencimiento);

        const pago = document.createElement("p");
        pago.textContent =
            "Método de pago: " +
            (membresia.metodoPago || "Sin registrar");

        const etiqueta = document.createElement("span");
        etiqueta.className = "estado-membresia";

        if (estado === "Activa") {
            etiqueta.classList.add("estado-activa");

        } else if (estado === "Vencida") {
            etiqueta.classList.add("estado-vencida");

        } else {
            etiqueta.classList.add("estado-pendiente");
        }

        etiqueta.textContent = estado;

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton-eliminar";
        boton.textContent = "Eliminar membresía";

        boton.addEventListener("click", async () => {
            boton.disabled = true;

            try {
                await eliminarMembresia(membresia.id);
            } finally {
                boton.disabled = false;
            }
        });

        tarjeta.append(
            titulo,
            plan,
            inicio,
            vencimiento,
            pago,
            etiqueta,
            boton
        );

        contenedor.appendChild(tarjeta);
    });
}

// ==========================================
// ELIMINAR MEMBRESIA
// ==========================================

async function eliminarMembresia(id) {
    if (!confirm("¿Deseas eliminar esta membresía?")) {
        return false;
    }

    try {
        await solicitarAPIMembresias(
            `${API_MEMBRESIAS}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await cargarMembresiasDesdeAPI();

        alert("Membresía eliminada correctamente.");

        return true;

    } catch (error) {
        console.error(error);
        alert(error.message);
        return false;
    }
}

// ==========================================
// INICIALIZAR
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById(
        "formularioMembresia"
    );

    const fechaInput = document.getElementById(
        "fechaInicio"
    );

    if (!formulario || !fechaInput) return;

    crearSelectorMetodoPago();

    fechaInput.value = fechaLocal(new Date());

    cargarClientesMembresia();
    cargarMembresiasDesdeAPI();

    formulario.addEventListener(
        "submit",
        async evento => {

            evento.preventDefault();

            const boton = formulario.querySelector(
                'button[type="submit"]'
            );

            if (boton) boton.disabled = true;

            const clienteId = document.getElementById(
                "clienteMembresia"
            ).value;

            const plan = document.getElementById(
                "planMembresia"
            ).value;

            const inicio = fechaInput.value;

            const metodoPago = document.getElementById(
                "metodoPagoMembresia"
            ).value;

            try {
                const registrado = await registrarMembresia(
                    clienteId,
                    plan,
                    inicio,
                    metodoPago
                );

                if (registrado) {
                    formulario.reset();
                    fechaInput.value = fechaLocal(new Date());
                }

            } finally {
                if (boton) boton.disabled = false;
            }
        }
    );
});
