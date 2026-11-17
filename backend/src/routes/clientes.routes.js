
"use strict";

// ==========================================
// GYMDATA - RUTAS DE CLIENTES
// ==========================================

const express = require("express");

const router = express.Router();

const {
    obtenerClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    eliminarCliente
} = require("../controllers/clientes.controller");

// Consultar todos los clientes
router.get("/", obtenerClientes);

// Consultar un cliente por identificador
router.get("/:id", obtenerClientePorId);

// Registrar cliente
router.post("/", crearCliente);

// Actualizar cliente
router.put("/:id", actualizarCliente);

// Eliminar cliente
router.delete("/:id", eliminarCliente);

module.exports = router;
