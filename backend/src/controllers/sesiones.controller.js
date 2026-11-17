
"use strict";

// ==========================================
// GYMDATA - CONTROLADOR DE SESIONES
// NODE.JS + EXPRESS + MYSQL
// ==========================================

const { randomUUID } = require("node:crypto");
const { pool } = require("../config/database");

// ==========================================
// VALIDAR FECHAS
// ==========================================

function fechaValida(valor) {
    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
        return false;
    }

    const [anio, mes, dia] = valor.split("-").map(Number);

    const fecha = new Date(
        Date.UTC(anio, mes - 1, dia)
    );

    return (
        fecha.getUTCFullYear() === anio &&
        fecha.getUTCMonth() === mes - 1 &&
        fecha.getUTCDate() === dia
    );
}

// ==========================================
// CONSULTAR TODAS LAS SESIONES
// ==========================================

async function obtenerSesiones(req, res) {
    try {
        const [filas] = await pool.execute(
            `SELECT
                s.id,
                s.rutina_id AS rutinaId,
                s.cliente_id AS clienteId,
                c.nombre AS nombreCliente,
                s.nombre_rutina AS nombreRutina,
                DATE_FORMAT(
                    s.fecha, '%Y-%m-%d'
                ) AS fecha,
                s.fecha_registro AS fechaRegistro
             FROM sesiones s
             INNER JOIN clientes c
                ON c.id = s.cliente_id
             ORDER BY s.fecha DESC, s.fecha_registro DESC`
        );

        res.json({
            success: true,
            total: filas.length,
            data: filas
        });

    } catch (error) {
        console.error(
            "Error al consultar sesiones:",
            error.code || error.message
        );

        res.status(500).json({
            success: false,
            mensaje: "No fue posible consultar las sesiones."
        });
    }
}

// ==========================================
// REGISTRAR SESION
// ==========================================

async function crearSesion(req, res) {
    const { rutinaId, fecha } = req.body || {};

    if (
        typeof rutinaId !== "string" ||
        !rutinaId.trim() ||
        !fechaValida(fecha)
    ) {
        return res.status(400).json({
            success: false,
            mensaje: "Selecciona una rutina y fecha válidas."
        });
    }

    // No permitir fechas futuras.
    const hoy = new Date()
        .toLocaleDateString("en-CA", {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });

    if (fecha > hoy) {
        return res.status(400).json({
            success: false,
            mensaje:
                "No puedes registrar una sesión en una fecha futura."
        });
    }

    let conexion;

    try {
        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        // Consultar la rutina y su cliente.
        const [filas] = await conexion.execute(
            `SELECT
                r.id,
                r.nombre,
                r.cliente_id AS clienteId,
                r.dia
             FROM rutinas r
             WHERE r.id = ?
             FOR UPDATE`,
            [rutinaId]
        );

        if (filas.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                success: false,
                mensaje: "La rutina seleccionada no existe."
            });
        }

        const rutina = filas[0];

        // Comprobar que la fecha corresponde
        // al día semanal asignado.
        const nombresDias = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado"
        ];

        const [anio, mes, dia] = fecha.split("-").map(Number);

        const numeroDia = new Date(
            Date.UTC(anio, mes - 1, dia)
        ).getUTCDay();

        if (nombresDias[numeroDia] !== rutina.dia) {
            await conexion.rollback();

            return res.status(400).json({
                success: false,
                mensaje:
                    "La fecha seleccionada no corresponde " +
                    "al día de entrenamiento de esta rutina."
            });
        }

        const id = randomUUID();

        await conexion.execute(
            `INSERT INTO sesiones
                (
                    id,
                    rutina_id,
                    cliente_id,
                    nombre_rutina,
                    fecha
                )
             VALUES (?, ?, ?, ?, ?)`,
            [
                id,
                rutina.id,
                rutina.clienteId,
                rutina.nombre,
                fecha
            ]
        );

        await conexion.commit();

        res.status(201).json({
            success: true,
            mensaje: "Entrenamiento registrado correctamente.",
            data: {
                id,
                rutinaId: rutina.id,
                clienteId: rutina.clienteId,
                nombreRutina: rutina.nombre,
                fecha
            }
        });

    } catch (error) {
        if (conexion) {
            await conexion.rollback();
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                mensaje:
                    "Esta rutina ya fue registrada " +
                    "en la fecha seleccionada."
            });
        }

        console.error(
            "Error al registrar sesión:",
            error.code || error.message
        );

        res.status(500).json({
            success: false,
            mensaje: "No fue posible registrar el entrenamiento."
        });

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
}

// ==========================================
// ELIMINAR SESION
// ==========================================

async function eliminarSesion(req, res) {
    try {
        const [resultado] = await pool.execute(
            "DELETE FROM sesiones WHERE id = ?",
            [req.params.id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: "Sesión no encontrada."
            });
        }

        res.json({
            success: true,
            mensaje: "Sesión eliminada correctamente."
        });

    } catch (error) {
        console.error(
            "Error al eliminar sesión:",
            error.code || error.message
        );

        res.status(500).json({
            success: false,
            mensaje: "No fue posible eliminar la sesión."
        });
    }
}

// ==========================================
// EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
    obtenerSesiones,
    crearSesion,
    eliminarSesion
};
