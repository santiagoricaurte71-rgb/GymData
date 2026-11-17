
"use strict";

// ==========================================
// GYMDATA - ESTADISTICAS Y REPORTES
// GRAFICAS VERTICALES DE BARRAS
// ==========================================

// ==========================================
// FECHAS
// ==========================================

function fechaHoyEstadisticas() {
    const hoy = new Date();

    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function sumarDiasEstadisticas(valor, cantidad) {
    const [anio, mes, dia] = valor.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);

    fecha.setDate(fecha.getDate() + cantidad);

    const a = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");

    return `${a}-${m}-${d}`;
}

function mostrarFechaEstadisticas(fecha) {
    if (!fecha) return "-";

    const partes = fecha.split("-");

    if (partes.length !== 3) return "-";

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function cambiarTextoEstadisticas(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = String(valor);
    }
}

// ==========================================
// OBTENER DATOS DE GYMDATA
// ==========================================

function datosEstadisticas() {
    const hoy = fechaHoyEstadisticas();
    const limite = sumarDiasEstadisticas(hoy, 7);

    const listaClientes =
        typeof clientes !== "undefined" ? clientes : [];

    const listaMembresias =
        typeof membresias !== "undefined" ? membresias : [];

    const listaRutinas =
        typeof rutinas !== "undefined" ? rutinas : [];

    const listaSesiones =
        typeof sesionesEntrenamiento !== "undefined"
            ? sesionesEntrenamiento : [];

    const activas = listaMembresias.filter(m =>
        m.fechaVencimiento >= hoy &&
        (!m.fechaInicio || m.fechaInicio <= hoy)
    );

    const vencidas = listaMembresias.filter(m =>
        m.fechaVencimiento < hoy
    );

    const proximas = activas.filter(m =>
        m.fechaVencimiento <= limite
    );

    return {
        hoy,
        listaClientes,
        listaMembresias,
        listaRutinas,
        listaSesiones,
        activas,
        vencidas,
        proximas
    };
}

// ==========================================
// INDICADORES
// ==========================================

function mostrarIndicadoresEstadisticas(datos) {
    cambiarTextoEstadisticas(
        "estadisticaClientes",
        datos.listaClientes.length
    );

    cambiarTextoEstadisticas(
        "estadisticaActivas",
        datos.activas.length
    );

    cambiarTextoEstadisticas(
        "estadisticaVencidas",
        datos.vencidas.length
    );

    cambiarTextoEstadisticas(
        "estadisticaProximas",
        datos.proximas.length
    );

    cambiarTextoEstadisticas(
        "estadisticaRutinas",
        datos.listaRutinas.length
    );

    cambiarTextoEstadisticas(
        "estadisticaSesiones",
        datos.listaSesiones.length
    );
}

// ==========================================
// ESTILOS DE LOS DIAGRAMAS VERTICALES
// ==========================================

// Se incluyen aqui para no modificar estilos.css

function instalarEstilosGraficas() {
    if (document.getElementById("estilosGraficasGymData")) {
        return;
    }

    const estilo = document.createElement("style");
    estilo.id = "estilosGraficasGymData";

    estilo.textContent = `
        .gym-grafica-vertical {
            display: flex;
            align-items: stretch;
            justify-content: space-around;
            gap: 12px;
            width: 100%;
            min-height: 260px;
            margin-top: 18px;
            padding: 15px 4px 0;
            border-bottom: 1px solid #385240;
        }

        .gym-columna {
            flex: 1;
            min-width: 0;
            max-width: 110px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
        }

        .gym-valor {
            font-size: 13px;
            font-weight: 800;
            color: #bef264;
        }

        .gym-zona-barra {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            width: 100%;
            height: 190px;
        }

        .gym-barra {
            width: min(100%, 58px);
            min-height: 0;
            background: linear-gradient(
                180deg,
                #d9ff95 0%,
                #a3e635 55%,
                #4d7c0f 100%
            );
            border-radius: 9px 9px 0 0;
            box-shadow: 0 0 15px rgba(190,242,100,.16);
            transition: height .35s ease;
        }

        .gym-barra:hover {
            filter: brightness(1.15);
        }

        .gym-etiqueta {
            min-height: 36px;
            max-width: 100%;
            text-align: center;
            color: #c9d7cd;
            font-size: 11px;
            overflow-wrap: anywhere;
            line-height: 1.3;
        }

        .gym-sin-datos {
            width: 100%;
            padding: 30px 12px;
            color: #a4b8aa;
            text-align: center;
        }

        @media (max-width: 600px) {
            .gym-grafica-vertical {
                gap: 5px;
                min-height: 235px;
            }

            .gym-zona-barra {
                height: 160px;
            }

            .gym-valor {
                font-size: 11px;
            }

            .gym-etiqueta {
                font-size: 9px;
            }
        }
    `;

    document.head.appendChild(estilo);
}

