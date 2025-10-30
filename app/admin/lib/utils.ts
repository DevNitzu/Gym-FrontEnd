// lib/utils.ts
export const LOCALE = "es-EC";

export function zpad(n: number, w = 2) { return n.toString().padStart(w, "0"); }
export function zpad3(n: number) { return zpad(n, 3); }

export function money(n?: number) {
    return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD", minimumFractionDigits: 2 })
        .format(n ?? 0);
}

export function addDuration(baseISO: string, unidad: string, cantidad: number): string {
    const d = new Date(baseISO);
    if (!Number.isFinite(cantidad)) cantidad = 0;
    const u = (unidad || "").toLowerCase();
    if (u === "dia" || u === "día" || u === "d") d.setDate(d.getDate() + cantidad);
    else if (u === "mes") {
        const day = d.getDate(); d.setMonth(d.getMonth() + cantidad); if (d.getDate() < day) d.setDate(0);
    } else if (u === "año" || u === "anio" || u === "annio" || u === "year") d.setFullYear(d.getFullYear() + cantidad);
    return d.toISOString();
}

export const SHORT_DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export function normalizeDayToUI(dia_semana: number) { return dia_semana === 0 ? 7 : dia_semana; }
export function uiDayToApi(uiDay: number) { return uiDay === 7 ? 0 : uiDay; }

export function timeToMinutes(t: string): number {
    const isoMatch = t.match(/T(\d{2}):(\d{2}):?(\d{2})?/);
    const hms = isoMatch ? [isoMatch[1], isoMatch[2], isoMatch[3] || "00"] : t.split(":");
    const [hh, mm] = [parseInt(hms[0], 10), parseInt(hms[1], 10)];
    if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
    return hh * 60 + mm;
}
export function toHHMM(m: number) {
    const h = Math.floor(m / 60), mm = m % 60; return `${zpad(h)}:${zpad(mm)}`;
}
export function toHHMMSS(time: string | number) {
    if (typeof time === "number") {
        const h = Math.floor(time / 60), m = time % 60; return `${zpad(h)}:${zpad(m)}:00`;
    }
    const parts = time.split(":");
    const h = zpad(parseInt(parts[0] || "0", 10));
    const m = zpad(parseInt(parts[1] || "0", 10));
    const s = zpad(parseInt(parts[2] || "0", 10));
    return `${h}:${m}:${s}`;
}

export function groupByDay<T extends { activo: boolean; dia_semana: number; hora_apertura: string; hora_cierre: string }>(data: T[]) {
    type Range = { open: number; close: number; raw: T };
    const map = new Map<number, Range[]>();
    data.filter(h => h.activo).forEach(h => {
        const d = normalizeDayToUI(h.dia_semana);
        const bucket = map.get(d) ?? [];
        bucket.push({ open: timeToMinutes(h.hora_apertura), close: timeToMinutes(h.hora_cierre), raw: h });
        map.set(d, bucket);
    });
    map.forEach((arr, k) => { arr.sort((a, b) => a.open - b.open); map.set(k, arr); });
    return map;
}
