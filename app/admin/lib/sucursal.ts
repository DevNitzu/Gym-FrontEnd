// lib/sucursal.ts
import { ApiGimnasio, EstadoSucursal, SucursalView } from "./types";
import { zpad3 } from "./utils";

export function estadoColor(e: EstadoSucursal) {
    if (e === "Abierta") return "success" as const;
    if (e === "Cerrada") return "danger" as const;
    return "warning" as const;
}

export function parseFromSid(sid: string) {
    const parts = sid.split("-");
    const gymPart = parts.slice(0, 2).join("-");
    const num = parseInt(parts[1], 10);
    return { gymIdStr: gymPart, gymIdNum: Number.isFinite(num) ? num : NaN };
}

export function mapGymToSucursalView(g: ApiGimnasio, sid: string): SucursalView {
    const gymId = `G-${zpad3(g.id_gimnasio)}`;
    const estado: EstadoSucursal = Number(g.activo) === 1 ? "Abierta" : "Cerrada";
    return {
        id: sid, gymId, nombre: g.nombre ?? "Gimnasio", ciudad: g.direccion ?? "—",
        estado, miembros: 0, aforo: 0, checkinsHoy: 0, telefono: g.telefono, correo: g.correo, fechaCreacion: g.fecha_creacion,
    };
}

