
"use strict";

// ==========================================
// GYMDATA - CONTROLADOR DE EJERCICIOS
// NODE.JS + MYSQL
// ==========================================

const { randomUUID } = require("node:crypto");

const { pool } = require("../config/database");

// ==========================================
// GRUPOS MUSCULARES PERMITIDOS
// ==========================================

const gruposPermitidos = [
    "Pecho",
    "Espalda",
    "Hombros",
    "Bíceps",
    "Tríceps",
    "Cuádriceps",
    "Femoral",
    "Glúteos",
    "Pantorrillas",
    "Abdomen",
    "Cuerpo completo",
    "Cardio"
];

// ==========================================
// VALIDACIONES
// ==========================================

function enteroValido(valor, minimo, maximo) {
    return (
        Number.isInteger(valor) &&
        valor >= minimo &&
        valor <= maximo
    );
}

function validarImagen(imagen) {
    if (!imagen) return true;

    try {
        const url = new URL(imagen);
        return url.protocol === "https:";
    } catch {
        return false;
    }
}

function validarEjercicio(datos) {
    if (!datos || typeof datos !== "object") {
        return "Los datos del ejercicio no son válidos.";
    }

    const {
        nombre,
        grupo,
        series,
        repeticiones,
        descanso,
        imagen,
        descripcion
    } = datos;

    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        nombre.trim().length > 150
    ) {
        return "Ingresa un nombre válido (máximo 150 caracteres).";
    }

    if (!gruposPermitidos.includes(grupo)) {
        return "Selecciona un grupo muscular válido.";
    }

    if (!enteroValido(series, 1, 30)) {
        return "Las series deben estar entre 1 y 30.";
    }

    if (!enteroValido(repeticiones, 1, 200)) {
        return "Las repeticiones deben estar entre 1 y 200.";
    }

    if (!enteroValido(descanso, 0, 1800)) {
        return "El descanso debe estar entre 0 y 1800 segundos.";
    }

    if (
        imagen != null &&
        typeof imagen !== "string"
    ) {
        return "La dirección de la imagen no es válida.";
    }

    if (imagen && !validarImagen(imagen)) {
        return "La imagen debe utilizar una URL HTTPS válida.";
    }

    if (
        descripcion != null &&
        typeof descripcion !== "string"
    ) {
        return "La descripción no es válida.";
    }

    if (
        typeof descripcion === "string" &&
        descripcion.length > 500
    ) {
        return "La descripción no puede superar 500 caracteres.";
    }

    return null;
}

// ==========================================
// CONSULTAR TODOS LOS EJERCICIOS
// ==========================================

async function obtenerEjercicios(req, res) {
    try {
        const [filas] = await pool.execute(
            `SELECT
                id,
                nombre,
                grupo_muscular AS grupo,
                series,
                repeticiones,
                descanso,
                imagen,
                descripcion
             FROM ejercicios
             ORDER BY nombre ASC`
        );

        res.json({
            success: true,
            total: filas.length,
            data: filas
        });

    } catch (error) {
        console.error("Error al consultar ejercicios:", error.code);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible consultar los ejercicios."
        });
    }
}

// ==========================================
// CONSULTAR EJERCICIO POR ID
// ==========================================

async function obtenerEjercicioPorId(req, res) {
    try {
        const [filas] = await pool.execute(
            `SELECT
                id,
                nombre,
                grupo_muscular AS grupo,
                series,
                repeticiones,
                descanso,
                imagen,
                descripcion
             FROM ejercicios
             WHERE id = ?`,
            [req.params.id]
        );

        if (filas.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: "Ejercicio no encontrado."
            });
        }

        res.json({
            success: true,
            data: filas[0]
        });

    } catch (error) {
        console.error("Error al consultar ejercicio:", error.code);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible consultar el ejercicio."
        });
    }
}

// ==========================================
// CREAR EJERCICIO
// ==========================================

async function crearEjercicio(req, res) {
    const datos = req.body;

    const error = validarEjercicio(datos);

    if (error) {
        return res.status(400).json({
            success: false,
            mensaje: error
        });
    }

    const id = randomUUID();

    const ejercicio = {
        id,
        nombre: datos.nombre.trim(),
        grupo: datos.grupo,
        series: datos.series,
        repeticiones: datos.repeticiones,
        descanso: datos.descanso,
        imagen: (datos.imagen || "").trim(),
        descripcion: (datos.descripcion || "").trim()
    };

    try {
        await pool.execute(
            `INSERT INTO ejercicios
             (
                id,
                nombre,
                grupo_muscular,
                series,
                repeticiones,
                descanso,
                imagen,
                descripcion
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ejercicio.id,
                ejercicio.nombre,
                ejercicio.grupo,
                ejercicio.series,
                ejercicio.repeticiones,
                ejercicio.descanso,
                ejercicio.imagen,
                ejercicio.descripcion
            ]
        );

        res.status(201).json({
            success: true,
            mensaje: "Ejercicio registrado correctamente.",
            data: ejercicio
        });

    } catch (error) {
        console.error("Error al crear ejercicio:", error.code);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible registrar el ejercicio."
        });
    }
}

// ==========================================
// ACTUALIZAR EJERCICIO
// ==========================================

async function actualizarEjercicio(req, res) {
    const datos = req.body;

    const error = validarEjercicio(datos);

    if (error) {
        return res.status(400).json({
            success: false,
            mensaje: error
        });
    }

    try {
        const [resultado] = await pool.execute(
            `UPDATE ejercicios
             SET
                nombre = ?,
                grupo_muscular = ?,
                series = ?,
                repeticiones = ?,
                descanso = ?,
                imagen = ?,
                descripcion = ?
             WHERE id = ?`,
            [
                datos.nombre.trim(),
                datos.grupo,
                datos.series,
                datos.repeticiones,
                datos.descanso,
                (datos.imagen || "").trim(),
                (datos.descripcion || "").trim(),
                req.params.id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: "Ejercicio no encontrado."
            });
        }

        res.json({
            success: true,
            mensaje: "Ejercicio actualizado correctamente."
        });

    } catch (error) {
        console.error("Error al actualizar ejercicio:", error.code);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible actualizar el ejercicio."
        });
    }
}

// ==========================================
// ELIMINAR EJERCICIO
// ==========================================

async function eliminarEjercicio(req, res) {
    try {
        const [resultado] = await pool.execute(
            "DELETE FROM ejercicios WHERE id = ?",
            [req.params.id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: "Ejercicio no encontrado."
            });
        }

        res.json({
            success: true,
            mensaje: "Ejercicio eliminado correctamente."
        });

    } catch (error) {
        console.error("Error al eliminar ejercicio:", error.code);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible eliminar el ejercicio."
        });
    }
}

// ==========================================
// EXPORTAR FUNCIONES
// ==========================================

module.exports = {
    obtenerEjercicios,
    obtenerEjercicioPorId,
    crearEjercicio,
    actualizarEjercicio,
    eliminarEjercicio
};
