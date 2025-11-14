"use client";

import React from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Avatar,
    useDisclosure,
    Spinner,
} from "@heroui/react";
import type { Selection } from "@heroui/react";
import { Icon } from "@iconify/react";

/* ====================== Constantes ====================== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const DEFAULT_TIPO = 2; // 🔴 id_tipo_empleado por defecto = 2

/* ====================== Tipos API ====================== */
type ApiEmpleado = {
    nombre: string;
    apellido: string;
    cedula: string;
    correo: string;
    telefono: string;
    id_empresa: number;
    id_gimnasio: number | null;
    id_tipo_empleado: number;
    fecha_creacion: string;
    id_empleado: number;
    activo: boolean;
    contrasena?: string;
};

type ApiGimnasio = {
    id_gimnasio: number;
    id_empresa: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    activo?: number | boolean;
    fecha_creacion?: string;
};

type EmpleadoDTO = {
    empleado: {
        nombre: string;
        apellido: string;
        cedula: string;
        correo: string;
        telefono: string;
        fecha_creacion: string;
        id_empleado: number;
        activo: boolean;
    };
    asignaciones: Array<{
        id_empleado_asignacion?: number;
        id_empresa: number;
        nombre_empresa?: string;
        id_gimnasio: number;
        nombre_gimnasio?: string;
        id_tipo_empleado: number;
        tipo_empleado_nombre?: string;
        activo: boolean;
    }>;
};

type ApiEmpleadoAsignacion = {
    id_empresa: number;
    id_gimnasio: number;
    id_empleado: number;
    id_tipo_empleado: number;
    fecha_asignacion?: string;
    id_empleado_asignacion?: number;
    activo?: boolean;
};

/* ====================== Tipos UI ====================== */
type RolUI = "operario" | "vendedor" | "administrador";

type EmpleadoUI = {
    id_empleado?: number;
    nombres: string;
    nombre: string;
    apellido: string;
    email: string;
    cedula: string;
    telefono: string;
    id_empresa: number;
    id_gimnasio: number; // 0 = sin asignación (interno)
    rol: RolUI;
    id_tipo_empleado: number;
    activo: boolean;
    avatarUrl?: string;
    fecha_creacion?: string;
    contrasena?: string;
    id_empleado_asignacion: number; // para escenarios legacy
};

type GymOption = { key: string; label: string; value: number };

/* ====================== Utils ====================== */
function toBool(v: any): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    return String(v ?? "").toLowerCase() === "true";
}
function mapTipoToRol(tipo: number): RolUI {
    if (tipo === 1) return "administrador";
    if (tipo === 2) return "vendedor";
    return "operario";
}
function toNullableGym(id: number): number | null {
    return id === 0 ? null : id;
}

/** Normaliza desde ApiEmpleado (CRUD directo) a UI */
function normApiToUI(x: ApiEmpleado): EmpleadoUI {
    const tipo = Number(x.id_tipo_empleado ?? DEFAULT_TIPO);
    const rol = mapTipoToRol(tipo);
    return {
        id_empleado: Number(x.id_empleado),
        nombres: `${x.nombre ?? ""} ${x.apellido ?? ""}`.trim(),
        nombre: String(x.nombre ?? ""),
        apellido: String(x.apellido ?? ""),
        email: String(x.correo ?? ""),
        cedula: String(x.cedula ?? ""),
        telefono: String(x.telefono ?? ""),
        id_empresa: Number(x.id_empresa ?? 0),
        id_gimnasio: Number(x.id_gimnasio ?? 0),
        rol,
        id_tipo_empleado: tipo,
        activo: toBool(x.activo),
        fecha_creacion: String(x.fecha_creacion ?? ""),
        contrasena: undefined,
        id_empleado_asignacion: 0,
    };
}

/** Normaliza desde EmpleadoDTO (endpoint empleadoDTO/empresa/{id}) a UI */
function normDtoToUI(dto: EmpleadoDTO, fallbackEmpresaId: number): EmpleadoUI {
    const e = dto.empleado || ({} as EmpleadoDTO["empleado"]);
    // Tomamos la PRIMERA asignación activa (si existe) para id_gimnasio e id_tipo_empleado
    const asignActiva =
        (dto.asignaciones || []).find((a) => toBool(a.activo)) ||
        (dto.asignaciones || [])[0];

    const id_gimnasio = Number(asignActiva?.id_gimnasio ?? 0);
    const tipo = Number(asignActiva?.id_tipo_empleado ?? DEFAULT_TIPO);
    const rol = mapTipoToRol(tipo);

    return {
        id_empleado: Number(e.id_empleado ?? 0),
        nombres: `${e.nombre ?? ""} ${e.apellido ?? ""}`.trim(),
        nombre: String(e.nombre ?? ""),
        apellido: String(e.apellido ?? ""),
        email: String(e.correo ?? ""),
        cedula: String(e.cedula ?? ""),
        telefono: String(e.telefono ?? ""),
        id_empresa: Number(asignActiva?.id_empresa ?? fallbackEmpresaId ?? 0),
        id_gimnasio,
        rol,
        id_tipo_empleado: tipo,
        activo: toBool(e.activo),
        fecha_creacion: String(e.fecha_creacion ?? ""),
        contrasena: undefined,
        id_empleado_asignacion: Number(asignActiva?.id_empleado_asignacion ?? 0),
    };
}

