
"use strict";

// ==========================================
// GYMDATA - SERVIDOR PRINCIPAL
// NODE.JS + EXPRESS + MYSQL + SEGURIDAD
// ==========================================

const express = require("express");
const path = require("path");
const session = require("express-session");
const GymDataSessionStore = require("./src/auth/sessionStore");

// ==========================================
// VARIABLES DE ENTORNO
// ==========================================

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

// ==========================================
// MYSQL
// ==========================================

const { pool, probarConexion } = require(
    "./src/config/database"
);

// ==========================================
// AUTENTICACION
// ==========================================

const {
    limitarIntentos,
    iniciarSesion,
    comprobarSesion,
    cerrarSesion,
    requiereAutenticacion
} = require("./src/auth/auth");

// ==========================================
// RUTAS DE GYMDATA
// ==========================================

const clientesRoutes = require(
    "./src/routes/clientes.routes"
);

const membresiasRoutes = require(
    "./src/routes/membresias.routes"
);

const ejerciciosRoutes = require(
    "./src/routes/ejercicios.routes"
);

const rutinasRoutes = require(
    "./src/routes/rutinas.routes"
);

const sesionesRoutes = require(
    "./src/routes/sesiones.routes"
);

// ==========================================
// INICIALIZAR EXPRESS
// ==========================================

const app = express();

const PORT = Number(process.env.PORT || 3000);

const FRONTEND = path.resolve(__dirname, "..");

const ES_PRODUCCION =
    process.env.NODE_ENV === "production";

// ==========================================
// VERIFICAR CONFIGURACION
// ==========================================

if (
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32
) {
    console.error(
        "ERROR: SESSION_SECRET no esta configurado."
    );

    process.exit(1);
}

if (
    !process.env.ADMIN_USER ||
    !process.env.ADMIN_PASSWORD_HASH
) {
    console.error(
        "ERROR: Administrador no configurado."
    );

    process.exit(1);
}


// ==========================================
// CONFIGURACION GENERAL
// ==========================================

app.disable("x-powered-by");
app.set("trust proxy", "loopback");

app.use(express.json({
    limit: "100kb"
}));

// ==========================================
// SESIONES ADMINISTRATIVAS
// ==========================================

app.use(session({
    store: new GymDataSessionStore(),
    name: "gymdata.sid",

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    rolling: true,

    cookie: {
        httpOnly: true,
        secure: ES_PRODUCCION,
        sameSite: "strict",
        maxAge: 8 * 60 * 60 * 1000
    }
}));

// ==========================================
// RUTAS DE AUTENTICACION
// ==========================================

// Iniciar sesion
app.post(
    "/api/auth/login",
    limitarIntentos,
    iniciarSesion
);

// Consultar sesion
app.get(
    "/api/auth/session",
    comprobarSesion
);

// Cerrar sesion
app.post(
    "/api/auth/logout",
    requiereAutenticacion,
    cerrarSesion
);

// ==========================================
// PROTEGER TODAS LAS API DE GYMDATA
// ==========================================

app.use(
    "/api/clientes",
    requiereAutenticacion,
    clientesRoutes
);

app.use(
    "/api/membresias",
    requiereAutenticacion,
    membresiasRoutes
);

app.use(
    "/api/ejercicios",
    requiereAutenticacion,
    ejerciciosRoutes
);

app.use(
    "/api/rutinas",
    requiereAutenticacion,
    rutinasRoutes
);

app.use(
    "/api/sesiones",
    requiereAutenticacion,
    sesionesRoutes
);

// ==========================================
// COMPROBAR ESTADO DEL SERVIDOR
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
// API NO ENCONTRADA
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
        console.log("             GYMDATA");
        console.log("================================");

        console.log("MySQL: Conectado");
        console.log("Autenticacion: Activada");
        console.log("API: Protegidas");

        console.log(
            `Pagina: http://localhost:${PORT}/`
        );

        console.log("Login: /api/auth/login");
        console.log("Sesion: /api/auth/session");
        console.log("Logout: /api/auth/logout");

        console.log("================================");
    });
}

iniciarServidor();
