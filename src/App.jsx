import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from "recharts";
import { fetchAllData, filterByMes } from "./services/sheets.js";
import { NOMBRE_URBANIZACION } from "./config.js";

// ─── THEME ───
const C = {
  bg: "#0a0f1a", card: "#111827", border: "#1e293b",
  accent: "#22d3ee", accentDim: "rgba(34,211,238,0.15)",
  green: "#34d399", greenDim: "rgba(52,211,153,0.15)",
  red: "#f87171", redDim: "rgba(248,113,113,0.15)",
  amber: "#fbbf24", amberDim: "rgba(251,191,36,0.15)",
  purple: "#a78bfa", purpleDim: "rgba(167,139,250,0.15)",
  text: "#e2e8f0", textDim: "#94a3b8", textMuted: "#64748b",
};
const PIE_COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f87171", "#fb923c", "#2dd4bf", "#818cf8", "#e879f9", "#38bdf8"];

const fmt = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000) return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + v.toFixed(2);
};
const fmtK = (n) => "$" + (n / 1000).toFixed(1) + "k";
const pct = (part, total) => total ? ((part / total) * 100).toFixed(1) + "%" : "0%";

// ─── REUSABLE COMPONENTS ───
function KpiCard({ label, value, subtitle, color = C.accent, dimColor, icon }) {
  return (
    <div style={{
      background: C.card, borderRadius: 16, padding: "20px 22px",
      border: `1px solid ${C.border}`, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", background: dimColor || C.accentDim, opacity: 0.5,
      }} />
      <div style={{ fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: -0.5 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

function Section({ children, emoji, title }) {
  return (
    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: 1.2 }}>
      <span style={{ fontSize: 18 }}>{emoji}</span> {title || children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
      <div style={{ color: C.textDim, fontSize: 11, marginBottom: 4 }}>{label || payload[0]?.name}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.accent, fontSize: 14, fontWeight: 700 }}>{fmt(p.value)}</div>
      ))}
    </div>
  );
}

const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

function CardBox({ children, style }) {
  return <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
}

