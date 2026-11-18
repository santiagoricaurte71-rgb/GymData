"use strict";

// ==========================================
// GYMDATA - SESIONES PERSISTENTES MYSQL
// ==========================================

const session = require("express-session");
const { pool } = require("../config/database");

const DURACION_PREDETERMINADA = 8 * 60 * 60 * 1000;

function obtenerVencimiento(datos) {
    const cookie = datos && datos.cookie;

    if (cookie && cookie.expires) {
        const fecha = new Date(cookie.expires).getTime();

        if (Number.isFinite(fecha)) {
            return fecha;
        }
    }

    if (cookie && Number.isFinite(cookie.originalMaxAge)) {
        return Date.now() + cookie.originalMaxAge;
    }

    return Date.now() + DURACION_PREDETERMINADA;
}

class GymDataSessionStore extends session.Store {

    constructor() {
        super();
        this.pool = pool;
    }

    // Obtener sesion
    get(id, callback) {
        this.pool.execute(
            `SELECT session_data
             FROM gym_sessions
             WHERE session_id = ?
             AND expires_at > ?
             LIMIT 1`,
            [id, Date.now()]
        ).then(([filas]) => {
            if (!filas.length) {
                return callback(null, null);
            }

            try {
                const datos = JSON.parse(filas[0].session_data);
                callback(null, datos);
            } catch (error) {
                callback(error);
            }
        }).catch(error => callback(error));
    }

    // Guardar sesion
    set(id, datos, callback) {
        let contenido;

        try {
            contenido = JSON.stringify(datos);
        } catch (error) {
            return callback(error);
        }

        const vencimiento = obtenerVencimiento(datos);

        this.pool.execute(
            `INSERT INTO gym_sessions
                (session_id, session_data, expires_at)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                session_data = VALUES(session_data),
                expires_at = VALUES(expires_at)`,
            [id, contenido, vencimiento]
        ).then(() => callback(null))
         .catch(error => callback(error));
    }

    // Eliminar sesion
    destroy(id, callback) {
        this.pool.execute(
            `DELETE FROM gym_sessions
             WHERE session_id = ?`,
            [id]
        ).then(() => callback(null))
         .catch(error => callback(error));
    }

    // Renovar vencimiento
    touch(id, datos, callback) {
        const vencimiento = obtenerVencimiento(datos);

        this.pool.execute(
            `UPDATE gym_sessions
             SET expires_at = ?
             WHERE session_id = ?`,
            [vencimiento, id]
        ).then(() => callback(null))
         .catch(error => callback(error));
    }

    // Limpiar sesiones vencidas
    async limpiarVencidas() {
        const [resultado] = await this.pool.execute(
            `DELETE FROM gym_sessions
             WHERE expires_at <= ?`,
            [Date.now()]
        );

        return resultado.affectedRows;
    }
}

module.exports = GymDataSessionStore;
