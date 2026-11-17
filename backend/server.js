
"use strict";

// ==========================================
// GYMDATA - SERVIDOR PRINCIPAL
// NODE.JS + EXPRESS + MYSQL
// ==========================================

const express = require("express");
const path = require("path");

// ==========================================
// VARIABLES DE ENTORNO
// ==========================================

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

// ==========================================
// CONEXION MYSQL
// ==========================================

const { pool, probarConexion } = require(
    "./src/config/database"
);

// ==========================================
// IMPORTAR RUTAS
// ==========================================

// Clientes
const clientesRoutes = require(
    "./src/routes/clientes.routes"
);

// Membresias
const membresiasRoutes = require(
    "./src/routes/membresias.routes"
);

// Ejercicios
const ejerciciosRoutes = require(
    "./src/routes/ejercicios.routes"
);

// Rutinas
const rutinasRoutes = require(
    "./src/routes/rutinas.routes"
);

// Sesiones de entrenamiento
const sesionesRoutes = require(
    "./src/routes/sesiones.routes"
);

// ==========================================
// INICIALIZAR EXPRESS
// ==========================================

const app = express();

const PORT = Number(process.env.PORT || 3000);

const FRONTEND = path.resolve(__dirname, "..");

// ==========================================
// CONFIGURACION GENERAL
// ==========================================

app.disable("x-powered-by");

app.use(express.json({
    limit: "100kb"
}));

// ==========================================
// API DE GYMDATA
// ==========================================

app.use("/api/clientes", clientesRoutes);

app.use("/api/membresias", membresiasRoutes);

app.use("/api/ejercicios", ejerciciosRoutes);

app.use("/api/rutinas", rutinasRoutes);

app.use("/api/sesiones", sesionesRoutes);

// ==========================================
// VERIFICAR ESTADO DEL SERVIDOR
// ==========================================

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            estado: "OK",
            servicio: "GymData API",
            baseDatos: "Conectada",
            fecha: new Date().toISOString()
        });

    } catch (error) {
        console.error(
            "Error al comprobar MySQL:",
            error.code || error.message
        );

        res.status(503).json({
            estado: "ERROR",
            servicio: "GymData API",
            baseDatos: "No disponible"
        });
    }
});

// ==========================================
// RUTAS API NO ENCONTRADAS
// ==========================================

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        mensaje: "Ruta API no encontrada."
    });
});

// ==========================================
// ARCHIVOS DEL FRONTEND
// ==========================================

// Servir solo los archivos publicos.
// Nunca exponer backend ni .env.

app.use(
    "/css",
    express.static(path.join(FRONTEND, "css"))
);

app.use(
    "/js",
    express.static(path.join(FRONTEND, "js"))
);

app.use(
    "/img",
    express.static(path.join(FRONTEND, "img"))
);

// ==========================================
// PAGINA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(FRONTEND, "index.html")
    );
});

// ==========================================
// PAGINAS NO ENCONTRADAS
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        mensaje: "Pagina no encontrada."
    });
});

// ==========================================
// MANEJO DE ERRORES
// ==========================================

app.use((error, req, res, next) => {
    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        return res.status(400).json({
            success: false,
            mensaje: "JSON no valido."
        });
    }

    console.error(
        "Error interno del servidor:",
        error.message
    );

    res.status(500).json({
        success: false,
        mensaje: "Error interno del servidor."
    });
});

// ==========================================
// INICIAR GYMDATA
// ==========================================

async function iniciarServidor() {
    const conectado = await probarConexion();

    if (!conectado) {
        console.error(
            "No fue posible conectar GymData con MySQL."
        );

        await pool.end();

        process.exitCode = 1;
        return;
    }

    app.listen(PORT, "127.0.0.1", () => {

        console.log("================================");
        console.log("            GYMDATA");
        console.log("================================");

        console.log("MySQL: Conectado");

        console.log(
            `Pagina: http://localhost:${PORT}/`
        );

        console.log("API Clientes: /api/clientes");
        console.log("API Membresias: /api/membresias");
        console.log("API Ejercicios: /api/ejercicios");
        console.log("API Rutinas: /api/rutinas");
        console.log("API Sesiones: /api/sesiones");

        console.log("================================");
    });
}

iniciarServidor();
