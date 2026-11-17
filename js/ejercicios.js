
"use strict";

// ==========================================
// GYMDATA - BIBLIOTECA DE EJERCICIOS
// CONEXION CON MYSQL
// ==========================================

let ejercicios = [];

const API_EJERCICIOS = "/api/ejercicios";

// ==========================================
// VALIDACIONES
// ==========================================

function enteroValido(valor, minimo, maximo) {
    const numero = Number(valor);

    return (
        Number.isInteger(numero) &&
        numero >= minimo &&
        numero <= maximo
    );
}

function imagenValida(url) {
    if (!url) return true;

    try {
        const direccion = new URL(url);

        return direccion.protocol === "https:";

    } catch (error) {
        return false;
    }
}

// ==========================================
// CONSULTAR LA API
// ==========================================

async function solicitarAPIEjercicios(
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
            resultado.mensaje ||
            "No fue posible completar la operación."
        );
    }

    return resultado;
}

// ==========================================
// ACTUALIZAR SELECTOR DE RUTINAS
// ==========================================

function actualizarSelectorRutinas() {
    if (typeof cargarEjerciciosRutina === "function") {
        cargarEjerciciosRutina();
    }
}

// ==========================================
// CARGAR EJERCICIOS DESDE MYSQL
// ==========================================