function DataTable({ headers, rows, totalLabel, totalValue }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", fontSize: 13 }}>
        <thead>
          <tr>{headers.map((h, i) => (
            <th key={i} style={{ textAlign: i >= headers.length - 2 ? "right" : "left", padding: "8px 12px", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "rgba(30,41,59,0.5)" : "transparent" }}>
              {cells.map((cell, j) => (
                <td key={j} style={{
                  padding: "10px 12px",
                  textAlign: j >= headers.length - 2 ? "right" : "left",
                  fontWeight: j === headers.length - 2 ? 700 : 400,
                  color: j >= headers.length - 1 ? C.textMuted : j >= headers.length - 2 ? C.text : C.textDim,
                  borderRadius: j === 0 ? "8px 0 0 8px" : j === cells.length - 1 ? "0 8px 8px 0" : 0,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
          {totalLabel && (
            <tr style={{ borderTop: `2px solid ${C.border}` }}>
              <td colSpan={headers.length - 1} style={{ padding: 12, fontWeight: 800, color: C.accent, borderTop: `2px solid ${C.border}` }}>{totalLabel}</td>
              <td style={{ padding: 12, textAlign: "right", fontWeight: 800, color: C.accent, borderTop: `2px solid ${C.border}` }}>{totalValue}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── TAB: RESUMEN ───
function TabResumen({ d }) {
  const r = d.resumen;
  const morosidad = r.total_unidades ? pct(r.unidades_morosas, r.total_unidades) : "—";
  const ratioIG = r.total_gastos ? (r.total_ingresos / r.total_gastos).toFixed(2) + "x" : "—";
  const mesesReserva = r.total_gastos ? (r.saldo_disponible / r.total_gastos).toFixed(1) : "—";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Saldo Disponible" value={fmt(r.saldo_disponible)} subtitle={`Al cierre del mes`} color={C.green} dimColor={C.greenDim} icon="💵" />
        <KpiCard label="Saldo Patrimonial" value={fmt(r.saldo_final)} subtitle="Incluye póliza y ajustes" color={C.accent} icon="🏛️" />
        <KpiCard label="Morosidad" value={morosidad} subtitle={`${r.unidades_morosas} de ${r.total_unidades} unidades`} color={C.red} dimColor={C.redDim} icon="⚠️" />
        <KpiCard label="Cartera Vencida" value={fmt(r.cxc_total)} subtitle="Total cuentas por cobrar" color={C.amber} dimColor={C.amberDim} icon="📑" />
      </div>

      <CardBox style={{ marginBottom: 24 }}>
        <Section emoji="⚖️" title="Balance del Mes" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Movimientos de Caja</div>
            {[
              { l: "Saldo Inicial", v: r.saldo_inicial, c: C.text },
              { l: "(+) Alícuotas cobradas", v: r.total_ingresos, c: C.green },
              { l: "(+) Otros ingresos", v: r.otros_ingresos, c: C.green },
              { l: "(-) Gastos del mes", v: r.total_gastos, c: C.red, neg: true },
              { l: "= Saldo Disponible", v: r.saldo_disponible, c: C.accent, bold: true },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ color: C.textDim, fontSize: 13, fontWeight: row.bold ? 700 : 400 }}>{row.l}</span>
                <span style={{ color: row.c, fontWeight: 700, fontSize: 14 }}>{row.neg ? "-" : ""}{fmt(row.v)}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Ajustes Patrimoniales</div>
            {[
              { l: "(+) Póliza inversión", v: r.poliza, c: C.green },
              { l: "(-) Alícuotas anticipadas", v: r.anticipos, c: C.amber, neg: true },
              { l: "(-) Cuentas por pagar", v: r.cxp_total, c: C.red, neg: true },
              { l: "= Saldo Patrimonial", v: r.saldo_final, c: C.accent, bold: true },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ color: C.textDim, fontSize: 13, fontWeight: row.bold ? 700 : 400 }}>{row.l}</span>
                <span style={{ color: row.c, fontWeight: 700, fontSize: 14 }}>{row.neg ? "-" : ""}{fmt(row.v)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardBox>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <KpiCard label="Ratio Ingreso/Gasto" value={ratioIG} subtitle="Meta: ≥ 1.5x" color={C.green} dimColor={C.greenDim} icon="📈" />
        <KpiCard label="Póliza de Reserva" value={fmt(r.poliza)} subtitle="Banco Internacional" color={C.purple} dimColor={C.purpleDim} icon="🔒" />
        <KpiCard label="Anticipos Recibidos" value={fmt(r.anticipos)} subtitle="Alícuotas adelantadas" color={C.accent} icon="⏩" />
        <KpiCard label="Meses de Reserva" value={mesesReserva} subtitle="Con gasto mensual actual" color={C.amber} dimColor={C.amberDim} icon="📅" />
      </div>
    </div>
  );
}

// ─── TAB: INGRESOS Y GASTOS ───
function TabIngresos({ d }) {
  const r = d.resumen;
  const gastosData = d.gastos.map((g) => ({ name: g.categoria, value: g.monto })).sort((a, b) => b.value - a.value);
  const totalGastos = gastosData.reduce((s, g) => s + g.value, 0);

  // Trend histórico
  const trend = d.resumenHistorico.map((m) => ({ mes: m.mes, ingresos: m.total_ingresos, gastos: m.total_gastos }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Ingresos del Mes" value={fmt(r.total_ingresos)} color={C.green} dimColor={C.greenDim} icon="📥" />
        <KpiCard label="Otros Ingresos" value={fmt(r.otros_ingresos)} color={C.green} dimColor={C.greenDim} icon="➕" />
        <KpiCard label="Gastos del Mes" value={fmt(r.total_gastos)} color={C.red} dimColor={C.redDim} icon="📤" />
        <KpiCard label="Resultado Neto" value={fmt(r.total_ingresos + r.otros_ingresos - r.total_gastos)} color={r.total_ingresos + r.otros_ingresos - r.total_gastos >= 0 ? C.green : C.red} icon="📊" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* TREND */}
        <CardBox>
          <Section emoji="📈" title="Tendencia Mensual" />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.red} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + v} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke={C.green} strokeWidth={2.5} fill="url(#gI)" dot={{ r: 4, fill: C.green, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="gastos" name="Gastos" stroke={C.red} strokeWidth={2} fill="url(#gG)" dot={{ r: 3, fill: C.red, strokeWidth: 0 }} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
            <span style={{ fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 3, background: C.green, borderRadius: 2, display: "inline-block" }} /> Ingresos</span>
            <span style={{ fontSize: 12, color: C.red, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 3, background: C.red, borderRadius: 2, display: "inline-block", borderStyle: "dashed" }} /> Gastos</span>
          </div>
        </CardBox>

        {/* PIE */}
        <CardBox>
          <Section emoji="🥧" title="Distribución de Gastos" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={gastosData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" labelLine={false} label={PieLabel} strokeWidth={2} stroke={C.bg}>
                {gastosData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "#1e293b", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {gastosData.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textDim }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i] }} />
                {g.name}
              </div>
            ))}
          </div>
        </CardBox>
      </div>

      {/* GASTOS TABLE */}
      <CardBox>
        <Section emoji="📋" title="Detalle de Gastos" />
        <DataTable
          headers={["Categoría", "Monto", "% del Total"]}
          rows={gastosData.map((g, i) => [
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i], flexShrink: 0 }} />
              {g.name}
            </div>,
            fmt(g.value),
            pct(g.value, totalGastos),
          ])}
          totalLabel="TOTAL GASTOS"
          totalValue={fmt(totalGastos)}
        />
      </CardBox>
    </div>
  );
}

// ─── TAB: CARTERA ───
function TabCartera({ d }) {
  const r = d.resumen;
  const sorted = [...d.cxc].sort((a, b) => b.total - a.total);
  const maxDebt = sorted[0]?.total || 1;
  const avgDebt = sorted.length ? (sorted.reduce((s, c) => s + c.total, 0) / sorted.length) : 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Total por Cobrar" value={fmt(r.cxc_total)} color={C.red} dimColor={C.redDim} icon="💳" subtitle={`${sorted.length} propietarios en mora`} />
        <KpiCard label="Deuda Promedio" value={fmt(avgDebt)} color={C.amber} dimColor={C.amberDim} icon="📊" subtitle="Por propietario moroso" />
        <KpiCard label="Mayor Deudor" value={fmt(maxDebt)} color={C.red} dimColor={C.redDim} icon="🔴" subtitle={sorted[0] ? `${sorted[0].casa} — desde ${sorted[0].desde}` : "—"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* BAR CHART */}
        <CardBox>
          <Section emoji="📊" title="Top 10 Deudores" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sorted.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + v} />
              <YAxis type="category" dataKey="casa" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: "#1e293b", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{d.casa} — {d.propietario}</div>
                    <div style={{ color: C.red, fontSize: 16, fontWeight: 800, marginTop: 4 }}>{fmt(d.total)}</div>
                    <div style={{ color: C.textMuted, fontSize: 11 }}>Desde: {d.desde}</div>
                  </div>
                );
              }} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={20}>
                {sorted.slice(0, 10).map((_, i) => <Cell key={i} fill={i < 3 ? C.red : i < 6 ? "#fb923c" : C.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardBox>

        {/* RANKING LIST */}
        <CardBox>
          <Section emoji="🔴" title="Detalle de Cartera" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto" }}>
            {sorted.map((d, i) => {
              const w = (d.total / maxDebt) * 100;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: i < 3 ? C.redDim : "rgba(100,116,139,0.15)",
                    color: i < 3 ? C.red : C.textMuted, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.casa} — {d.propietario}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? C.red : C.amber, flexShrink: 0, marginLeft: 8 }}>{fmt(d.total)}</span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, width: w + "%", background: i < 3 ? `linear-gradient(90deg, ${C.red}, #fb923c)` : `linear-gradient(90deg, ${C.amber}, ${C.green})` }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Desde {d.desde}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBox>
      </div>
    </div>
  );
}

// ─── TAB: CxP ───
function TabCxP({ d }) {
  const r = d.resumen;
  const sorted = [...d.cxp].sort((a, b) => b.monto - a.monto);
  const totalCxP = sorted.reduce((s, c) => s + c.monto, 0);
  const cobertura = r.saldo_disponible && totalCxP ? ((r.saldo_disponible / totalCxP) * 100).toFixed(0) + "%" : "—";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Total por Pagar" value={fmt(totalCxP)} color={C.red} dimColor={C.redDim} icon="📤" subtitle="Obligaciones del mes" />
        <KpiCard label="Cobertura" value={cobertura} color={C.green} dimColor={C.greenDim} icon="🛡️" subtitle="Saldo cubre obligaciones" />
        <KpiCard label="Proveedores" value={sorted.length} color={C.accent} icon="🏢" subtitle="Con factura pendiente" />
      </div>

      <CardBox style={{ marginBottom: 24 }}>
        <Section emoji="🏢" title="Proveedores — Cuentas por Pagar" />
        <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 36)}>
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
            <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + v} />
            <YAxis type="category" dataKey="proveedor" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div style={{ background: "#1e293b", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{p.proveedor}</div>
                  <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{p.detalle}</div>
                  <div style={{ color: C.accent, fontSize: 16, fontWeight: 800, marginTop: 4 }}>{fmt(p.monto)}</div>
                </div>
              );
            }} />
            <Bar dataKey="monto" radius={[0, 6, 6, 0]} barSize={22}>
              {sorted.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardBox>

      <CardBox>
        <Section emoji="📋" title="Detalle de Obligaciones" />
        <DataTable
          headers={["Proveedor", "Concepto", "Monto"]}
          rows={sorted.map((c) => [c.proveedor, c.detalle, fmt(c.monto)])}
          totalLabel="TOTAL CUENTAS POR PAGAR"
          totalValue={fmt(totalCxP)}
        />
      </CardBox>
    </div>
  );
}

