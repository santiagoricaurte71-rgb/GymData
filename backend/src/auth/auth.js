
"use strict";

// ==========================================
// GYMDATA - AUTENTICACION ADMINISTRATIVA
// ==========================================

const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

// ==========================================
// LIMITAR INTENTOS DE INICIO DE SESION
// ==========================================

const limitarIntentos = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        mensaje:
            "Demasiados intentos. Intenta nuevamente en 15 minutos."
    }
});

// ==========================================
// INICIAR SESION
// ==========================================

async function iniciarSesion(req, res) {
    try {
        const { usuario, password } = req.body || {};

        if (
            typeof usuario !== "string" ||
            typeof password !== "string" ||
            !usuario.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                mensaje:
                    "Debes ingresar usuario y contraseña."
            });
        }

        const usuarioAdmin =
            process.env.ADMIN_USER;

        const hashAdmin =
            process.env.ADMIN_PASSWORD_HASH;

        if (!usuarioAdmin || !hashAdmin) {
            return res.status(503).json({
                success: false,
                mensaje:
                    "El administrador no está configurado."
            });
        }

        const usuarioValido =
            usuario.trim() === usuarioAdmin;

        const passwordValido = await bcrypt.compare(
            password,
            hashAdmin
        );

        if (!usuarioValido || !passwordValido) {
            return res.status(401).json({
                success: false,
                mensaje:
                    "Usuario o contraseña incorrectos."
            });
        }

        // Regenerar la sesion al autenticar.
        req.session.regenerate(error => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    mensaje:
                        "No fue posible iniciar sesión."
                });
            }

            req.session.admin = true;
            req.session.usuario = usuarioAdmin;

            req.session.save(errorGuardar => {
                if (errorGuardar) {
                    return res.status(500).json({
                        success: false,
                        mensaje:
                            "No fue posible guardar la sesión."
                    });
                }

                return res.json({
                    success: true,
                    mensaje: "Inicio de sesión correcto.",
                    usuario: usuarioAdmin
                });
            });
        });

    } catch (error) {
        console.error(
            "Error de autenticación:",
            error.message
        );

        res.status(500).json({
            success: false,
            mensaje:
                "Error al iniciar sesión."
        });
    }
}

// ==========================================
// COMPROBAR SESION
// ==========================================

function comprobarSesion(req, res) {
    if (!req.session?.admin) {
        return res.status(401).json({
            success: false,
            autenticado: false
        });
    }

    return res.json({
        success: true,
        autenticado: true,
        usuario: req.session.usuario
    });
}

// ==========================================
// CERRAR SESION
// ==========================================

function cerrarSesion(req, res) {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                success: false,
                mensaje:
                    "No fue posible cerrar sesión."
            });
        }

        res.clearCookie("gymdata.sid");

        return res.json({
            success: true,
            mensaje: "Sesión cerrada correctamente."
        });
    });
}

// ==========================================
// PROTEGER RUTAS PRIVADAS
// ==========================================

function requiereAutenticacion(req, res, next) {
    if (req.session?.admin === true) {
        return next();
    }

    return res.status(401).json({
        success: false,
        mensaje:
            "Debes iniciar sesión para acceder."
    });
}

module.exports = {
    limitarIntentos,
    iniciarSesion,
    comprobarSesion,
    cerrarSesion,
    requiereAutenticacion
};