async function cargarEjerciciosDesdeAPI() {
    try {
        const resultado = await solicitarAPIEjercicios(
            API_EJERCICIOS
        );

        if (!Array.isArray(resultado.data)) {
            throw new Error(
                "El servidor no devolvió una lista válida."
            );
        }

        ejercicios = resultado.data;

        mostrarEjercicios();
        actualizarSelectorRutinas();

        return true;

    } catch (error) {
        console.error(
            "Error al consultar ejercicios:",
            error
        );

        const contenedor = document.getElementById(
            "listaEjercicios"
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
// LEER EL FORMULARIO
// ==========================================

function obtenerDatosFormularioEjercicio() {
    const id = document.getElementById(
        "ejercicioId"
    ).value;

    const nombre = document.getElementById(
        "nombreEjercicio"
    ).value.trim();

    const grupo = document.getElementById(
        "grupoMuscular"
    ).value;

    const seriesTexto = document.getElementById(
        "seriesEjercicio"
    ).value;

    const repeticionesTexto = document.getElementById(
        "repeticionesEjercicio"
    ).value;

    const descansoTexto = document.getElementById(
        "descansoEjercicio"
    ).value;

    const imagen = document.getElementById(
        "imagenEjercicio"
    ).value.trim();

    const descripcion = document.getElementById(
        "descripcionEjercicio"
    ).value.trim();

    if (
        !nombre ||
        nombre.length > 100 ||
        !grupo
    ) {
        throw new Error(
            "Ingresa el nombre y grupo muscular."
        );
    }

    if (
        seriesTexto === "" ||
        repeticionesTexto === "" ||
        descansoTexto === "" ||
        !enteroValido(seriesTexto, 1, 30) ||
        !enteroValido(repeticionesTexto, 1, 200) ||
        !enteroValido(descansoTexto, 0, 1800)
    ) {
        throw new Error(
            "Revisa las series, repeticiones y descanso."
        );
    }

    if (!imagenValida(imagen)) {
        throw new Error(
            "La imagen debe tener una URL HTTPS válida."
        );
    }

    return {
        id,
        nombre,
        grupo,
        series: Number(seriesTexto),
        repeticiones: Number(repeticionesTexto),
        descanso: Number(descansoTexto),
        imagen,
        descripcion
    };
}

// ==========================================
// GUARDAR O ACTUALIZAR EJERCICIO
// ==========================================

async function guardarFormularioEjercicio() {
    let datos;

    try {
        datos = obtenerDatosFormularioEjercicio();

    } catch (error) {
        alert(error.message);
        return false;
    }

    const editando = Boolean(datos.id);

    const url = editando
        ? `${API_EJERCICIOS}/${encodeURIComponent(datos.id)}`
        : API_EJERCICIOS;

    const metodo = editando ? "PUT" : "POST";

    try {
        const resultado = await solicitarAPIEjercicios(
            url,
            {
                method: metodo,
                body: JSON.stringify({
                    nombre: datos.nombre,
                    grupo: datos.grupo,
                    series: datos.series,
                    repeticiones: datos.repeticiones,
                    descanso: datos.descanso,
                    imagen: datos.imagen,
                    descripcion: datos.descripcion
                })
            }
        );

        const actualizado = await cargarEjerciciosDesdeAPI();

        if (!actualizado) {
            alert(
                "El cambio se guardó en MySQL, pero " +
                "no fue posible actualizar la lista. " +
                "Recarga la página."
            );
            return true;
        }

        limpiarFormularioEjercicio();

        alert(
            resultado.mensaje ||
            "Ejercicio guardado correctamente."
        );

        return true;

    } catch (error) {
        console.error(error);
        alert(error.message);
        return false;
    }
}

// ==========================================
// MOSTRAR EJERCICIOS
// ==========================================

function mostrarEjercicios() {
    const contenedor = document.getElementById(
        "listaEjercicios"
    );

    const contador = document.getElementById(
        "totalEjercicios"
    );

    const cantidad = document.getElementById(
        "cantidadEjercicios"
    );

    if (contador) {
        contador.textContent = ejercicios.length;
    }

    if (cantidad) {
        cantidad.textContent = ejercicios.length === 1
            ? "1 ejercicio"
            : `${ejercicios.length} ejercicios`;
    }

    if (!contenedor) return;

    const busqueda = document.getElementById(
        "buscarEjercicio"
    )?.value.trim().toLocaleLowerCase("es") || "";

    const filtro = document.getElementById(
        "filtrarGrupoMuscular"
    )?.value || "";

    const filtrados = ejercicios.filter(item => {
        const coincideNombre = item.nombre
            .toLocaleLowerCase("es")
            .includes(busqueda);

        const coincideGrupo =
            !filtro || item.grupo === filtro;

        return coincideNombre && coincideGrupo;
    });

    contenedor.replaceChildren();

    if (filtrados.length === 0) {
        const mensaje = document.createElement("p");

        mensaje.className = "mensaje-vacio";

        mensaje.textContent = ejercicios.length === 0
            ? "No hay ejercicios registrados en MySQL."
            : "No se encontraron ejercicios.";

        contenedor.appendChild(mensaje);
        return;
    }

    filtrados.forEach(item => {
        const tarjeta = document.createElement("article");

        tarjeta.className =
            "tarjeta-cliente tarjeta-ejercicio";

        // Imagen
        if (item.imagen && imagenValida(item.imagen)) {
            const imagen = document.createElement("img");

            imagen.src = item.imagen;
            imagen.alt = "Ejercicio: " + item.nombre;
            imagen.loading = "lazy";
            imagen.referrerPolicy = "no-referrer";
            imagen.className = "imagen-ejercicio";

            tarjeta.appendChild(imagen);

        } else {
            const placeholder = document.createElement("div");

            placeholder.className = "imagen-placeholder";
            placeholder.textContent = "GYMDATA · FITNESS";

            tarjeta.appendChild(placeholder);
        }

        // Nombre
        const titulo = document.createElement("h3");
        titulo.textContent = item.nombre;

        // Grupo muscular
        const grupo = document.createElement("span");
        grupo.className = "etiqueta-muscular";
        grupo.textContent = item.grupo;

        // Series y repeticiones
        const detalle = document.createElement("p");
        detalle.textContent =
            `${item.series} series · ` +
            `${item.repeticiones} repeticiones`;

        // Descanso
        const descanso = document.createElement("p");
        descanso.textContent =
            `Descanso: ${item.descanso} segundos`;

        tarjeta.append(
            titulo,
            grupo,
            detalle,
            descanso
        );

        // Indicaciones
        if (item.descripcion) {
            const descripcion = document.createElement("p");
            descripcion.textContent = item.descripcion;

            tarjeta.appendChild(descripcion);
        }

        // Botones
        const acciones = document.createElement("div");
        acciones.className = "acciones-tarjeta";

        const editar = document.createElement("button");
        editar.type = "button";
        editar.className = "boton-editar";
        editar.textContent = "Editar";

        editar.addEventListener("click", () => {
            editarEjercicio(item.id);
        });

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "boton-eliminar";
        eliminar.textContent = "Eliminar";

        eliminar.addEventListener("click", async () => {
            eliminar.disabled = true;

            try {
                await eliminarEjercicio(item.id);
            } finally {
                eliminar.disabled = false;
            }
        });

        acciones.append(editar, eliminar);

        tarjeta.appendChild(acciones);

        contenedor.appendChild(tarjeta);
    });
}

// ==========================================
// EDITAR EJERCICIO
// ==========================================

function editarEjercicio(id) {
    const item = ejercicios.find(
        ejercicio => ejercicio.id === id
    );

    if (!item) {
        alert("Ejercicio no encontrado.");
        return;
    }

    document.getElementById("ejercicioId").value =
        item.id;

    document.getElementById("nombreEjercicio").value =
        item.nombre;

    document.getElementById("grupoMuscular").value =
        item.grupo;

    document.getElementById("seriesEjercicio").value =
        item.series;

    document.getElementById("repeticionesEjercicio").value =
        item.repeticiones;

    document.getElementById("descansoEjercicio").value =
        item.descanso;

    document.getElementById("imagenEjercicio").value =
        item.imagen || "";

    document.getElementById("descripcionEjercicio").value =
        item.descripcion || "";

    document.getElementById(
        "botonGuardarEjercicio"
    ).textContent = "GUARDAR CAMBIOS";

    document.getElementById(
        "cancelarEdicionEjercicio"
    ).classList.remove("oculto");

    document.getElementById(
        "formularioEjercicio"
    ).scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ==========================================
// ELIMINAR EJERCICIO
// ==========================================

async function eliminarEjercicio(id) {
    // Las rutinas locales conservan copias
    // de sus ejercicios, pero advertimos
    // antes de eliminar del catalogo.

    const utilizadoEnRutinas =
        typeof rutinas !== "undefined" &&
        rutinas.some(rutina =>
            Array.isArray(rutina.ejercicios) &&
            rutina.ejercicios.some(e =>
                String(e.id) === String(id)
            )
        );

    const mensaje = utilizadoEnRutinas
        ? "Este ejercicio aparece en rutinas locales. " +
          "Las rutinas conservarán su información anterior. " +
          "¿Deseas eliminarlo de la biblioteca?"
        : "¿Deseas eliminar este ejercicio?";

    if (!confirm(mensaje)) {
        return false;
    }

    try {
        const resultado = await solicitarAPIEjercicios(
            `${API_EJERCICIOS}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        if (
            document.getElementById("ejercicioId").value === id
        ) {
            limpiarFormularioEjercicio();
        }

        const actualizado = await cargarEjerciciosDesdeAPI();

        alert(
            actualizado
                ? resultado.mensaje
                : "Ejercicio eliminado. Recarga la página " +
                  "para actualizar la biblioteca."
        );

        return true;

    } catch (error) {
        console.error(error);
        alert(error.message);
        return false;
    }
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================

function limpiarFormularioEjercicio() {
    const formulario = document.getElementById(
        "formularioEjercicio"
    );

    if (!formulario) return;

    formulario.reset();

    document.getElementById("ejercicioId").value = "";

    document.getElementById("seriesEjercicio").value = 3;

    document.getElementById(
        "repeticionesEjercicio"
    ).value = 12;

    document.getElementById("descansoEjercicio").value = 60;

    document.getElementById(
        "botonGuardarEjercicio"
    ).textContent = "+ GUARDAR EJERCICIO";

    document.getElementById(
        "cancelarEdicionEjercicio"
    ).classList.add("oculto");
}

// ==========================================
// INICIALIZAR
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById(
        "formularioEjercicio"
    );

    if (!formulario) return;

    formulario.addEventListener(
        "submit",
        async evento => {
            evento.preventDefault();

            const boton = document.getElementById(
                "botonGuardarEjercicio"
            );

            boton.disabled = true;

            try {
                await guardarFormularioEjercicio();
            } finally {
                boton.disabled = false;
            }
        }
    );

    document.getElementById(
        "buscarEjercicio"
    ).addEventListener(
        "input",
        mostrarEjercicios
    );

    document.getElementById(
        "filtrarGrupoMuscular"
    ).addEventListener(
        "change",
        mostrarEjercicios
    );

    document.getElementById(
        "cancelarEdicionEjercicio"
    ).addEventListener(
        "click",
        limpiarFormularioEjercicio
    );

    cargarEjerciciosDesdeAPI();
});
