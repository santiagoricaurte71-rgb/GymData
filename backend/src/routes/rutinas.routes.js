
"use strict";

// ==========================================
// GYMDATA - RUTAS DE RUTINAS
// ==========================================

const express = require("express");
const router = express.Router();

const {
    obtenerRutinas,
    crearRutina,
    cambiarEstadoRutina,
    eliminarRutina
} = require("../controllers/rutinas.controller");

router.get("/", obtenerRutinas);

router.post("/", crearRutina);

router.patch("/:id/estado", cambiarEstadoRutina);

router.delete("/:id", eliminarRutina);

module.exports = router;
