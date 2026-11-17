
"use strict";

// ==========================================
// GYMDATA - RUTAS DE MEMBRESIAS
// ==========================================

const express = require("express");
const router = express.Router();

const {
    obtenerMembresias,
    crearMembresia,
    eliminarMembresia
} = require("../controllers/membresias.controller");

router.get("/", obtenerMembresias);

router.post("/", crearMembresia);

router.delete("/:id", eliminarMembresia);

module.exports = router;
