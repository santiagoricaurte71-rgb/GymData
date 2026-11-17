
"use strict";

// ==========================================
// GYMDATA - INICIO DE SESION ADMINISTRATIVO
// ==========================================

(function () {

    // ======================================
    // ESTILOS DEL LOGIN
    // ======================================

    function agregarEstilos() {
        if (document.getElementById("gym-login-css")) {
            return;
        }

        const estilo = document.createElement("style");
        estilo.id = "gym-login-css";

        estilo.textContent = `
            #gym-login-pantalla {
                position: fixed;
                inset: 0;
                z-index: 99999;
                background:
                    radial-gradient(
                        circle at top right,
                        #243b1e 0%,
                        #101610 45%,
                        #080b08 100%
                    );
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                font-family: Inter, Arial, sans-serif;
            }

            .gym-login-tarjeta {
                width: 100%;
                max-width: 420px;
                padding: 42px 35px;
                border-radius: 20px;
                background: #151c15;
                border: 1px solid #344634;
                box-shadow: 0 20px 65px #0008;
            }

            .gym-login-logo {
                text-align: center;
                margin-bottom: 30px;
            }

            .gym-login-icono {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 70px;
                height: 70px;
                border-radius: 18px;
                background: #b8f34b;
                color: #14200d;
                font-size: 35px;
                font-weight: 900;
                margin-bottom: 15px;
            }

            .gym-login-logo h1 {
                font-size: 35px;
                font-weight: 900;
                color: #ffffff;
                margin: 0;
                letter-spacing: 1px;
            }

            .gym-login-logo h1 span {
                color: #b8f34b;
            }

            .gym-login-logo p {
                color: #98a998;
                font-size: 12px;
                letter-spacing: 3px;
                margin-top: 8px;
            }

            .gym-login-titulo {
                color: #ffffff;
                font-size: 23px;
                font-weight: 800;
                text-align: center;
                margin-bottom: 8px;
            }

            .gym-login-subtitulo {
                color: #9cae9c;
                font-size: 13px;
                text-align: center;
                margin-bottom: 28px;
            }

            .gym-login-campo {
                margin-bottom: 20px;
            }

            .gym-login-campo label {
                display: block;
                color: #dce8dc;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 9px;
            }

            .gym-login-campo input {
                box-sizing: border-box;
                display: block;
                width: 100%;
                padding: 15px;
                background: #0d130d;
                border: 1px solid #3a4c3a;
                border-radius: 10px;
                outline: none;
                color: white;
                font-size: 15px;
            }

            .gym-login-campo input:focus {
                border-color: #b8f34b;
                box-shadow: 0 0 0 3px #b8f34b22;
            }

            .gym-login-boton {
                width: 100%;
                padding: 16px;
                margin-top: 8px;
                border: none;
                border-radius: 10px;
                background: #b8f34b;
                color: #14200d;
                font-size: 15px;
                font-weight: 800;
                cursor: pointer;
                transition: .2s;
            }

            .gym-login-boton:hover {
                background: #d3ff81;
                transform: translateY(-1px);
            }

            .gym-login-boton:disabled {
                opacity: .6;
                cursor: wait;
                transform: none;
            }

            .gym-login-error {
                min-height: 22px;
                margin-top: 15px;
                color: #ff9292;
                font-size: 13px;
                text-align: center;
            }

            .gym-login-pie {
                margin-top: 25px;
                text-align: center;
                color: #758775;
                font-size: 11px;
            }

            #gym-cerrar-sesion {
                display: block;
                margin-top: 16px;
                padding: 11px;
                width: 100%;
                background: transparent;
                border: 1px solid #526b42;
                border-radius: 9px;
                color: #b8f34b;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
            }

            #gym-cerrar-sesion:hover {
                background: #263722;
            }

            @media (max-width: 480px) {
                .gym-login-tarjeta {
                    padding: 30px 22px;
                }
            }
        `;

        document.head.appendChild(estilo);
    }

    // ======================================
    // CREAR PANTALLA DE LOGIN
    // ======================================

    function crearPantalla() {
        const pantalla = document.createElement("div");

        pantalla.id = "gym-login-pantalla";

        pantalla.innerHTML = `
            <div class="gym-login-tarjeta">

                <div class="gym-login-logo">
                    <div class="gym-login-icono">G.</div>

                    <h1>GYM<span>DATA</span></h1>

                    <p>GESTION DEPORTIVA</p>
                </div>

                <h2 class="gym-login-titulo">
                    ACCESO ADMINISTRATIVO
                </h2>

                <p class="gym-login-subtitulo">
                    Ingresa tus credenciales para continuar
                </p>

                <form id="gym-login-formulario">

                    <div class="gym-login-campo">
                        <label for="gym-login-usuario">
                            Usuario
                        </label>

                        <input
                            type="text"
                            id="gym-login-usuario"
                            autocomplete="username"
                            placeholder="Ingresa tu usuario"
                            required
                        >
                    </div>

                    <div class="gym-login-campo">
                        <label for="gym-login-password">
                            Contraseña
                        </label>

                        <input
                            type="password"
                            id="gym-login-password"
                            autocomplete="current-password"
                            placeholder="Ingresa tu contraseña"
                            required
                        >
                    </div>

                    <button
                        type="submit"
                        class="gym-login-boton"
                        id="gym-login-ingresar"
                    >
                        INICIAR SESION
                    </button>

                    <p
                        class="gym-login-error"
                        id="gym-login-error"
                        role="alert"
                        aria-live="polite"
                    ></p>

                </form>

                <div class="gym-login-pie">
                    GymData - Panel de administración
                </div>

            </div>
        `;

        document.body.appendChild(pantalla);

        document.getElementById(
            "gym-login-formulario"
        ).addEventListener(
            "submit",
            iniciarSesion
        );

        return pantalla;
    }

    // ======================================
    // INICIAR SESION
    // ======================================

    async function iniciarSesion(evento) {
        evento.preventDefault();

        const usuario = document.getElementById(
            "gym-login-usuario"
        ).value.trim();

        const password = document.getElementById(
            "gym-login-password"
        ).value;

        const boton = document.getElementById(
            "gym-login-ingresar"
        );

        const mensaje = document.getElementById(
            "gym-login-error"
        );

        boton.disabled = true;
        boton.textContent = "VERIFICANDO...";
        mensaje.textContent = "";

        try {
            const respuesta = await fetch(
                "/api/auth/login",
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        usuario,
                        password
                    })
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.success) {
                mensaje.textContent =
                    resultado.mensaje ||
                    "No fue posible iniciar sesión.";

                return;
            }

            // Recargar para que todos los modulos
            // consulten las API ya autenticadas.
            window.location.reload();

        } catch (error) {
            console.error(
                "Error de inicio de sesión:",
                error
            );

            mensaje.textContent =
                "No fue posible conectar con GymData.";

        } finally {
            boton.disabled = false;
            boton.textContent = "INICIAR SESION";
        }
    }

    // ======================================
    // COMPROBAR SESION EXISTENTE
    // ======================================

    async function comprobarSesion() {
        try {
            const respuesta = await fetch(
                "/api/auth/session",
                {
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );

            if (!respuesta.ok) {
                return false;
            }

            const resultado = await respuesta.json();

            return resultado.autenticado === true;

        } catch (error) {
            return false;
        }
    }

    // ======================================
    // CERRAR SESION
    // ======================================

    async function cerrarSesion() {
        const boton = document.getElementById(
            "gym-cerrar-sesion"
        );

        if (boton) {
            boton.disabled = true;
            boton.textContent = "CERRANDO SESION...";
        }

        try {
            const respuesta = await fetch(
                "/api/auth/logout",
                {
                    method: "POST",
                    credentials: "same-origin"
                }
            );

            if (!respuesta.ok) {
                throw new Error(
                    "No se pudo cerrar la sesión."
                );
            }

            window.location.reload();

        } catch (error) {
            alert(
                "No fue posible cerrar sesión. " +
                "Intenta nuevamente."
            );

            if (boton) {
                boton.disabled = false;
                boton.textContent = "CERRAR SESION";
            }
        }
    }

    // ======================================
    // AGREGAR BOTON CERRAR SESION
    // ======================================

    function agregarBotonCerrarSesion() {
        if (
            document.getElementById(
                "gym-cerrar-sesion"
            )
        ) {
            return;
        }

        const contenedor = document.querySelector(
            ".sidebar-pie"
        );

        if (!contenedor) return;

        const boton = document.createElement("button");

        boton.id = "gym-cerrar-sesion";
        boton.type = "button";
        boton.textContent = "CERRAR SESION";

        boton.addEventListener(
            "click",
            cerrarSesion
        );

        contenedor.appendChild(boton);
    }

    // ======================================
    // INICIALIZAR LOGIN
    // ======================================

    async function inicializarLogin() {
        agregarEstilos();

        const pantalla = crearPantalla();

        // Ocultar el panel hasta verificar sesión.
        const panel = document.querySelector(
            ".contenedor-principal"
        );

        if (panel) {
            panel.style.display = "none";
        }

        const autenticado = await comprobarSesion();

        if (autenticado) {
            pantalla.remove();

            if (panel) {
                panel.style.display = "";
            }

            agregarBotonCerrarSesion();
        } else {
            document.getElementById(
                "gym-login-usuario"
            ).focus();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            inicializarLogin
        );
    } else {
        inicializarLogin();
    }

})();
