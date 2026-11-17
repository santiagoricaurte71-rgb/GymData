
"use strict";

// GYMDATA - BIBLIOTECA DE EJERCICIOS

let ejercicios = [];

try {
    const datos = JSON.parse(
        localStorage.getItem("gymdata_ejercicios")
    );

    ejercicios = Array.isArray(datos) ? datos : [];
} catch (error) {
    console.error("Error al cargar ejercicios:", error);
}

// GUARDAR EJERCICIOS

function guardarEjercicios() {
    try {
        localStorage.setItem(
            "gymdata_ejercicios",
            JSON.stringify(ejercicios)
        );
        return true;
    } catch (error) {
        console.error(error);
        alert("No fue posible guardar los ejercicios.");
        return false;
    }
}

// VALIDACIONES

function enteroValido(valor, minimo, maximo) {
    const numero = Number(valor);

    return Number.isInteger(numero) &&
        numero >= minimo && numero <= maximo;
}

function imagenValida(url) {
    if (!url) return true;

    try {
        return new URL(url).protocol === "https:";
    } catch {
        return false;
    }
}

function generarIdEjercicio() {
    return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString() +
          Math.random().toString(16).slice(2);
}

// REGISTRAR O EDITAR

function guardarFormularioEjercicio() {
    const id = document.getElementById("ejercicioId").value;
    const nombre =
        document.getElementById("nombreEjercicio").value.trim();
    const grupo =
        document.getElementById("grupoMuscular").value;

    const series = Number(
        document.getElementById("seriesEjercicio").value
    );
    const repeticiones = Number(
        document.getElementById("repeticionesEjercicio").value
    );
    const descanso = Number(
        document.getElementById("descansoEjercicio").value
    );

    const imagen =
        document.getElementById("imagenEjercicio").value.trim();
    const descripcion =
        document.getElementById("descripcionEjercicio").value.trim();

    const grupos = [
        "Pecho", "Espalda", "Hombros", "Bíceps",
        "Tríceps", "Cuádriceps", "Femoral", "Glúteos",
        "Pantorrillas", "Abdomen", "Cuerpo completo", "Cardio"
    ];

    if (!nombre || !grupos.includes(grupo)) {
        alert("Completa el nombre y grupo muscular.");
        return;
    }

    if (
        !enteroValido(series, 1, 30) ||
        !enteroValido(repeticiones, 1, 200) ||
        !enteroValido(descanso, 0, 1800)
    ) {
        alert("Revisa series, repeticiones y descanso.");
        return;
    }

    if (!imagenValida(imagen)) {
        alert("La imagen debe tener una URL HTTPS válida.");
        return;
    }

    const nuevo = {
        id: id || generarIdEjercicio(),
        nombre,
        grupo,
        series,
        repeticiones,
        descanso,
        imagen,
        descripcion
    };

    const anteriores = [...ejercicios];

    if (id) {
        const posicion = ejercicios.findIndex(e => e.id === id);

        if (posicion === -1) {
            alert("No se encontró el ejercicio.");
            return;
        }

        ejercicios[posicion] = nuevo;
    } else {
        ejercicios.push(nuevo);
    }

    if (!guardarEjercicios()) {
        ejercicios = anteriores;
        return;
    }

    mostrarEjercicios();
    limpiarFormularioEjercicio();

    if (typeof cargarEjerciciosRutina === "function") {
        cargarEjerciciosRutina();
    }

    alert(id
        ? "Ejercicio actualizado correctamente."
        : "Ejercicio registrado correctamente."
    );
}

// MOSTRAR EJERCICIOS