// ==========================================
// CONSTRUIR GRAFICA VERTICAL
// ==========================================

function construirGraficaVertical(id, elementos) {
    const contenedor = document.getElementById(id);

    if (!contenedor) return;

    contenedor.replaceChildren();

    const total = elementos.reduce(
        (suma, item) => suma + item.valor,
        0
    );

    if (total === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "gym-sin-datos";
        mensaje.textContent =
            "No hay datos registrados para esta gráfica.";

        contenedor.appendChild(mensaje);
        return;
    }

    const maximo = Math.max(
        1,
        ...elementos.map(item => item.valor)
    );

    const grafica = document.createElement("div");
    grafica.className = "gym-grafica-vertical";
    grafica.setAttribute("role", "img");
    grafica.setAttribute(
        "aria-label",
        elementos.map(item =>
            `${item.nombre}: ${item.valor}`
        ).join(", ")
    );

    elementos.forEach(item => {
        const columna = document.createElement("div");
        columna.className = "gym-columna";

        const valor = document.createElement("span");
        valor.className = "gym-valor";
        valor.textContent = item.valor;

        const zona = document.createElement("div");
        zona.className = "gym-zona-barra";

        const barra = document.createElement("div");
        barra.className = "gym-barra";

        const porcentaje = item.valor / maximo * 100;

        barra.style.height = `${porcentaje}%`;
        barra.title = `${item.nombre}: ${item.valor}`;

        zona.appendChild(barra);

        const etiqueta = document.createElement("span");
        etiqueta.className = "gym-etiqueta";
        etiqueta.textContent = item.nombre;

        columna.append(valor, zona, etiqueta);
        grafica.appendChild(columna);
    });

    contenedor.appendChild(grafica);
}

// ==========================================
// GRAFICA DE PLANES
// ==========================================

function mostrarGraficaPlanes(datos) {
    const planes = [
        "Mensual",
        "Trimestral",
        "Semestral"
    ];

    const cantidades = planes.map(plan => ({
        nombre: plan,
        valor: datos.listaMembresias.filter(
            membresia => membresia.plan === plan
        ).length
    }));

    construirGraficaVertical(
        "graficaPlanes",
        cantidades
    );
}

// ==========================================
// GRAFICA DE SESIONES POR DIA
// ==========================================

function mostrarGraficaSesiones(datos) {
    const registros = [];

    for (let i = 6; i >= 0; i--) {
        const fecha = sumarDiasEstadisticas(datos.hoy, -i);

        const [anio, mes, dia] = fecha
            .split("-")
            .map(Number);

        const etiqueta = new Date(
            anio, mes - 1, dia
        ).toLocaleDateString("es-CO", {
            weekday: "short",
            day: "numeric"
        });

        const total = datos.listaSesiones.filter(
            sesion => sesion.fecha === fecha
        ).length;

        registros.push({
            nombre: etiqueta,
            valor: total
        });
    }

    construirGraficaVertical(
        "graficaSesiones",
        registros
    );
}

// ==========================================
// PROXIMOS VENCIMIENTOS
// ==========================================

function mostrarProximosVencimientos(datos) {
    const contenedor = document.getElementById(
        "listaProximosVencimientos"
    );

    if (!contenedor) return;

    contenedor.replaceChildren();

    const proximas = [...datos.proximas].sort(
        (a, b) =>
            a.fechaVencimiento.localeCompare(b.fechaVencimiento)
    );

    if (!proximas.length) {
        const p = document.createElement("p");
        p.className = "mensaje-vacio";
        p.textContent =
            "No hay membresías próximas a vencer.";

        contenedor.appendChild(p);
        return;
    }

    proximas.forEach(m => {
        const fila = document.createElement("div");
        fila.className = "fila-vencimiento";

        const info = document.createElement("div");

        const nombre = document.createElement("strong");
        nombre.textContent = m.nombreCliente;

        const detalle = document.createElement("p");
        detalle.textContent =
            `${m.plan} · Vence: ` +
            mostrarFechaEstadisticas(m.fechaVencimiento);

        info.append(nombre, detalle);

        const etiqueta = document.createElement("span");
        etiqueta.className = "etiqueta-alerta";

        etiqueta.textContent =
            m.fechaVencimiento === datos.hoy
                ? "Vence hoy"
                : "Próximo vencimiento";

        fila.append(info, etiqueta);
        contenedor.appendChild(fila);
    });
}

