
"use strict";

// ==========================================
// GYMDATA - CONTROLADOR DE CLIENTES
// ==========================================

const { randomUUID } = require("node:crypto");

const { pool } = require("../config/database");

// ==========================================
// VALIDAR DATOS DEL CLIENTE
// ==========================================

function validarCliente(datos) {
    if (
        !datos ||
        typeof datos.nombre !== "string" ||
        typeof datos.documento !== "string" ||
        typeof datos.telefono !== "string"
    ) {
        return "Nombre, documento y teléfono son obligatorios.";
    }

    const nombre = datos.nombre.trim();
    const documento = datos.documento.trim();
    const telefono = datos.telefono.trim();

    if (!nombre || !documento || !telefono) {
        return "Todos los campos son obligatorios.";
    }

    if (
        nombre.length > 150 ||
        documento.length > 30 ||
        telefono.length > 30
    ) {
        return "Uno de los campos supera la longitud permitida.";
    }

    return null;
}

// ==========================================
// CONSULTAR TODOS LOS CLIENTES
// ==========================================

async function obtenerClientes(req, res) {
    try {
        const [clientes] = await pool.execute(
            `SELECT
                id,
                nombre,
                documento,
                telefono,
                fecha_registro AS fechaRegistro
             FROM clientes
             ORDER BY nombre ASC`
        );

        res.json({
            success: true,
            total: clientes.length,
            data: clientes
        });

    } catch (error) {
        console.error("Error al consultar clientes:", error);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible consultar los clientes."
        });
    }
}

// ==========================================
// CONSULTAR CLIENTE POR ID
// ==========================================

async function obtenerClientePorId(req, res) {
    try {
        const [filas] = await pool.execute(
            `SELECT
                id,
                nombre,
                documento,
                telefono,
                fecha_registro AS fechaRegistro
             FROM clientes
             WHERE id = ?`,
            [req.params.id]
        );

        if (filas.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: "Cliente no encontrado."
            });
        }

        res.json({
            success: true,
            data: filas[0]
        });

    } catch (error) {
        console.error("Error al consultar cliente:", error);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible consultar el cliente."
        });
    }
}

// ==========================================
// CREAR CLIENTE
// ==========================================

async function crearCliente(req, res) {
    const errorValidacion = validarCliente(req.body);

    if (errorValidacion) {
        return res.status(400).json({
            success: false,
            mensaje: errorValidacion
        });
    }

    const id = randomUUID();

    const nombre = req.body.nombre.trim();
    const documento = req.body.documento.trim();
    const telefono = req.body.telefono.trim();

    try {
        await pool.execute(
            `INSERT INTO clientes
                (id, nombre, documento, telefono)
             VALUES (?, ?, ?, ?)`,
            [id, nombre, documento, telefono]
        );

        res.status(201).json({
            success: true,
            mensaje: "Cliente registrado correctamente.",
            data: {
                id,
                nombre,
                documento,
                telefono
            }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                mensaje: "Ya existe un cliente con ese documento."
            });
        }

        console.error("Error al crear cliente:", error);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible registrar el cliente."
        });
    }
}

// ==========================================
// ACTUALIZAR CLIENTE
// ==========================================

async function actualizarCliente(req, res) {
    const errorValidacion = validarCliente(req.body);

    if (errorValidacion) {
        return res.status(400).json({
            success: false,
            mensaje: errorValidacion
        });
    }

    try {
        const [resultado] = await pool.execute(
            `UPDATE clientes
             SET nombre = ?,
                 documento = ?,
                 telefono = ?
             WHERE id = ?`,
            [
                req.body.nombre.trim(),
                req.body.documento.trim(),
                req.body.telefono.trim(),
                req.params.id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: "Cliente no encontrado."
            });
        }

        res.json({
            success: true,
            mensaje: "Cliente actualizado correctamente."
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                mensaje: "El documento ya pertenece a otro cliente."
            });
        }

        console.error("Error al actualizar cliente:", error);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible actualizar el cliente."
        });
    }
}

// ==========================================
// ELIMINAR CLIENTE
// ==========================================

async function eliminarCliente(req, res) {
    try {
        const [resultado] = await pool.execute(
            "DELETE FROM clientes WHERE id = ?",
            [req.params.id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: "Cliente no encontrado."
            });
        }

        res.json({
            success: true,
            mensaje: "Cliente eliminado correctamente."
        });

    } catch (error) {
        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.code === "ER_ROW_IS_REFERENCED"
        ) {
            return res.status(409).json({
                success: false,
                mensaje:
                    "No se puede eliminar el cliente porque " +
                    "tiene membresías, rutinas o sesiones asociadas."
            });
        }

        console.error("Error al eliminar cliente:", error);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible eliminar el cliente."
        });
    }
}

// ==========================================
// EXPORTAR FUNCIONES
// ==========================================

module.exports = {
    obtenerClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    eliminarCliente
};
