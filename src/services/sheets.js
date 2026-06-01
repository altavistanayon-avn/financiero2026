import Papa from "papaparse";
import { SHEET_ID, TABS } from "../config.js";

const buildUrl = (tabName) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

async function fetchTab(tabName) {
  const res = await fetch(buildUrl(tabName));
  if (!res.ok) throw new Error(`Error cargando pestaña "${tabName}": ${res.status}`);
  const text = await res.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return data;
}

// Limpia strings numéricos con $ o comas
const toNum = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  return parseFloat(String(v).replace(/[$,]/g, "")) || 0;
};

export async function fetchAllData() {
  const [resumen, gastos, cxc, cxp, ingresos] = await Promise.all([
    fetchTab(TABS.RESUMEN),
    fetchTab(TABS.GASTOS),
    fetchTab(TABS.CXC),
    fetchTab(TABS.CXP),
    fetchTab(TABS.INGRESOS),
  ]);

  // Normalizar números
  const resumenClean = resumen.map((r) => ({
    mes: r.mes,
    saldo_inicial: toNum(r.saldo_inicial),
    total_ingresos: toNum(r.total_ingresos),
    otros_ingresos: toNum(r.otros_ingresos),
    total_gastos: toNum(r.total_gastos),
    saldo_disponible: toNum(r.saldo_disponible),
    cxc_total: toNum(r.cxc_total),
    poliza: toNum(r.poliza),
    anticipos: toNum(r.anticipos),
    cxp_total: toNum(r.cxp_total),
    saldo_final: toNum(r.saldo_final),
    total_unidades: toNum(r.total_unidades),
    unidades_morosas: toNum(r.unidades_morosas),
  }));

  const gastosClean = gastos.map((g) => ({
    mes: g.mes,
    categoria: g.categoria,
    monto: toNum(g.monto),
  }));

  const cxcClean = cxc.map((c) => ({
    mes: c.mes,
    casa: c.casa,
    propietario: c.propietario,
    total: toNum(c.total),
    desde: c.desde,
  }));

  const cxpClean = cxp.map((c) => ({
    mes: c.mes,
    proveedor: c.proveedor,
    detalle: c.detalle,
    monto: toNum(c.monto),
  }));

  const ingresosClean = ingresos.map((i) => ({
    mes: i.mes,
    casa: i.casa,
    propietario: i.propietario,
    monto: toNum(i.monto),
  }));

  // Obtener lista de meses disponibles
  const meses = [...new Set(resumenClean.map((r) => r.mes))];

  return { resumen: resumenClean, gastos: gastosClean, cxc: cxcClean, cxp: cxpClean, ingresos: ingresosClean, meses };
}

export function filterByMes(data, mes) {
  return {
    resumen: data.resumen.find((r) => r.mes === mes) || data.resumen[0],
    gastos: data.gastos.filter((g) => g.mes === mes),
    cxc: data.cxc.filter((c) => c.mes === mes),
    cxp: data.cxp.filter((c) => c.mes === mes),
    ingresos: data.ingresos.filter((i) => i.mes === mes),
    // Trend: todos los resúmenes para la gráfica histórica
    resumenHistorico: data.resumen,
  };
}
