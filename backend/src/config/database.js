
"use strict";

// ==========================================
// GYMDATA - CONEXION MYSQL
// ==========================================

const mysql = require("mysql2/promise");
const path = require("path");

// Cargar variables de entorno
require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

// Crear pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==========================================
// PROBAR CONEXION
// ==========================================

async function probarConexion() {
    let conexion;

    try {
        conexion = await pool.getConnection();

        const [filas] = await conexion.query(
            "SELECT DATABASE() AS baseDatos, VERSION() AS version"
        );

        console.log("==================================");
        console.log(" GYMDATA - MYSQL CONECTADO");
        console.log("==================================");
        console.log("Base de datos:", filas[0].baseDatos);
        console.log("Version MySQL:", filas[0].version);
        console.log("==================================");

        return true;

    } catch (error) {
        console.error(
            "Error al conectar con MySQL:",
            error.code || error.message
        );

        return false;

    } finally {
        if (conexion) {
            conexion.release();
        }
    }
}

module.exports = {
    pool,
    probarConexion
};