// ==========================================
// CONSTRUIR REPORTE
// ==========================================

function construirFilasReporte(datos) {
    const filas = [];

    datos.listaClientes.forEach(cliente => {
        const relacionadas = datos.listaMembresias.filter(
            m => String(m.clienteId) === String(cliente.id)
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

        relacionadas.forEach(m => {
            let estado = "Activa";

            if (m.fechaVencimiento < datos.hoy) {
                estado = "Vencida";
            } else if (
                m.fechaInicio &&
                m.fechaInicio > datos.hoy
            ) {
                estado = "Programada";
            }

            filas.push({
                cliente: cliente.nombre,
                documento: cliente.documento || "",
                plan: m.plan,
                vencimiento: m.fechaVencimiento,
                estado
            });
        });
    });

    return filas;
}

function filasFiltradasReporte(datos) {
    const filtro = document.getElementById(
        "filtroReporte"
    )?.value || "Todos";

    const filas = construirFilasReporte(datos);

    return filtro === "Todos"
        ? filas
        : filas.filter(fila => fila.estado === filtro);
}

// ==========================================
// MOSTRAR REPORTE
// ==========================================

function mostrarReporte(datos) {
    const cuerpo = document.getElementById(
        "cuerpoReporte"
    );

    if (!cuerpo) return;

    cuerpo.replaceChildren();

    const filas = filasFiltradasReporte(datos);

    cambiarTextoEstadisticas(
        "totalFilasReporte",
        `${filas.length} resultados`
    );

    if (!filas.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 5;
        td.textContent = "No se encontraron resultados.";

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
            mostrarFechaEstadisticas(fila.vencimiento),
            fila.estado
        ];

        valores.forEach(valor => {
            const td = document.createElement("td");
            td.textContent = valor;
            tr.appendChild(td);
        });

        cuerpo.appendChild(tr);
    });
}

// ==========================================
// EXPORTACION CSV
// ==========================================

function escaparCeldaCSV(valor) {
    let texto = String(valor ?? "");

    if (/^[\s]*[=+\-@\t\r]/.test(texto)) {
        texto = "'" + texto;
    }

    return '"' + texto.replace(/"/g, '""') + '"';
}

function exportarReporteEstadisticas() {
    const datos = datosEstadisticas();
    const filas = filasFiltradasReporte(datos);

    if (!filas.length) {
        alert("No hay información para exportar.");
        return;
    }

    const encabezados = [
        "Cliente",
        "Documento",
        "Plan",
        "Vencimiento",
        "Estado"
    ];

    const contenido = [
        encabezados,
        ...filas.map(fila => [
            fila.cliente,
            fila.documento,
            fila.plan,
            fila.vencimiento
                ? mostrarFechaEstadisticas(fila.vencimiento)
                : "",
            fila.estado
        ])
    ];

    const csv = contenido.map(fila =>
        fila.map(escaparCeldaCSV).join(";")
    ).join("\r\n");

    const archivo = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download =
        `gymdata_reporte_${datos.hoy}.csv`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ==========================================
// ACTUALIZAR TODO
// ==========================================

function actualizarEstadisticas() {
    const datos = datosEstadisticas();

    mostrarIndicadoresEstadisticas(datos);
    mostrarGraficaPlanes(datos);
    mostrarGraficaSesiones(datos);
    mostrarProximosVencimientos(datos);
    mostrarReporte(datos);
}

// ==========================================
// INICIALIZAR
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    instalarEstilosGraficas();

    const filtro = document.getElementById("filtroReporte");
    const exportar = document.getElementById("exportarReporte");

    if (!filtro || !exportar) return;

    filtro.addEventListener(
        "change",
        actualizarEstadisticas
    );

    exportar.addEventListener(
        "click",
        exportarReporteEstadisticas
    );

    document.querySelector('a[href="#estadisticas"]')
        ?.addEventListener("click", actualizarEstadisticas);

    window.addEventListener(
        "focus",
        actualizarEstadisticas
    );

    actualizarEstadisticas();
});
