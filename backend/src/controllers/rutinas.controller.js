
"use strict";

// ==========================================
// GYMDATA - CONTROLADOR DE RUTINAS
// NODE.JS + MYSQL
// ==========================================

const { randomUUID } = require("node:crypto");
const { pool } = require("../config/database");

const dias = [
    "Lunes", "Martes", "Miércoles", "Jueves",
    "Viernes", "Sábado", "Domingo"
];

const objetivos = [
    "Hipertrofia",
    "Fuerza",
    "Resistencia",
    "Calistenia",
    "Acondicionamiento físico",
    "General"
];

// ==========================================
// CONSULTAR RUTINAS
// ==========================================

async function obtenerRutinas(req, res) {
    try {
        const [filas] = await pool.execute(
            `SELECT
                r.id,
                r.nombre,
                r.cliente_id AS clienteId,
                c.nombre AS nombreCliente,
                r.dia,
                r.objetivo,
                r.realizada,
                r.fecha_realizacion AS fechaRealizacion
             FROM rutinas r
             INNER JOIN clientes c
                ON c.id = r.cliente_id
             ORDER BY c.nombre, FIELD(
                r.dia,
                'Lunes','Martes','Miércoles',
                'Jueves','Viernes','Sábado','Domingo'
             )`
        );

        const [detalles] = await pool.execute(
            `SELECT
                rutina_id AS rutinaId,
                ejercicio_id AS id,
                nombre_ejercicio AS nombre,
                grupo_muscular AS grupo,
                series,
                repeticiones,
                descanso
             FROM rutina_ejercicios
             ORDER BY orden, id`
        );

        const porRutina = new Map();

        detalles.forEach(item => {
            if (!porRutina.has(item.rutinaId)) {
                porRutina.set(item.rutinaId, []);
            }

            porRutina.get(item.rutinaId).push({
                id: item.id,
                nombre: item.nombre,
                grupo: item.grupo,
                series: item.series,
                repeticiones: item.repeticiones,
                descanso: item.descanso
            });
        });

        const rutinas = filas.map(r => ({
            ...r,
            realizada: Boolean(r.realizada),
            ejercicios: porRutina.get(r.id) || []
        }));

        res.json({
            success: true,
            total: rutinas.length,
            data: rutinas
        });

    } catch (error) {
        console.error("Consultar rutinas:", error.code);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible consultar las rutinas."
        });
    }
}

// ==========================================
// REGISTRAR RUTINA
// ==========================================

async function crearRutina(req, res) {
    const {
        nombre,
        clienteId,
        dia,
        objetivo,
        ejercicios
    } = req.body || {};

    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        nombre.trim().length > 150 ||
        typeof clienteId !== "string" ||
        !clienteId.trim() ||
        !dias.includes(dia) ||
        !objetivos.includes(objetivo) ||
        !Array.isArray(ejercicios) ||
        ejercicios.length < 1 ||
        ejercicios.length > 40 ||
        ejercicios.some(id =>
            typeof id !== "string" || !id.trim()
        ) ||
        new Set(ejercicios).size !== ejercicios.length
    ) {
        return res.status(400).json({
            success: false,
            mensaje: "Revisa los datos y ejercicios de la rutina."
        });
    }

    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const [listaClientes] = await conexion.execute(
            "SELECT id FROM clientes WHERE id = ?",
            [clienteId]
        );

        if (!listaClientes.length) {
            await conexion.rollback();

            return res.status(404).json({
                success: false,
                mensaje: "El cliente no existe."
            });
        }

        // Tomar los ejercicios reales desde MySQL.
        // No confiar en series o nombres enviados
        // directamente por el navegador.
        const seleccionados = [];

        for (const id of ejercicios) {
            const [filas] = await conexion.execute(
                `SELECT id, nombre, grupo_muscular,
                        series, repeticiones, descanso
                 FROM ejercicios WHERE id = ?`,
                [id]
            );

            if (!filas.length) {
                await conexion.rollback();

                return res.status(400).json({
                    success: false,
                    mensaje: "Uno de los ejercicios ya no existe."
                });
            }

            seleccionados.push(filas[0]);
        }

        const rutinaId = randomUUID();

        await conexion.execute(
            `INSERT INTO rutinas
                (id, cliente_id, nombre, dia, objetivo)
             VALUES (?, ?, ?, ?, ?)`,
            [rutinaId, clienteId, nombre.trim(), dia, objetivo]
        );

        for (let i = 0; i < seleccionados.length; i++) {
            const ejercicio = seleccionados[i];

            await conexion.execute(
                `INSERT INTO rutina_ejercicios
                (
                    rutina_id, ejercicio_id,
                    nombre_ejercicio, grupo_muscular,
                    series, repeticiones, descanso, orden
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    rutinaId,
                    ejercicio.id,
                    ejercicio.nombre,
                    ejercicio.grupo_muscular,
                    ejercicio.series,
                    ejercicio.repeticiones,
                    ejercicio.descanso,
                    i + 1
                ]
            );
        }

        await conexion.commit();

        res.status(201).json({
            success: true,
            mensaje: "Rutina registrada correctamente.",
            data: { id: rutinaId }
        });

    } catch (error) {
        await conexion.rollback();

        console.error("Registrar rutina:", error.code);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible registrar la rutina."
        });

    } finally {
        conexion.release();
    }
}

// ==========================================
// CAMBIAR ESTADO
// ==========================================

async function cambiarEstadoRutina(req, res) {
    const { realizada } = req.body || {};

    if (typeof realizada !== "boolean") {
        return res.status(400).json({
            success: false,
            mensaje: "El estado debe ser verdadero o falso."
        });
    }

    try {
        const [resultado] = await pool.execute(
            `UPDATE rutinas
             SET realizada = ?,
                 fecha_realizacion =
                    CASE WHEN ? = 1 THEN NOW() ELSE NULL END
             WHERE id = ?`,
            [realizada, realizada, req.params.id]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({
                success: false,
                mensaje: "Rutina no encontrada."
            });
        }

        res.json({
            success: true,
            mensaje: "Estado actualizado correctamente."
        });

    } catch (error) {
        console.error("Cambiar estado:", error.code);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible cambiar el estado."
        });
    }
}

// ==========================================
// ELIMINAR RUTINA
// ==========================================

async function eliminarRutina(req, res) {
    try {
        const [resultado] = await pool.execute(
            "DELETE FROM rutinas WHERE id = ?",
            [req.params.id]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({
                success: false,
                mensaje: "Rutina no encontrada."
            });
        }

        res.json({
            success: true,
            mensaje: "Rutina eliminada correctamente."
        });

    } catch (error) {
        console.error("Eliminar rutina:", error.code);

        res.status(500).json({
            success: false,
            mensaje: "No fue posible eliminar la rutina."
        });
    }
}

module.exports = {
    obtenerRutinas,
    crearRutina,
    cambiarEstadoRutina,
    eliminarRutina
};
