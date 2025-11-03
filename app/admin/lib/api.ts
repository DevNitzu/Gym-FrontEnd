// lib/api.ts
import { API_BASE, authFetch, buildAuthHeaders } from "./auth";
import {
    ApiCliente, ApiEmpleado, ApiEstadoPago, ApiGimnasio, ApiHorarioGimnasio,
    ApiMembresia, ApiMetodoPago, ApiPrecioMembresia
} from "./types";

/* Gimnasios por empresa */
export async function apiListGimnasiosByEmpresa(id_empresa: string): Promise<ApiGimnasio[]> {
    const url = `${API_BASE}/api/v1/gimnasios/${encodeURIComponent(id_empresa)}`;
    const res = await authFetch(url, { headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
    const data = await res.json();
    return Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
}

/* Horarios */
export async function apiCreateHorario(h: { id_gimnasio: number; dia_semana: number; hora_apertura: string; hora_cierre: string; }) {
    const res = await authFetch(`${API_BASE}/api/v1/horario_gimnasios`, {
        method: "POST", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(h),
    });
    if (!res.ok) throw new Error(`Error ${res.status} al crear horario`);
    return (await res.json()) as ApiHorarioGimnasio;
}
export async function apiUpdateHorario(id: number, h: { id_gimnasio: number; dia_semana: number; hora_apertura: string; hora_cierre: string; }) {
    const res = await authFetch(`${API_BASE}/api/v1/horario_gimnasios/${id}`, {
        method: "PUT", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(h),
    });
    if (!res.ok) throw new Error(`Error ${res.status} al actualizar horario`);
    return (await res.json()) as ApiHorarioGimnasio;
}
export async function apiDeleteHorario(id: number) {
    const res = await authFetch(`${API_BASE}/api/v1/horario_gimnasios/${id}`, { method: "DELETE", headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`Error ${res.status} al eliminar horario`);
}

/* Planes/Precios de membresías */
export async function apiListPrecioMembresias(id_gimnasio: number): Promise<ApiPrecioMembresia[]> {
    const res = await authFetch(`${API_BASE}/api/v1/precio_membresias/gimnasio/${encodeURIComponent(id_gimnasio)}`, {
        headers: buildAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al listar membresías`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
}
export async function apiCreatePrecioMembresia(body: { id_gimnasio: number; tipo: string; precio: number }) {
    const res = await authFetch(`${API_BASE}/api/v1/precio_membresias`, {
        method: "POST", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al crear membresía`);
    return (await res.json()) as ApiPrecioMembresia;
}
export async function apiUpdatePrecioMembresia(id: number, body: { id_gimnasio: number; tipo: string; precio: number }) {
    const res = await authFetch(`${API_BASE}/api/v1/precio_membresias/${id}`, {
        method: "PUT", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al actualizar membresía`);
    return (await res.json()) as ApiPrecioMembresia;
}
export async function apiDeletePrecioMembresia(id: number) {
    const res = await authFetch(`${API_BASE}/api/v1/precio_membresias/${id}`, { method: "DELETE", headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status} al eliminar membresía`);
}

/* Catálogos pago */
export async function apiListEstadosPago(): Promise<ApiEstadoPago[]> {
    const res = await authFetch(`${API_BASE}/api/v1/estado_pagos`, { headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status} al listar estado_pagos`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
}
export async function apiCreateEstadoPago(nombre: string) {
    const res = await authFetch(`${API_BASE}/api/v1/estado_pagos`, {
        method: "POST", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ nombre }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al crear estado_pago`);
    return (await res.json()) as ApiEstadoPago;
}
export async function apiUpdateEstadoPago(id: number, nombre: string) {
    const res = await authFetch(`${API_BASE}/api/v1/estado_pagos/${id}`, {
        method: "PUT", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ nombre }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al actualizar estado_pago`);
    return (await res.json()) as ApiEstadoPago;
}
export async function apiDeleteEstadoPago(id: number) {
    const res = await authFetch(`${API_BASE}/api/v1/estado_pagos/${id}`, { method: "DELETE", headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status} al eliminar estado_pago`);
}

export async function apiListMetodoPagos(): Promise<ApiMetodoPago[]> {
    const res = await authFetch(`${API_BASE}/api/v1/metodo_pagos`, { headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status} al listar metodo_pagos`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
}
export async function apiCreateMetodoPago(nombre: string) {
    const res = await authFetch(`${API_BASE}/api/v1/metodo_pagos`, {
        method: "POST", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ nombre }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al crear metodo_pago`);
    return (await res.json()) as ApiMetodoPago;
}
export async function apiUpdateMetodoPago(id: number, nombre: string) {
    const res = await authFetch(`${API_BASE}/api/v1/metodo_pagos/${id}`, {
        method: "PUT", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ nombre }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al actualizar metodo_pago`);
    return (await res.json()) as ApiMetodoPago;
}
export async function apiDeleteMetodoPago(id: number) {
    const res = await authFetch(`${API_BASE}/api/v1/metodo_pagos/${id}`, { method: "DELETE", headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status} al eliminar metodo_pago`);
}

/* Clientes */
export async function apiListClientes(): Promise<ApiCliente[]> {
    const res = await authFetch(`${API_BASE}/api/v1/clientes`, { headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status} al listar clientes`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
}
export async function apiCreateCliente(body: { nombre: string; apellido: string; cedula: string; correo: string; telefono: string; contrasena?: string }) {
    const res = await authFetch(`${API_BASE}/api/v1/clientes`, {
        method: "POST", headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...body, fecha_creacion: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al crear cliente`);
    return (await res.json()) as ApiCliente;
}
export async function apiUpdateCliente(id: number, body: { nombre: string; apellido: string; cedula: string; correo: string; telefono: string; contrasena?: string }) {
    const res = await authFetch(`${API_BASE}/api/v1/clientes/${id}`, {
        method: "PUT", headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...body, fecha_creacion: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al actualizar cliente`);
    return (await res.json()) as ApiCliente;
}
export async function apiDeleteCliente(id: number) {
    const res = await authFetch(`${API_BASE}/api/v1/clientes/${id}`, { method: "DELETE", headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status} al eliminar cliente`);
}

/* Ventas de membresías */
export async function apiListMembresiasByGym(id_gimnasio: number): Promise<ApiMembresia[]> {
    const res = await authFetch(`${API_BASE}/api/v1/membresias/gimnasio/${encodeURIComponent(id_gimnasio)}`, {
        headers: buildAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al listar ventas`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
}
export async function apiCreateMembresia(body: Omit<ApiMembresia, "id_membresia" | "activo">) {
    const res = await authFetch(`${API_BASE}/api/v1/membresias`, {
        method: "POST", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al crear membresía`);
    return (await res.json()) as ApiMembresia;
}
export async function apiUpdateMembresia(id: number, body: Partial<Pick<ApiMembresia, "id_estado_pago" | "renovable">>) {
    const res = await authFetch(`${API_BASE}/api/v1/membresias/${id}`, {
        method: "PUT", headers: buildAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al actualizar membresía`);
    return (await res.json()) as ApiMembresia;
}
export async function apiDeleteMembresia(id: number) {
    const res = await authFetch(`${API_BASE}/api/v1/membresias/${id}`, { method: "DELETE", headers: buildAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status} al eliminar membresía`);
}

/* Empleados por gimnasio — consume DTO y mapea a ApiEmpleado */
export async function apiListEmpleadosByGimnasio(id_gimnasio: number): Promise<ApiEmpleado[]> {
    const url = `${API_BASE}/api/v1/empleadodto/gimnasio/${encodeURIComponent(id_gimnasio)}`;
    const res = await authFetch(url, { headers: buildAuthHeaders() });

    if (!res.ok) throw new Error(`HTTP ${res.status} al listar empleados del gimnasio`);

    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];

    // Mapea cada DTO a tu shape ApiEmpleado (inyectando asignación activa)
    const list: ApiEmpleado[] = rows.map((row: any) => {
        const emp = row?.empleado ?? {};
        const asignaciones: any[] = Array.isArray(row?.asignaciones) ? row.asignaciones : [];
        const asign = asignaciones.find(a => a?.activo) ?? asignaciones[0] ?? null;

        return {
            // Campos base del empleado
            id_empleado: emp?.id_empleado ?? 0,
            nombre: emp?.nombre ?? "",
            apellido: emp?.apellido ?? "",
            cedula: emp?.cedula ?? "",
            correo: emp?.correo ?? "",
            telefono: emp?.telefono ?? "",
            fecha_creacion: emp?.fecha_creacion ?? "",
            activo: Boolean(emp?.activo),

            // Estos dos son importantes para tu UI: los rellenamos desde la asignación
            id_empresa: asign?.id_empresa ?? 0,
            id_gimnasio: asign?.id_gimnasio ?? 0,

            // Si tu tipo ApiEmpleado tiene más campos opcionales, puedes mantenerlos aquí:
            // id_tipo_empleado: asign?.id_tipo_empleado ?? undefined,
            // ...otros opcionales
        } as ApiEmpleado;
    });

    // Filtrado defensivo (el endpoint ya filtra, pero por si algo viene mal)
    return list.filter(e => (e.id_gimnasio ?? 0) === Number(id_gimnasio));
}

// lib/api.ts
export async function apiListMembresiasIdsByGym(id_gimnasio: number): Promise<number[]> {
    const res = await authFetch(
        `${API_BASE}/api/v1/membresias/gimnasio/${encodeURIComponent(id_gimnasio)}`,
        { headers: buildAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status} al listar ventas`);
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    // Asumiendo que el backend devuelve objetos con id_membresia
    return json
        .map((x: any) => Number(x?.id_membresia))
        .filter((n: number) => Number.isFinite(n));
}