function mostrarEjercicios() {
    const contenedor = document.getElementById("listaEjercicios");
    const total = document.getElementById("totalEjercicios");
    const cantidad = document.getElementById("cantidadEjercicios");

    if (total) total.textContent = ejercicios.length;

    if (cantidad) {
        cantidad.textContent = ejercicios.length === 1
            ? "1 ejercicio"
            : `${ejercicios.length} ejercicios`;
    }

    if (!contenedor) return;

    const busqueda = document.getElementById("buscarEjercicio")
        ?.value.trim().toLocaleLowerCase("es") || "";

    const filtro = document.getElementById("filtrarGrupoMuscular")
        ?.value || "";

    const filtrados = ejercicios.filter(e =>
        e.nombre.toLocaleLowerCase("es").includes(busqueda) &&
        (!filtro || e.grupo === filtro)
    );

    contenedor.replaceChildren();

    if (!filtrados.length) {
        const p = document.createElement("p");
        p.className = "mensaje-vacio";
        p.textContent = ejercicios.length
            ? "No se encontraron ejercicios."
            : "Todavía no hay ejercicios registrados.";
        contenedor.appendChild(p);
        return;
    }

    filtrados.forEach(e => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-cliente tarjeta-ejercicio";

        if (e.imagen && imagenValida(e.imagen)) {
            const imagen = document.createElement("img");
            imagen.src = e.imagen;
            imagen.alt = e.nombre;
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

        const titulo = document.createElement("h3");
        titulo.textContent = e.nombre;

        const grupo = document.createElement("span");
        grupo.className = "etiqueta-muscular";
        grupo.textContent = e.grupo;

        const detalle = document.createElement("p");
        detalle.textContent =
            `${e.series} series · ${e.repeticiones} repeticiones`;

        const descanso = document.createElement("p");
        descanso.textContent = `Descanso: ${e.descanso} segundos`;

        tarjeta.append(titulo, grupo, detalle, descanso);

        if (e.descripcion) {
            const descripcion = document.createElement("p");
            descripcion.textContent = e.descripcion;
            tarjeta.appendChild(descripcion);
        }

        const acciones = document.createElement("div");
        acciones.className = "acciones-tarjeta";

        const editar = document.createElement("button");
        editar.type = "button";
        editar.className = "boton-editar";
        editar.textContent = "Editar";
        editar.addEventListener("click", () => editarEjercicio(e.id));

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "boton-eliminar";
        eliminar.textContent = "Eliminar";
        eliminar.addEventListener("click", () => eliminarEjercicio(e.id));

        acciones.append(editar, eliminar);
        tarjeta.appendChild(acciones);
        contenedor.appendChild(tarjeta);
    });
}

// EDITAR

function editarEjercicio(id) {
    const e = ejercicios.find(item => item.id === id);
    if (!e) return;

    document.getElementById("ejercicioId").value = e.id;
    document.getElementById("nombreEjercicio").value = e.nombre;
    document.getElementById("grupoMuscular").value = e.grupo;
    document.getElementById("seriesEjercicio").value = e.series;
    document.getElementById("repeticionesEjercicio").value = e.repeticiones;
    document.getElementById("descansoEjercicio").value = e.descanso;
    document.getElementById("imagenEjercicio").value = e.imagen || "";
    document.getElementById("descripcionEjercicio").value =
        e.descripcion || "";

    document.getElementById("botonGuardarEjercicio").textContent =
        "GUARDAR CAMBIOS";

    document.getElementById("cancelarEdicionEjercicio")
        .classList.remove("oculto");

    document.getElementById("formularioEjercicio")
        .scrollIntoView({ behavior: "smooth" });
}

// ELIMINAR

function eliminarEjercicio(id) {
    if (!confirm("¿Eliminar este ejercicio?")) return;

    const anteriores = [...ejercicios];
    ejercicios = ejercicios.filter(e => e.id !== id);

    if (!guardarEjercicios()) {
        ejercicios = anteriores;
        return;
    }

    if (document.getElementById("ejercicioId").value === id) {
        limpiarFormularioEjercicio();
    }

    mostrarEjercicios();

    if (typeof cargarEjerciciosRutina === "function") {
        cargarEjerciciosRutina();
    }

    alert("Ejercicio eliminado correctamente.");
}

// LIMPIAR

function limpiarFormularioEjercicio() {
    const formulario = document.getElementById("formularioEjercicio");
    formulario.reset();

    document.getElementById("ejercicioId").value = "";
    document.getElementById("seriesEjercicio").value = 3;
    document.getElementById("repeticionesEjercicio").value = 12;
    document.getElementById("descansoEjercicio").value = 60;

    document.getElementById("botonGuardarEjercicio").textContent =
        "+ GUARDAR EJERCICIO";

    document.getElementById("cancelarEdicionEjercicio")
        .classList.add("oculto");
}

// INICIALIZAR

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formularioEjercicio");

    if (!formulario) return;

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        guardarFormularioEjercicio();
    });

    document.getElementById("buscarEjercicio")
        .addEventListener("input", mostrarEjercicios);

    document.getElementById("filtrarGrupoMuscular")
        .addEventListener("change", mostrarEjercicios);

    document.getElementById("cancelarEdicionEjercicio")
        .addEventListener("click", limpiarFormularioEjercicio);

    mostrarEjercicios();
});
