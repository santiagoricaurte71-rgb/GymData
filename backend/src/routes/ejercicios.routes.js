
"use strict";

// ==========================================
// GYMDATA - RUTAS DE EJERCICIOS
// ==========================================

const express = require("express");

const router = express.Router();

const {
    obtenerEjercicios,
    obtenerEjercicioPorId,
    crearEjercicio,
    actualizarEjercicio,
    eliminarEjercicio
} = require("../controllers/ejercicios.controller");

// Consultar todos los ejercicios
router.get("/", obtenerEjercicios);

// Consultar un ejercicio por ID
router.get("/:id", obtenerEjercicioPorId);

// Registrar ejercicio
router.post("/", crearEjercicio);

// Actualizar ejercicio
router.put("/:id", actualizarEjercicio);

// Eliminar ejercicio
router.delete("/:id", eliminarEjercicio);

module.exports = router;
