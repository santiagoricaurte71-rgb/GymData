
"use strict";

// ==========================================
// GYMDATA - RUTAS DE SESIONES
// NODE.JS + EXPRESS
// ==========================================

const express = require("express");

const router = express.Router();

// Importar funciones del controlador
const {
    obtenerSesiones,
    crearSesion,
    eliminarSesion
} = require("../controllers/sesiones.controller");

// ==========================================
// CONSULTAR SESIONES
// GET /api/sesiones
// ==========================================

router.get("/", obtenerSesiones);

// ==========================================
// REGISTRAR ENTRENAMIENTO
// POST /api/sesiones
// ==========================================

router.post("/", crearSesion);

// ==========================================
// ELIMINAR ENTRENAMIENTO
// DELETE /api/sesiones/:id
// ==========================================

router.delete("/:id", eliminarSesion);

// ==========================================
// EXPORTAR RUTAS
// ==========================================

module.exports = router;