/* ====================== Session helpers ====================== */
function getSession() {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("auth:token") : null;
    const empresa =
        typeof window !== "undefined" ? localStorage.getItem("auth:empresa") : null;
    return { token: token || "", empresa: empresa || "" };
}

/* ====================== Fetch helper (con token) ====================== */
async function apiFetch(path: string, init?: RequestInit) {
    const { token } = getSession();
    const headers = new Headers(init?.headers || {});
    headers.set("Accept", "application/json");
    if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        cache: "no-store",
        mode: "cors",
    });

    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const j = await res.json();
            msg = (j?.message || j?.detail || j?.error || msg) as string;
        } catch { }
        throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
}

/* ====================== API Empleados ====================== */
// GET /api/v1/empleadodto/empresa/{id_empresa}
async function listEmpleadosByEmpresaDTO(
    id_empresa: number
): Promise<EmpleadoUI[]> {
    const json = await apiFetch(
        `/api/v1/empleadodto/empresa/${encodeURIComponent(id_empresa)}`
    );
    const arr: EmpleadoDTO[] = Array.isArray(json?.data) ? json.data : [];
    return arr.map((dto) => normDtoToUI(dto, id_empresa));
}

async function createEmpleado(body: EmpleadoUI): Promise<EmpleadoUI> {
    const payload: Omit<ApiEmpleado, "id_empleado" | "activo"> & {
        contrasena?: string;
    } = {
        nombre: body.nombre,
        apellido: body.apellido,
        cedula: body.cedula,
        correo: body.email,
        telefono: body.telefono,
        id_empresa: body.id_empresa,
        id_gimnasio: toNullableGym(body.id_gimnasio),
        id_tipo_empleado: Number(body.id_tipo_empleado ?? DEFAULT_TIPO),
        fecha_creacion: body.fecha_creacion || new Date().toISOString(),
        contrasena: body.contrasena,
    };
    const created = await apiFetch(`/api/v1/empleados`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return normApiToUI(created as ApiEmpleado);
}

async function updateEmpleadoApi(
    id_empleado: number,
    body: EmpleadoUI
): Promise<EmpleadoUI> {
    const payload: Partial<ApiEmpleado> = {
        nombre: body.nombre,
        apellido: body.apellido,
        cedula: body.cedula,
        correo: body.email,
        telefono: body.telefono,
        id_empresa: body.id_empresa,
        id_gimnasio: toNullableGym(body.id_gimnasio),
        id_tipo_empleado: Number(body.id_tipo_empleado ?? DEFAULT_TIPO),
        contrasena: body.contrasena,
        activo: body.activo,
    };
    const updated = await apiFetch(`/api/v1/empleados/${id_empleado}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    return normApiToUI(updated as ApiEmpleado);
}

async function deleteEmpleadoApi(id_empleado: number): Promise<void> {
    await apiFetch(`/api/v1/empleados/${id_empleado}`, { method: "DELETE" });
}

/* ====================== API Gimnasios ====================== */
async function listGimnasiosByEmpresa(
    id_empresa: number
): Promise<GymOption[]> {
    const data = await apiFetch(
        `/api/v1/gimnasios/${encodeURIComponent(id_empresa)}`
    );
    const list: ApiGimnasio[] = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];
    return list.map((g) => ({
        key: String(g.id_gimnasio),
        label: g.nombre,
        value: g.id_gimnasio,
    }));
}

/* ====================== API Empleado DTO & Asignaciones ====================== */
async function fetchEmpleadoDTO(
    id_empleado: number
): Promise<EmpleadoDTO | null> {
    const dto = await apiFetch(`/api/v1/empleadodto/empleado/${id_empleado}`);
    if (!dto || !dto.empleado) return null;
    return dto as EmpleadoDTO;
}

async function createEmpleadoAsignacion(
    body: ApiEmpleadoAsignacion
): Promise<ApiEmpleadoAsignacion> {
    return apiFetch(`/api/v1/empleado_asignacion`, {
        method: "POST",
        body: JSON.stringify({
            id_empresa: body.id_empresa,
            id_gimnasio: body.id_gimnasio,
            id_empleado: body.id_empleado,
            id_tipo_empleado: Number(body.id_tipo_empleado ?? DEFAULT_TIPO), // 🔴 default 2
            fecha_asignacion: body.fecha_asignacion ?? new Date().toISOString(),
        }),
    });
}

async function updateEmpleadoAsignacion(
    id_empleado_asignacion: number,
    body: Pick<
        ApiEmpleadoAsignacion,
        "id_empresa" | "id_gimnasio" | "id_empleado" | "id_tipo_empleado"
    >
): Promise<ApiEmpleadoAsignacion> {
    return apiFetch(`/api/v1/empleado_asignacion/${id_empleado_asignacion}`, {
        method: "PUT",
        body: JSON.stringify({
            ...body,
            id_tipo_empleado: Number(body.id_tipo_empleado ?? DEFAULT_TIPO),
        }),
    });
}

async function deleteEmpleadoAsignacion(
    id_empleado_asignacion: number
): Promise<void> {
    await apiFetch(`/api/v1/empleado_asignacion/${id_empleado_asignacion}`, {
        method: "DELETE",
    });
}

/* ====================== Página ====================== */
export default function EmpleadosPage() {
    const [rows, setRows] = React.useState<EmpleadoUI[]>([]);
    const [q, setQ] = React.useState("");
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [notif, setNotif] = React.useState<string | null>(null);

    const [editing, setEditing] = React.useState<EmpleadoUI | null>(null);
    const modalEmpleado = useDisclosure();

    // Modal de Asignaciones
    const [asigEmpleado, setAsigEmpleado] =
        React.useState<EmpleadoUI | null>(null);
    const modalAsig = useDisclosure();

    // Gimnasios
    const [gyms, setGyms] = React.useState<GymOption[]>([]);
    const [gymsErr, setGymsErr] = React.useState<string | null>(null);
    const [gymsLoading, setGymsLoading] = React.useState<boolean>(false);

    React.useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const { empresa } = getSession();
                const empresaId = Number(empresa || 0);
                if (!empresaId)
                    throw new Error("No se encontró id_empresa en la sesión.");
                const all = await listEmpleadosByEmpresaDTO(empresaId);
                if (!alive) return;
                setRows(all);
            } catch (e: any) {
                if (!alive) return;
                setErr(e?.message || "No se pudo obtener empleados.");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        (async () => {
            try {
                setGymsLoading(true);
                setGymsErr(null);
                const { empresa } = getSession();
                const empresaId = Number(empresa || 0);
                if (!empresaId)
                    throw new Error("No se encontró id_empresa en la sesión.");
                const g = await listGimnasiosByEmpresa(empresaId);
                if (!alive) return;
                setGyms(g);
            } catch (e: any) {
                if (!alive) return;
                setGymsErr(e?.message || "No se pudieron cargar los gimnasios.");
            } finally {
                if (alive) setGymsLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const filtrados = React.useMemo(() => {
        if (!q.trim()) return rows;
        const s = q.toLowerCase();
        return rows.filter(
            (e) =>
                e.nombres.toLowerCase().includes(s) ||
                e.email.toLowerCase().includes(s) ||
                e.cedula.toLowerCase().includes(s) ||
                String(e.id_empleado ?? "").toLowerCase().includes(s)
        );
    }, [q, rows]);

    function onNew() {
        const { empresa } = getSession();
        const empresaId = Number(empresa || 0);
        const tipoDefault = DEFAULT_TIPO; // 2
        setEditing({
            nombres: "",
            nombre: "",
            apellido: "",
            email: "",
            cedula: "",
            telefono: "",
            id_empresa: empresaId || 0,
            id_gimnasio: 0,
            rol: mapTipoToRol(tipoDefault), // "vendedor"
            id_tipo_empleado: tipoDefault, // 🔴 2
            activo: true,
            contrasena: "",
            fecha_creacion: new Date().toISOString(),
            id_empleado_asignacion: 0,
        });
        modalEmpleado.onOpen();
    }

    function openAsignaciones(emp: EmpleadoUI) {
        setAsigEmpleado(emp);
        modalAsig.onOpen();
    }

    async function onEdit(emp: EmpleadoUI) {
        setEditing({
            ...emp,
            id_empleado_asignacion: emp.id_empleado_asignacion ?? 0,
            id_tipo_empleado: Number(emp.id_tipo_empleado ?? DEFAULT_TIPO),
            rol: mapTipoToRol(Number(emp.id_tipo_empleado ?? DEFAULT_TIPO)),
        });
        modalEmpleado.onOpen();
    }

    async function onDelete(id_empleado?: number) {
        if (!id_empleado) return;
        const ok = confirm("¿Eliminar este empleado?");
        if (!ok) return;
        try {
            await deleteEmpleadoApi(id_empleado);
            setRows((prev) => prev.filter((e) => e.id_empleado !== id_empleado));
            setNotif("Empleado eliminado.");
        } catch (e: any) {
            setNotif(e?.message || "No se pudo eliminar.");
        }
    }

    async function onSaveEmpleado() {
        if (!editing) return;
        if (
            !editing.nombre.trim() ||
            !editing.apellido.trim() ||
            !editing.email.trim() ||
            !editing.cedula.trim()
        ) {
            setNotif("Completa: nombre, apellido, correo y cédula.");
            return;
        }
        if (!editing.id_empleado && !editing.contrasena?.trim()) {
            setNotif("Para crear, define una contraseña.");
            return;
        }

        if (!editing.id_tipo_empleado) {
            setEditing((p) => (p ? { ...p, id_tipo_empleado: DEFAULT_TIPO } : p));
        }

        setSaving(true);
        setNotif(null);

        try {
            if (editing.id_empleado) {
                const saved = await updateEmpleadoApi(editing.id_empleado, {
                    ...editing,
                    id_tipo_empleado: Number(editing.id_tipo_empleado ?? DEFAULT_TIPO),
                });
                setRows((prev) =>
                    prev.map((e) => (e.id_empleado === saved.id_empleado ? saved : e))
                );
                setNotif("Empleado actualizado.");
            } else {
                const created = await createEmpleado({
                    ...editing,
                    id_tipo_empleado: Number(editing.id_tipo_empleado ?? DEFAULT_TIPO),
                });
                setRows((prev) => [created, ...prev]);
                setNotif("Empleado creado.");
            }
            modalEmpleado.onClose();
        } catch (e: any) {
            setNotif(e?.message || "No se pudo guardar.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="w-full h-full">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-default-100 ring-1 ring-default-200">
                            <Icon icon="solar:users-group-two-rounded-bold-duotone" className="text-xl" />
                        </span>
                        <div className="flex flex-col gap-0.5">
                            <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                                Empleados
                            </h1>
                            <p className="text-xs text-default-500">
                                Gestiona el personal y sus asignaciones por gimnasio.
                            </p>
                        </div>
                    </div>

                    <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
                        <Input
                            aria-label="Buscar empleados"
                            placeholder="Buscar por nombre, correo, cédula…"
                            variant="bordered"
                            value={q}
                            onValueChange={setQ}
                            startContent={<Icon icon="mdi:magnify" width={18} height={18} />}
                            className="w-full sm:w-64 md:w-72"
                            radius="lg"
                            size="sm"
                        />
                        <Button
                            color="primary"
                            startContent={
                                <Icon icon="mdi:account-plus" width={18} height={18} />
                            }
                            onPress={onNew}
                            className="w-full sm:w-auto"
                        >
                            Nuevo
                        </Button>
                    </div>
                </div>

                {!!notif && (
                    <Chip
                        color={notif.includes("No se pudo") ? "warning" : "success"}
                        variant="flat"
                    >
                        {notif}
                    </Chip>
                )}

                <Card className="border bg-background/80 backdrop-blur rounded-2xl shadow-sm">
                    <CardHeader className="font-semibold border-b border-default-100 py-3 px-4 sm:px-6">
                        Listado de empleados
                    </CardHeader>
                    <CardBody className="p-4 sm:p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Spinner size="lg" />
                            </div>
                        ) : err ? (
                            <div className="text-center text-warning-600">{err}</div>
                        ) : (
                            <>
                                {/* Mobile (cards) */}
                                <div className="sm:hidden space-y-3">
                                    {filtrados.length === 0 && (
                                        <div className="text-center text-default-500 py-8">
                                            Sin resultados
                                        </div>
                                    )}

                                    {filtrados.map((e) => (
                                        <div
                                            key={e.id_empleado}
                                            className="rounded-xl border bg-background/90 p-3 shadow-sm"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Avatar
                                                    isBordered
                                                    radius="full"
                                                    size="sm"
                                                    src={e.avatarUrl}
                                                    name={e.nombres}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="font-medium truncate">
                                                            {e.nombres}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-default-500 mt-1">
                                                        ID: {e.id_empleado}
                                                    </div>
                                                    <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
                                                        <span className="break-words">{e.email}</span>
                                                        <span className="text-default-500">
                                                            C.I.: {e.cedula || "—"}
                                                        </span>
                                                        {e.telefono && (
                                                            <span className="text-default-500">
                                                                {e.telefono}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => onEdit(e)}
                                                >
                                                    <Icon icon="mdi:pencil" width={18} height={18} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => openAsignaciones(e)}
                                                    startContent={
                                                        <Icon icon="solar:map-point-bold-duotone" />
                                                    }
                                                >
                                                    Asignaciones
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="light"
                                                    onPress={() => onDelete(e.id_empleado)}
                                                >
                                                    <Icon icon="mdi:trash-can" width={18} height={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop (tabla) */}
                                <div className="hidden sm:block">
                                    <Table aria-label="Tabla de empleados" removeWrapper>
                                        <TableHeader>
                                            <TableColumn>EMPLEADO</TableColumn>
                                            <TableColumn>CÉDULA</TableColumn>
                                            <TableColumn>CORREO</TableColumn>
                                            <TableColumn className="text-right">
                                                ACCIONES
                                            </TableColumn>
                                        </TableHeader>
                                        <TableBody emptyContent="Sin resultados">
                                            {filtrados.map((e) => (
                                                <TableRow key={e.id_empleado}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                isBordered
                                                                radius="full"
                                                                size="sm"
                                                                src={e.avatarUrl}
                                                                name={e.nombres}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {e.nombres}
                                                                </span>
                                                                {e.telefono ? (
                                                                    <span className="text-xs text-default-500">
                                                                        {e.telefono}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{e.cedula}</TableCell>
                                                    <TableCell className="break-words">
                                                        {e.email}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="light"
                                                                onPress={() => onEdit(e)}
                                                            >
                                                                <Icon
                                                                    icon="mdi:pencil"
                                                                    width={18}
                                                                    height={18}
                                                                />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="flat"
                                                                onPress={() => openAsignaciones(e)}
                                                                startContent={
                                                                    <Icon icon="solar:map-point-bold-duotone" />
                                                                }
                                                            >
                                                                Asignaciones
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                color="danger"
                                                                variant="light"
                                                                onPress={() => onDelete(e.id_empleado)}
                                                            >
                                                                <Icon
                                                                    icon="mdi:trash-can"
                                                                    width={18}
                                                                    height={18}
                                                                />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>

                {/* Modal Empleado */}
                <EmpleadoModal
                    isOpen={modalEmpleado.isOpen}
                    onOpenChange={modalEmpleado.onOpenChange}
                    data={editing}
                    setData={setEditing}
                    onSave={onSaveEmpleado}
                    saving={saving}
                />

                {/* Modal Asignaciones */}
                <AsignacionesModal
                    isOpen={modalAsig.isOpen}
                    onOpenChange={modalAsig.onOpenChange}
                    empleado={asigEmpleado}
                    gyms={gyms}
                    gymsLoading={gymsLoading}
                    gymsErr={gymsErr}
                />
            </div>
        </div>
    );
}

/* ====================== Modal de creación/edición de Empleado ====================== */
function EmpleadoModal({
    isOpen,
    onOpenChange,
    data,
    setData,
    onSave,
    saving,
}: {
    isOpen: boolean;
    onOpenChange: (v: boolean) => void;
    data: EmpleadoUI | null;
    setData: React.Dispatch<React.SetStateAction<EmpleadoUI | null>>;
    onSave: () => void;
    saving: boolean;
}) {
    if (!data) return null;

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable={false}
            isKeyboardDismissDisabled
            placement="center"
            size="lg"
            backdrop="opaque"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="mdi:account" width={20} height={20} />
                            {data.id_empleado ? "Editar empleado" : "Nuevo empleado"}
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombre"
                                    variant="bordered"
                                    value={data.nombre}
                                    onValueChange={(v) =>
                                        setData((p) =>
                                            p
                                                ? {
                                                    ...p,
                                                    nombre: v,
                                                    nombres: `${v} ${p.apellido}`.trim(),
                                                }
                                                : p
                                        )
                                    }
                                    isRequired
                                />
                                <Input
                                    label="Apellido"
                                    variant="bordered"
                                    value={data.apellido}
                                    onValueChange={(v) =>
                                        setData((p) =>
                                            p
                                                ? {
                                                    ...p,
                                                    apellido: v,
                                                    nombres: `${p?.nombre ?? ""} ${v}`.trim(),
                                                }
                                                : p
                                        )
                                    }
                                    isRequired
                                />
                                <Input
                                    label="Cédula"
                                    variant="bordered"
                                    value={data.cedula}
                                    onValueChange={(v) =>
                                        setData((p) => (p ? { ...p, cedula: v } : p))
                                    }
                                    isRequired
                                />
                                <Input
                                    label="Correo"
                                    type="email"
                                    variant="bordered"
                                    value={data.email}
                                    onValueChange={(v) =>
                                        setData((p) => (p ? { ...p, email: v } : p))
                                    }
                                    isRequired
                                />
                                <Input
                                    label="Teléfono"
                                    variant="bordered"
                                    value={data.telefono}
                                    onValueChange={(v) =>
                                        setData((p) => (p ? { ...p, telefono: v } : p))
                                    }
                                />

                                {!data.id_empleado && (
                                    <Input
                                        label="Contraseña (solo al crear)"
                                        type="password"
                                        variant="bordered"
                                        value={data.contrasena ?? ""}
                                        onValueChange={(v) =>
                                            setData((p) => (p ? { ...p, contrasena: v } : p))
                                        }
                                        description="Mínimo 8 caracteres."
                                    />
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button color="primary" onPress={onSave} isLoading={saving}>
                                Guardar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

/* ====================== Modal de Asignaciones (tabla CRUD) ====================== */
function AsignacionesModal({
    isOpen,
    onOpenChange,
    empleado,
    gyms,
    gymsLoading,
    gymsErr,
}: {
    isOpen: boolean;
    onOpenChange: (v: boolean) => void;
    empleado: EmpleadoUI | null;
    gyms: GymOption[];
    gymsLoading: boolean;
    gymsErr: string | null;
}) {
    const [rows, setRows] = React.useState<ApiEmpleadoAsignacion[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [msg, setMsg] = React.useState<string | null>(null);
    const [savingId, setSavingId] = React.useState<number | "new" | null>(null);

    const gymOpts = React.useMemo(
        () => [
            { key: "0", label: "Sin asignación" },
            ...gyms.map((g) => ({ key: g.key, label: g.label })),
        ],
        [gyms]
    );

    const empresaId = React.useMemo(() => {
        const { empresa } = getSession();
        return Number(empresa || 0);
    }, []);

    /** Trae TODAS las asignaciones (plano) para poder cruzar y obtener el id_empleado_asignacion real */
    async function listEmpleadoAsignaciones(): Promise<ApiEmpleadoAsignacion[]> {
        const data = await apiFetch(`/api/v1/empleado_asignacion`);
        return Array.isArray(data) ? (data as ApiEmpleadoAsignacion[]) : [];
    }

    /** Si una fila no tiene id_empleado_asignacion, lo resolvemos cruzando contra el listado plano */
    async function ensureAsignacionId(
        r: ApiEmpleadoAsignacion
    ): Promise<number> {
        const current = Number(r.id_empleado_asignacion ?? 0);
        if (current > 0) return current;

        const all = await listEmpleadoAsignaciones();
        const match = all.find(
            (x) =>
                Number(x.id_empleado) === Number(r.id_empleado) &&
                Number(x.id_empresa) === Number(r.id_empresa) &&
                Number(x.id_gimnasio) === Number(r.id_gimnasio) &&
                Number(x.id_tipo_empleado ?? DEFAULT_TIPO) ===
                Number(r.id_tipo_empleado ?? DEFAULT_TIPO)
        );
        return Number(match?.id_empleado_asignacion ?? 0);
    }

    // CARGA: DTO + listado plano -> inyectar IDs reales y renderizar
    React.useEffect(() => {
        let alive = true;
        (async () => {
            setRows([]);
            setMsg(null);
            if (!isOpen || !empleado?.id_empleado) return;

            try {
                setLoading(true);
                const [dto, all] = await Promise.all([
                    fetchEmpleadoDTO(empleado.id_empleado),
                    listEmpleadoAsignaciones(),
                ]);
                if (!alive) return;

                // Mapear DTO a filas UI
                const base: ApiEmpleadoAsignacion[] = (dto?.asignaciones || []).map(
                    (a) => {
                        // Buscar id real en el listado plano
                        const m = all.find(
                            (x) =>
                                Number(x.id_empleado) === Number(empleado.id_empleado) &&
                                Number(x.id_empresa ?? empresaId) ===
                                Number(a.id_empresa ?? empresaId) &&
                                Number(x.id_gimnasio) === Number(a.id_gimnasio ?? 0) &&
                                Number(x.id_tipo_empleado ?? DEFAULT_TIPO) ===
                                Number(a.id_tipo_empleado ?? DEFAULT_TIPO)
                        );
                        return {
                            id_empleado_asignacion: Number(m?.id_empleado_asignacion ?? 0),
                            id_empleado: Number(empleado.id_empleado),
                            id_empresa: Number(a.id_empresa ?? empresaId),
                            id_gimnasio: Number(a.id_gimnasio ?? 0),
                            id_tipo_empleado: Number(a.id_tipo_empleado ?? DEFAULT_TIPO),
                            activo: true,
                        };
                    }
                );

                // De-duplicado por (empleado, empresa, gimnasio, tipo)
                const uniqueMap = new Map<string, ApiEmpleadoAsignacion>();
                for (const r of base) {
                    const key = `${r.id_empleado}|${r.id_empresa}|${r.id_gimnasio}|${r.id_tipo_empleado}`;
                    if (!uniqueMap.has(key)) uniqueMap.set(key, r);
                    else {
                        // Si hay duplicados, prioriza el que tenga ID real
                        const prev = uniqueMap.get(key)!;
                        if (
                            (r.id_empleado_asignacion ?? 0) > 0 &&
                            (prev.id_empleado_asignacion ?? 0) === 0
                        ) {
                            uniqueMap.set(key, r);
                        }
                    }
                }

                setRows(Array.from(uniqueMap.values()));
            } catch (e: any) {
                if (!alive) return;
                setMsg(e?.message || "No se pudieron cargar las asignaciones.");
                setRows([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
            setRows([]);
            setMsg(null);
            setSavingId(null);
        };
    }, [isOpen, empleado?.id_empleado, empresaId]);

    function addRow() {
        if (!empleado?.id_empleado) return;
        setRows((prev) => [
            {
                id_empleado_asignacion: 0,
                id_empleado: Number(empleado.id_empleado),
                id_empresa: empresaId,
                id_gimnasio: 0,
                id_tipo_empleado: DEFAULT_TIPO,
                activo: true,
            },
            ...prev,
        ]);
    }

    async function saveRow(r: ApiEmpleadoAsignacion) {
        if (!empleado?.id_empleado) return;
        const tipo = Number(r.id_tipo_empleado ?? DEFAULT_TIPO);
        setSavingId(
            r.id_empleado_asignacion && r.id_empleado_asignacion > 0
                ? r.id_empleado_asignacion
                : "new"
        );
        try {
            if (r.id_empleado_asignacion && r.id_empleado_asignacion > 0) {
                await updateEmpleadoAsignacion(r.id_empleado_asignacion, {
                    id_empleado: r.id_empleado,
                    id_empresa: r.id_empresa,
                    id_gimnasio: r.id_gimnasio,
                    id_tipo_empleado: tipo,
                });
                setMsg("Asignación actualizada.");
            } else {
                const created = await createEmpleadoAsignacion({
                    id_empleado: r.id_empleado,
                    id_empresa: r.id_empresa,
                    id_gimnasio: r.id_gimnasio,
                    id_tipo_empleado: tipo,
                });
                setRows((prev) =>
                    prev.map((x) =>
                        x === r ? { ...created, activo: created.activo ?? true } : x
                    )
                );
                setMsg("Asignación creada.");
            }
        } catch (e: any) {
            setMsg(e?.message || "No se pudo guardar la asignación.");
        } finally {
            setSavingId(null);
        }
    }

    async function removeRow(r: ApiEmpleadoAsignacion) {
        let idToDelete = Number(r.id_empleado_asignacion ?? 0);
        if (!idToDelete || idToDelete <= 0) {
            idToDelete = await ensureAsignacionId(r); // 👈 resolver ID antes de borrar
        }

        if (!idToDelete || idToDelete <= 0) {
            // No existe en servidor: solo limpiamos local
            setRows((prev) => prev.filter((x) => x !== r));
            setMsg("Asignación descartada (no existía en servidor).");
            return;
        }

        const ok = confirm(`¿Eliminar la asignación #${idToDelete}?`);
        if (!ok) return;

        setSavingId(idToDelete);
        const snapshot = rows;
        try {
            await deleteEmpleadoAsignacion(idToDelete);
            setRows((prev) =>
                prev.filter(
                    (x) =>
                        Number(x.id_empleado_asignacion ?? 0) !== idToDelete && x !== r
                )
            );
            setMsg("Asignación eliminada.");
        } catch (e: any) {
            const msg = String(e?.message || "");
            if (msg.includes("404")) {
                setRows((prev) =>
                    prev.filter(
                        (x) =>
                            Number(x.id_empleado_asignacion ?? 0) !== idToDelete && x !== r
                    )
                );
                setMsg("Asignación eliminada (no existía en el servidor).");
            } else {
                setMsg(e?.message || "No se pudo eliminar la asignación.");
                setRows(snapshot);
            }
        } finally {
            setSavingId(null);
        }
    }

    function setRow<K extends keyof ApiEmpleadoAsignacion>(
        r: ApiEmpleadoAsignacion,
        key: K,
        val: ApiEmpleadoAsignacion[K]
    ) {
        setRows((prev) => prev.map((x) => (x === r ? { ...x, [key]: val } : x)));
    }

    const pickFirstKey = (keys: Selection): string => {
        if (keys === "all") return "0";
        const set = keys as Set<React.Key>;
        const first = Array.from(set)[0] ?? "0";
        return String(first);
    };

    const getGymLabel = (id: number) =>
        gyms.find((g) => g.value === id)?.label ??
        (id ? `#${id}` : "Sin asignación");

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable={false}
            isKeyboardDismissDisabled
            hideCloseButton
            backdrop="opaque"
            size="2xl"
            placement="center"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="solar:map-point-bold-duotone" />
                            Asignaciones de {empleado?.nombres || "Empleado"}
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            {msg && (
                                <Chip
                                    variant="flat"
                                    color={msg.includes("No se pudo") ? "warning" : "success"}
                                >
                                    {msg}
                                </Chip>
                            )}

                            <div className="flex justify-between items-center">
                                <div className="text-sm text-default-500">
                                    {gymsLoading
                                        ? "Cargando gimnasios…"
                                        : gymsErr
                                            ? gymsErr
                                            : `Gimnasios disponibles: ${gyms.length}`}
                                </div>
                                <Button
                                    size="sm"
                                    startContent={<Icon icon="mdi:plus" />}
                                    onPress={addRow}
                                    isDisabled={gymsLoading || !empleado?.id_empleado}
                                >
                                    Nueva asignación
                                </Button>
                            </div>

                            <Card className="border bg-background/70 rounded-2xl">
                                <CardBody className="p-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Spinner />
                                        </div>
                                    ) : (
                                        <Table aria-label="Tabla de asignaciones" removeWrapper>
                                            <TableHeader>
                                                <TableColumn width={140}>ID</TableColumn>
                                                <TableColumn>GIMNASIO</TableColumn>
                                                <TableColumn className="text-right" width={200}>
                                                    ACCIONES
                                                </TableColumn>
                                            </TableHeader>
                                            <TableBody emptyContent="Sin asignaciones">
                                                {rows.map((r, idx) => (
                                                    <TableRow
                                                        key={`${r.id_empleado_asignacion || "new"
                                                            }-${r.id_gimnasio}-${r.id_tipo_empleado}-${idx}`}
                                                    >
                                                        <TableCell>
                                                            {r.id_empleado_asignacion &&
                                                                r.id_empleado_asignacion > 0 ? (
                                                                <Chip size="sm" variant="flat">
                                                                    #{r.id_empleado_asignacion}
                                                                </Chip>
                                                            ) : (
                                                                <Chip size="sm" color="primary" variant="flat">
                                                                    Nuevo
                                                                </Chip>
                                                            )}
                                                        </TableCell>

                                                        <TableCell>
                                                            <Select<{ key: string; label: string }>
                                                                aria-label="Gimnasio"
                                                                selectionMode="single"
                                                                disallowEmptySelection
                                                                selectedKeys={
                                                                    new Set([
                                                                        String(r.id_gimnasio ?? 0),
                                                                    ]) as unknown as Selection
                                                                }
                                                                onSelectionChange={(keys: Selection) => {
                                                                    const picked = pickFirstKey(keys);
                                                                    const id = Number(picked) || 0;
                                                                    setRow(r, "id_gimnasio", id);
                                                                }}
                                                                items={gymOpts}
                                                                className="min-w-[220px]"
                                                                radius="lg"
                                                                size="sm"
                                                            >
                                                                {(item) => (
                                                                    <SelectItem key={item.key}>
                                                                        {item.label}
                                                                    </SelectItem>
                                                                )}
                                                            </Select>
                                                        </TableCell>

                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="flat"
                                                                    isLoading={
                                                                        savingId ===
                                                                        (r.id_empleado_asignacion &&
                                                                            r.id_empleado_asignacion > 0
                                                                            ? r.id_empleado_asignacion
                                                                            : "new")
                                                                    }
                                                                    onPress={() => saveRow(r)}
                                                                    startContent={
                                                                        <Icon icon="mdi:content-save" />
                                                                    }
                                                                >
                                                                    Guardar
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    color="danger"
                                                                    variant="light"
                                                                    onPress={() => removeRow(r)}
                                                                    startContent={
                                                                        <Icon icon="mdi:trash-can" />
                                                                    }
                                                                >
                                                                    Eliminar
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardBody>
                            </Card>

                            <div className="text-sm text-default-500">
                                <span className="font-medium">Asignados: </span>
                                {rows.length === 0
                                    ? "—"
                                    : rows
                                        .filter((r) => (r.id_gimnasio ?? 0) > 0)
                                        .map((r) => getGymLabel(r.id_gimnasio))
                                        .join(" • ")}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cerrar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