// ─── LOADING SCREEN ───
function Loading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #22d3ee, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 20, animation: "pulse 2s infinite" }}>A</div>
      <div style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Cargando datos...</div>
      <div style={{ color: C.textMuted, fontSize: 13 }}>Conectando con Google Sheets</div>
      <style>{`@keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }`}</style>
    </div>
  );
}

// ─── ERROR SCREEN ───
function ErrorScreen({ error, onRetry }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Error al cargar datos</div>
      <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 20, textAlign: "center", maxWidth: 400 }}>{error}</div>
      <div style={{ color: C.textDim, fontSize: 12, marginBottom: 20, textAlign: "center", maxWidth: 500, lineHeight: 1.6 }}>
        Verifica que:<br />
        1. El SHEET_ID en <code style={{ background: C.card, padding: "2px 6px", borderRadius: 4 }}>src/config.js</code> sea correcto<br />
        2. El Google Sheet sea público (Cualquier persona con el enlace)<br />
        3. Las pestañas tengan los nombres: RESUMEN, GASTOS, CXC, CXP, INGRESOS
      </div>
      <button onClick={onRetry} style={{
        padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #22d3ee, #6366f1)", color: "#fff",
        fontSize: 14, fontWeight: 700,
      }}>Reintentar</button>
    </div>
  );
}

