
"use strict";

// ==========================================
// GYMDATA - ESTADISTICAS CON MYSQL
// DIAGRAMAS DE BARRAS VERTICALES
// ==========================================

(function () {

    const API = {
        clientes: "/api/clientes",
        membresias: "/api/membresias",
        rutinas: "/api/rutinas",
        sesiones: "/api/sesiones"
    };

    let datos = {
        clientes: [],
        membresias: [],
        rutinas: [],
        sesiones: []
    };

    let cargaCorrecta = false;

    // ======================================
    // FECHAS
    // ======================================

    function hoyLocal() {
        const fecha = new Date();

        const anio = fecha.getFullYear();
        const mes = String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            fecha.getDate()
        ).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }

    function sumarDias(fechaTexto, cantidad) {
        const [anio, mes, dia] =
            fechaTexto.split("-").map(Number);

        const fecha = new Date(
            anio,
            mes - 1,
            dia
        );

        fecha.setDate(
            fecha.getDate() + cantidad
        );

        const nuevoAnio = fecha.getFullYear();

        const nuevoMes = String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

        const nuevoDia = String(
            fecha.getDate()
        ).padStart(2, "0");

        return `${nuevoAnio}-${nuevoMes}-${nuevoDia}`;
    }

    function formatearFecha(valor) {
        if (!valor) return "-";

        const partes = String(valor)
            .slice(0, 10)
            .split("-");

        if (partes.length !== 3) return "-";

        return (
            partes[2] + "/" +
            partes[1] + "/" +
            partes[0]
        );
    }

    function estadoMembresia(membresia) {
        const hoy = hoyLocal();

        if (membresia.fechaVencimiento < hoy) {
            return "Vencida";
        }

        if (membresia.fechaInicio > hoy) {
            return "Programada";
        }

        return "Activa";
    }

    // ======================================
    // ELEMENTOS DE INTERFAZ
    // ======================================

    function texto(id, valor) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = String(valor);
        }
    }

    function elemento(
        etiqueta,
        contenido = "",
        clase = ""
    ) {
        const nodo = document.createElement(etiqueta);

        nodo.textContent = contenido;

        if (clase) {
            nodo.className = clase;
        }

        return nodo;
    }

    // ======================================
    // CONSULTAR MYSQL MEDIANTE LAS API
    // ======================================

    async function consultarAPI(ruta) {
        const respuesta = await fetch(ruta, {
            headers: {
                Accept: "application/json"
            },
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error(
                "Error HTTP " + respuesta.status +
                " al consultar " + ruta
            );
        }

        const resultado = await respuesta.json();

        if (
            resultado.success !== true ||
            !Array.isArray(resultado.data)
        ) {
            throw new Error(
                "Respuesta incorrecta de " + ruta
            );
        }

        return resultado.data;
    }

    async function cargarDatosMySQL() {
        const [
            clientes,
            membresias,
            rutinas,
            sesiones
        ] = await Promise.all([
            consultarAPI(API.clientes),
            consultarAPI(API.membresias),
            consultarAPI(API.rutinas),
            consultarAPI(API.sesiones)
        ]);

        datos = {
            clientes,
            membresias,
            rutinas,
            sesiones
        };
    }

    // ======================================
    // INDICADORES
    // ======================================

    function calcularIndicadores() {
        const hoy = hoyLocal();
        const limite = sumarDias(hoy, 7);

        const activas = datos.membresias.filter(
            item =>
                estadoMembresia(item) === "Activa"
        );

        const vencidas = datos.membresias.filter(
            item =>
                estadoMembresia(item) === "Vencida"
        );

        const proximas = activas.filter(
            item =>
                item.fechaVencimiento >= hoy &&
                item.fechaVencimiento <= limite
        );

        return {
            activas,
            vencidas,
            proximas
        };
    }

    function mostrarIndicadores() {
        const indicadores = calcularIndicadores();

        texto(
            "estadisticaClientes",
            datos.clientes.length
        );

        texto(
            "estadisticaActivas",
            indicadores.activas.length
        );

        texto(
            "estadisticaVencidas",
            indicadores.vencidas.length
        );

        texto(
            "estadisticaProximas",
            indicadores.proximas.length
        );

        texto(
            "estadisticaRutinas",
            datos.rutinas.length
        );

        texto(
            "estadisticaSesiones",
            datos.sesiones.length
        );

        // Mantener actualizado el resumen inicial.
        texto(
            "totalClientes",
            datos.clientes.length
        );

        texto(
            "membresiasActivas",
            indicadores.activas.length
        );

        texto(
            "membresiasVencidas",
            indicadores.vencidas.length
        );

        texto(
            "totalRutinas",
            datos.rutinas.length
        );

        texto(
            "totalSesiones",
            datos.sesiones.length
        );
    }

    // ======================================
    // ESTILOS DE BARRAS VERTICALES
    // ======================================

    function instalarEstilos() {
        if (
            document.getElementById(
                "gymdata-estilos-graficas"
            )
        ) {
            return;
        }

        const estilo = document.createElement("style");

        estilo.id = "gymdata-estilos-graficas";

        estilo.textContent = `
            .gym-barras-verticales {
                display: flex;
                justify-content: space-around;
                align-items: stretch;
                gap: 12px;
                margin-top: 22px;
                padding: 12px 4px 0;
                min-height: 255px;
                border-bottom: 1px solid #385240;
            }

            .gym-columna {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                align-items: center;
                gap: 7px;
            }

            .gym-valor {
                color: #bef264;
                font-weight: 800;
                font-size: 13px;
            }

            .gym-area-barra {
                height: 180px;
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: flex-end;
            }

            .gym-barra-vertical {
                width: min(100%, 60px);
                border-radius: 9px 9px 0 0;
                background: linear-gradient(
                    180deg,
                    #d9ff95,
                    #a3e635 55%,
                    #4d7c0f
                );
                box-shadow:
                    0 0 14px rgba(190,242,100,.15);
                transition: height .3s ease;
            }

            .gym-barra-vertical:hover {
                filter: brightness(1.2);
            }

            .gym-nombre-columna {
                display: block;
                min-height: 38px;
                max-width: 100%;
                text-align: center;
                font-size: 11px;
                line-height: 1.3;
                color: #c9d7cd;
                overflow-wrap: anywhere;
            }

            @media (max-width: 600px) {
                .gym-barras-verticales {
                    gap: 5px;
                }

                .gym-area-barra {
                    height: 155px;
                }

                .gym-nombre-columna {
                    font-size: 9px;
                }
            }
        `;

        document.head.appendChild(estilo);
    }

    // ======================================
    // CONSTRUIR GRAFICAS
    // ======================================

    function crearGrafica(id, valores) {
        const contenedor = document.getElementById(id);

        if (!contenedor) return;

        contenedor.replaceChildren();

        const total = valores.reduce(
            (suma, item) => suma + item.valor,
            0
        );

        if (total === 0) {
            contenedor.appendChild(
                elemento(
                    "p",
                    "No hay datos registrados para esta gráfica.",
                    "mensaje-vacio"
                )
            );
            return;
        }

        const maximo = Math.max(
            1,
            ...valores.map(item => item.valor)
        );

        const grafica = document.createElement("div");

        grafica.className = "gym-barras-verticales";
        grafica.setAttribute("role", "img");

        grafica.setAttribute(
            "aria-label",
            valores.map(item =>
                item.nombre + ": " + item.valor
            ).join(", ")
        );

        valores.forEach(item => {
            const columna = document.createElement("div");
            columna.className = "gym-columna";

            const cantidad = elemento(
                "span",
                String(item.valor),
                "gym-valor"
            );

            const area = document.createElement("div");
            area.className = "gym-area-barra";

            const barra = document.createElement("div");
            barra.className = "gym-barra-vertical";

            const porcentaje =
                (item.valor / maximo) * 100;

            barra.style.height =
                porcentaje + "%";

            barra.title =
                item.nombre + ": " + item.valor;

            area.appendChild(barra);

            const nombre = elemento(
                "span",
                item.nombre,
                "gym-nombre-columna"
            );

            columna.append(
                cantidad,
                area,
                nombre
            );

            grafica.appendChild(columna);
        });

        contenedor.appendChild(grafica);
    }

    // ======================================
    // GRAFICA DE MEMBRESIAS
    // ======================================

    function mostrarGraficaPlanes() {
        const nombres = [
            "Mensual",
            "Trimestral",
            "Semestral"
        ];

        const valores = nombres.map(plan => ({
            nombre: plan,
            valor: datos.membresias.filter(
                item => item.plan === plan
            ).length
        }));

        crearGrafica("graficaPlanes", valores);
    }

    // ======================================
    // GRAFICA DE ENTRENAMIENTOS
    // ======================================

    function mostrarGraficaSesiones() {
        const hoy = hoyLocal();

        const valores = [];

        for (let i = 6; i >= 0; i--) {
            const fecha = sumarDias(hoy, -i);

            const [anio, mes, dia] =
                fecha.split("-").map(Number);

            const nombre = new Date(
                anio,
                mes - 1,
                dia
            ).toLocaleDateString("es-CO", {
                weekday: "short",
                day: "numeric"
            });

            const cantidad = datos.sesiones.filter(
                sesion => sesion.fecha === fecha
            ).length;

            valores.push({
                nombre,
                valor: cantidad
            });
        }

        crearGrafica("graficaSesiones", valores);
    }

    // ======================================
    // MEMBRESIAS PROXIMAS A VENCER
    // ======================================

    function mostrarProximosVencimientos() {
        const contenedor = document.getElementById(
            "listaProximosVencimientos"
        );

        if (!contenedor) return;

        contenedor.replaceChildren();

        const proximas = calcularIndicadores()
            .proximas
            .slice()
            .sort(
                (a, b) =>
                    a.fechaVencimiento.localeCompare(
                        b.fechaVencimiento
                    )
            );

        if (!proximas.length) {
            contenedor.appendChild(
                elemento(
                    "p",
                    "No hay membresías próximas a vencer.",
                    "mensaje-vacio"
                )
            );

            return;
        }

        proximas.forEach(item => {
            const fila = document.createElement("div");
            fila.className = "fila-vencimiento";

            const informacion = document.createElement("div");

            informacion.appendChild(
                elemento("strong", item.nombreCliente)
            );

            informacion.appendChild(
                elemento(
                    "p",
                    item.plan +
                    " · Vence: " +
                    formatearFecha(
                        item.fechaVencimiento
                    )
                )
            );

            const aviso = elemento(
                "span",
                item.fechaVencimiento === hoyLocal()
                    ? "Vence hoy"
                    : "Próximo vencimiento",
                "etiqueta-alerta"
            );

            fila.append(informacion, aviso);
            contenedor.appendChild(fila);
        });
    }

    // ======================================
    // REPORTE DE CLIENTES
    // ======================================

    function construirFilasReporte() {
        const filas = [];

        datos.clientes.forEach(cliente => {
            const relacionadas =
                datos.membresias.filter(
                    membresia =>
                        String(membresia.clienteId) ===
                        String(cliente.id)
                );

            if (!relacionadas.length) {
                filas.push({
                    cliente: cliente.nombre,
                    documento: cliente.documento || "",
                    plan: "-",
                    vencimiento: "",
                    estado: "Sin membresía"
                });

                return;
            }

            relacionadas.forEach(membresia => {
                filas.push({
                    cliente: cliente.nombre,
                    documento: cliente.documento || "",
                    plan: membresia.plan,
                    vencimiento:
                        membresia.fechaVencimiento,
                    estado:
                        estadoMembresia(membresia)
                });
            });
        });

        return filas;
    }

    function filasFiltradas() {
        const filtro = document.getElementById(
            "filtroReporte"
        )?.value || "Todos";

        const filas = construirFilasReporte();

        return filtro === "Todos"
            ? filas
            : filas.filter(
                fila => fila.estado === filtro
            );
    }

    function mostrarReporte() {
        const cuerpo = document.getElementById(
            "cuerpoReporte"
        );

        if (!cuerpo) return;

        cuerpo.replaceChildren();

        const filas = filasFiltradas();

        texto(
            "totalFilasReporte",
            filas.length + " resultados"
        );

        if (!filas.length) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.colSpan = 5;
            td.textContent =
                "No se encontraron resultados.";

            tr.appendChild(td);
            cuerpo.appendChild(tr);
            return;
        }

        filas.forEach(fila => {
            const tr = document.createElement("tr");

            const valores = [
                fila.cliente,
                fila.documento,
                fila.plan,
                formatearFecha(fila.vencimiento),
                fila.estado
            ];

            valores.forEach(valor => {
                tr.appendChild(
                    elemento("td", valor)
                );
            });

            cuerpo.appendChild(tr);
        });
    }

    // ======================================
    // EXPORTAR CSV
    // ======================================

    function escaparCSV(valor) {
        let contenido = String(valor ?? "");

        // Evitar ejecución de fórmulas en Excel.
        if (/^[\s]*[=+\-@\t\r]/.test(contenido)) {
            contenido = "'" + contenido;
        }

        return '"' +
            contenido.replace(/"/g, '""') +
            '"';
    }

    function exportarReporte() {
        if (!cargaCorrecta) {
            alert(
                "Primero debes cargar las estadísticas."
            );
            return;
        }

        const filas = filasFiltradas();

        if (!filas.length) {
            alert("No hay datos para exportar.");
            return;
        }

        const contenido = [
            [
                "Cliente",
                "Documento",
                "Plan",
                "Vencimiento",
                "Estado"
            ],
            ...filas.map(fila => [
                fila.cliente,
                fila.documento,
                fila.plan,
                formatearFecha(
                    fila.vencimiento
                ),
                fila.estado
            ])
        ];

        const csv = contenido.map(fila =>
            fila.map(escaparCSV).join(";")
        ).join("\r\n");

        const archivo = new Blob(
            ["\uFEFF" + csv],
            {
                type: "text/csv;charset=utf-8"
            }
        );

        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download =
            "GymData_Reporte_" +
            hoyLocal() +
            ".csv";

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        setTimeout(
            () => URL.revokeObjectURL(url),
            1000
        );
    }

    // ======================================
    // ACTUALIZAR ESTADISTICAS
    // ======================================

    async function actualizarEstadisticas() {
        try {
            cargaCorrecta = false;

            await cargarDatosMySQL();

            cargaCorrecta = true;

            mostrarIndicadores();
            mostrarGraficaPlanes();
            mostrarGraficaSesiones();
            mostrarProximosVencimientos();
            mostrarReporte();

            console.log(
                "Estadísticas actualizadas desde MySQL."
            );

        } catch (error) {
            console.error(
                "Error al cargar estadísticas:",
                error
            );

            const contenedor = document.getElementById(
                "graficaPlanes"
            );

            if (contenedor) {
                contenedor.replaceChildren();

                contenedor.appendChild(
                    elemento(
                        "p",
                        "No fue posible cargar las estadísticas. " +
                        "Comprueba la conexión con MySQL.",
                        "mensaje-vacio"
                    )
                );
            }
        }
    }

    // Disponible para Seguimiento semanal.
    window.actualizarEstadisticas =
        actualizarEstadisticas;

    // ======================================
    // INICIALIZAR
    // ======================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            instalarEstilos();

            const filtro = document.getElementById(
                "filtroReporte"
            );

            const exportar = document.getElementById(
                "exportarReporte"
            );

            if (filtro) {
                filtro.addEventListener(
                    "change",
                    mostrarReporte
                );
            }

            if (exportar) {
                exportar.addEventListener(
                    "click",
                    exportarReporte
                );
            }

            document.querySelector(
                'a[href="#estadisticas"]'
            )?.addEventListener(
                "click",
                actualizarEstadisticas
            );

            actualizarEstadisticas();
        }
    );

})();
