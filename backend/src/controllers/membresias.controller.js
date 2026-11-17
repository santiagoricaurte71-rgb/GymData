
"use strict";

// ==========================================
// GYMDATA - CONTROLADOR DE MEMBRESIAS
// ==========================================

const { randomUUID } = require("node:crypto");
const { pool } = require("../config/database");

// ==========================================
// MANEJO DE FECHAS
// ==========================================

function fechaHoy() {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function fechaValida(valor) {
    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
        return false;
    }

    const [anio, mes, dia] = valor.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));

    return (
        fecha.getUTCFullYear() === anio &&
        fecha.getUTCMonth() === mes - 1 &&
        fecha.getUTCDate() === dia
    );
}

function sumarDias(fechaInicio, dias) {
    const [anio, mes, dia] = fechaInicio.split("-").map(Number);

    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    fecha.setUTCDate(fecha.getUTCDate() + dias);

    return fecha.toISOString().slice(0, 10);
}

// ==========================================
// CONFIGURACION DE PLANES
// ==========================================

const planes = {
    Mensual: 30,
    Trimestral: 90,
    Semestral: 180
};

const metodosPago = ["Nequi", "Tarjeta"];

// ==========================================
// CONSULTAR MEMBRESIAS
// ==========================================

async function obtenerMembresias(req, res) {
    try {
        const [filas] = await pool.execute(
            `SELECT
                m.id,
                m.cliente_id AS clienteId,
                c.nombre AS nombreCliente,
                m.plan,
                DATE_FORMAT(
                    m.fecha_inicio, '%Y-%m-%d'
                ) AS fechaInicio,
                DATE_FORMAT(
                    m.fecha_vencimiento, '%Y-%m-%d'
                ) AS fechaVencimiento,
                m.metodo_pago AS metodoPago,
                CASE
                    WHEN m.fecha_vencimiento < CURDATE()
                        THEN 'Vencida'
                    WHEN m.fecha_inicio > CURDATE()
                        THEN 'Programada'
                    ELSE 'Activa'
                END AS estado
             FROM membresias m
             INNER JOIN clientes c
                ON c.id = m.cliente_id
             ORDER BY m.fecha_inicio DESC`
        );

        res.json({
            success: true,
            total: filas.length,
            data: filas
        });

    } catch (error) {
        console.error("Error al consultar membresías:", error);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible consultar las membresías."
        });
    }
}

// ==========================================
// REGISTRAR MEMBRESIA
// ==========================================

async function crearMembresia(req, res) {
    const {
        clienteId,
        plan,
        fechaInicio,
        metodoPago
    } = req.body || {};

    if (
        typeof clienteId !== "string" ||
        !clienteId.trim() ||
        !planes[plan] ||
        !fechaValida(fechaInicio) ||
        !metodosPago.includes(metodoPago)
    ) {
        return res.status(400).json({
            success: false,
            mensaje:
                "Completa correctamente cliente, plan, " +
                "fecha de inicio y método de pago."
        });
    }

    const vencimiento = sumarDias(
        fechaInicio,
        planes[plan]
    );

    let conexion;

    try {
        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        // Bloquear la fila del cliente para serializar
        // registros simultaneos de sus membresias.
        const [clientes] = await conexion.execute(
            "SELECT id FROM clientes WHERE id = ? FOR UPDATE",
            [clienteId]
        );

        if (!clientes.length) {
            await conexion.rollback();

            return res.status(404).json({
                success: false,
                mensaje: "El cliente seleccionado no existe."
            });
        }

        const [existentes] = await conexion.execute(
            `SELECT id
             FROM membresias
             WHERE cliente_id = ?
               AND fecha_vencimiento >= CURDATE()
             LIMIT 1`,
            [clienteId]
        );

        if (existentes.length) {
            await conexion.rollback();

            return res.status(409).json({
                success: false,
                mensaje:
                    "Este cliente ya tiene una membresía " +
                    "vigente o programada."
            });
        }

        const id = randomUUID();

        await conexion.execute(
            `INSERT INTO membresias
             (
                id,
                cliente_id,
                plan,
                fecha_inicio,
                fecha_vencimiento,
                metodo_pago
             )
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                id,
                clienteId,
                plan,
                fechaInicio,
                vencimiento,
                metodoPago
            ]
        );

        await conexion.commit();

        res.status(201).json({
            success: true,
            mensaje: "Membresía registrada correctamente.",
            data: {
                id,
                clienteId,
                plan,
                fechaInicio,
                fechaVencimiento: vencimiento,
                metodoPago
            }
        });

    } catch (error) {
        if (conexion) {
            await conexion.rollback();
        }

        console.error("Error al registrar membresía:", error);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible registrar la membresía."
        });

    } finally {
        if (conexion) conexion.release();
    }
}

// ==========================================
// ELIMINAR MEMBRESIA
// ==========================================

async function eliminarMembresia(req, res) {
    try {
        const [resultado] = await pool.execute(
            "DELETE FROM membresias WHERE id = ?",
            [req.params.id]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({
                success: false,
                mensaje: "Membresía no encontrada."
            });
        }

        res.json({
            success: true,
            mensaje: "Membresía eliminada correctamente."
        });

    } catch (error) {
        console.error("Error al eliminar membresía:", error);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible eliminar la membresía."
        });
    }
}

// ==========================================
// EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
    obtenerMembresias,
    crearMembresia,
    eliminarMembresia
};