// ─── MAIN APP ───
export default function App() {
  const [allData, setAllData] = useState(null);
  const [mesActual, setMesActual] = useState(null);
  const [activeTab, setActiveTab] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchAllData()
      .then((data) => {
        setAllData(data);
        setMesActual(data.meses[data.meses.length - 1]); // último mes
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorScreen error={error} onRetry={loadData} />;
  if (!allData || !mesActual) return null;

  const d = filterByMes(allData, mesActual);
  const tabs = [
    { id: "resumen", label: "Resumen", icon: "📊" },
    { id: "ingresos", label: "Ingresos y Gastos", icon: "💰" },
    { id: "cartera", label: "Cartera", icon: "📋" },
    { id: "cxp", label: "Cuentas x Pagar", icon: "🏦" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        padding: "24px 24px 18px", borderBottom: `1px solid ${C.border}`, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 30% 0%, rgba(34,211,238,0.08) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #22d3ee, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: "#fff",
            }}>A</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: -0.5, color: "#fff" }}>{NOMBRE_URBANIZACION.toUpperCase()}</h1>
              <div style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>Dashboard Financiero</div>
            </div>
          </div>

          {/* MONTH SELECTOR */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>MES:</span>
            <select
              value={mesActual}
              onChange={(e) => setMesActual(e.target.value)}
              style={{
                background: "rgba(30,41,59,0.8)", color: C.text, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 700,
                fontFamily: "inherit", cursor: "pointer", outline: "none",
                appearance: "none", WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
                paddingRight: 30,
              }}
            >
              {allData.meses.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, padding: "12px 20px", background: "rgba(15,23,42,0.8)", borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 10, border: activeTab === t.id ? `1px solid rgba(34,211,238,0.3)` : `1px solid transparent`,
            cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap",
            background: activeTab === t.id ? "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))" : "transparent",
            color: activeTab === t.id ? C.accent : C.textMuted, transition: "all 0.2s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "20px 20px 40px" }}>
        {activeTab === "resumen" && <TabResumen d={d} />}
        {activeTab === "ingresos" && <TabIngresos d={d} />}
        {activeTab === "cartera" && <TabCartera d={d} />}
        {activeTab === "cxp" && <TabCxP d={d} />}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: "center", padding: "16px 20px", fontSize: 11, color: C.textMuted, borderTop: `1px solid ${C.border}` }}>
        {NOMBRE_URBANIZACION} — Dashboard Financiero · Datos del mes: {mesActual}
      </div>
    </div>
  );
}
