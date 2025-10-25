"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Tabs, Tab, Chip, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type EstadoSucursal = "Abierta" | "Cerrada" | "Mantenimiento";

// Estructura que devuelve tu API de gimnasios
type ApiGimnasio = {
    id_gimnasio: number;
    id_empresa: number;
    nombre: string;
    direccion: string;   // (en tu ejemplo: "pelileo")
    telefono: string;
    correo: string;
    activo: number;      // 1|0
    fecha_creacion: string; // "YYYY-MM-DD HH:mm:ss"
};

// Estructura que muestra esta vista
type SucursalView = {
    id: string;          // ej: G-009-S1
    gymId: string;       // ej: G-009
    nombre: string;      // nombre del gimnasio o de la sucursal (si luego tienes tabla, cámbialo)
    ciudad: string;      // de 'direccion' por ahora
    estado: EstadoSucursal;
    miembros: number;    // placeholder
    aforo: number;       // placeholder
    checkinsHoy: number; // placeholder
    telefono?: string;
    correo?: string;
    fechaCreacion?: string;
};

function estadoColor(e: EstadoSucursal) {
    if (e === "Abierta") return "success" as const;
    if (e === "Cerrada") return "danger" as const;
    return "warning" as const;
}

function zpad3(n: number) {
    return n.toString().padStart(3, "0");
}

/** Extrae "G-009" y el id numérico (9) desde sid: "G-009-S1" */
function parseFromSid(sid: string) {
    const parts = sid.split("-"); // ["G","009","S1"]
    const gymPart = parts.slice(0, 2).join("-"); // "G-009"
    const num = parseInt(parts[1], 10);
    return { gymIdStr: gymPart, gymIdNum: Number.isFinite(num) ? num : NaN };
}

/** Mapea un ApiGimnasio a la vista SucursalView */
function mapGymToSucursalView(g: ApiGimnasio, sid: string): SucursalView {
    const gymId = `G-${zpad3(g.id_gimnasio)}`;
    const estado: EstadoSucursal = Number(g.activo) === 1 ? "Abierta" : "Cerrada";
    return {
        id: sid,                   // mantenemos el SID de la URL
        gymId,                     // "G-009"
        nombre: g.nombre ?? "Gimnasio",
        ciudad: g.direccion ?? "—",
        estado,
        miembros: 0,
        aforo: 0,
        checkinsHoy: 0,
        telefono: g.telefono,
        correo: g.correo,
        fechaCreacion: g.fecha_creacion,
    };
}

export default function GestionSucursalPage() {
    const router = useRouter();
    const params = useParams<{ sid: string }>();
    const sid = (params?.sid || "").toString().toUpperCase(); // p.ej. G-009-S1
    const { gymIdStr, gymIdNum } = parseFromSid(sid);

    const [empresaId, setEmpresaId] = React.useState<string | null>(null);
    const [sucursal, setSucursal] = React.useState<SucursalView | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    // Lee id_empresa del login (guardado antes en localStorage como "auth:empresa")
    React.useEffect(() => {
        try {
            const v = localStorage.getItem("auth:empresa");
            setEmpresaId(v);
        } catch {
            setEmpresaId(null);
        }
    }, []);

    // Carga datos del gimnasio y los mapea a la vista
    React.useEffect(() => {
        let alive = true;
        async function load() {
            if (!empresaId) {
                setLoading(false);
                setError("No se encontró id_empresa. Inicia sesión nuevamente.");
                return;
            }
            if (!Number.isFinite(gymIdNum)) {
                setLoading(false);
                setError(`El identificador del gimnasio en "${sid}" no es válido.`);
                return;
            }

            setLoading(true);
            setError(null);
            setSucursal(null);

            try {
                const url = `${API_BASE}/api/v1/gimnasios/${encodeURIComponent(empresaId)}`;
                const res = await fetch(url, {
                    headers: { Accept: "application/json" },
                    cache: "no-store",
                    mode: "cors",
                });
                if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);

                const data = await res.json();
                const list: ApiGimnasio[] = Array.isArray(data)
                    ? data
                    : Array.isArray((data as any)?.items)
                        ? (data as any).items
                        : [];

                const found = list.find((g) => Number(g.id_gimnasio) === gymIdNum);
                if (!found) throw new Error(`No se encontró el gimnasio ${gymIdStr} (id ${gymIdNum}) para la empresa ${empresaId}.`);

                const view = mapGymToSucursalView(found, sid);
                if (alive) setSucursal(view);
            } catch (e: any) {
                if (alive) setError(e?.message || "Error al cargar la sucursal.");
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, [empresaId, gymIdNum, gymIdStr, sid]);

    // UI
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-foreground-500">
                    <Spinner />
                    <span>Cargando información de la sucursal…</span>
                </div>
            </div>
        );
    }

    if (error || !sucursal) {
        return (
            <div className="space-y-4">
                <Card className="border">
                    <CardBody className="text-center">
                        <p className="font-medium">No se pudo cargar la sucursal.</p>
                        <p className="text-sm text-foreground-500 mt-1">{error ?? "Sin datos"}</p>
                        <div className="mt-4 flex justify-center gap-2">
                            <Button variant="flat" startContent={<Icon icon="solar:arrow-left-line-duotone" />} onClick={() => router.push("/admin/gimnasios")}>
                                Volver al listado
                            </Button>
                            <Button
                                color="primary"
                                startContent={<Icon icon="solar:refresh-bold-duotone" />}
                                onClick={() => router.refresh()}
                            >
                                Reintentar
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{sucursal.nombre}</h1>
                    <p className="text-sm text-foreground-500">
                        {sucursal.id} • {sucursal.ciudad} • {sucursal.gymId}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-foreground-500">
                        {sucursal.telefono && (
                            <span className="inline-flex items-center gap-1">
                                <Icon icon="solar:phone-bold" /> {sucursal.telefono}
                            </span>
                        )}
                        {sucursal.correo && (
                            <span className="inline-flex items-center gap-1">
                                <Icon icon="solar:letter-bold" /> {sucursal.correo}
                            </span>
                        )}
                        {sucursal.fechaCreacion && (
                            <span className="inline-flex items-center gap-1">
                                <Icon icon="solar:calendar-bold" /> {new Date(sucursal.fechaCreacion.replace(" ", "T")).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Chip color={estadoColor(sucursal.estado)} variant="flat">{sucursal.estado}</Chip>
                    <Button
                        variant="flat"
                        startContent={<Icon icon="solar:arrow-left-line-duotone" />}
                        onClick={() => {
                            const eid = empresaId ?? "";
                            router.push(`/admin/gimnasios?empresa=${encodeURIComponent(eid)}`);
                        }}
                    >
                        Volver al listado
                    </Button>
                </div>
            </div>

            {/* Resumen */}
            <Card className="border">
                <CardHeader className="font-semibold">Resumen</CardHeader>
                <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-default-100 p-3">
                        <div className="text-xs text-foreground-500">Miembros</div>
                        <div className="text-lg font-semibold">{sucursal.miembros}</div>
                    </div>
                    <div className="rounded-lg bg-default-100 p-3">
                        <div className="text-xs text-foreground-500">Aforo</div>
                        <div className="text-lg font-semibold">{sucursal.aforo}</div>
                    </div>
                    <div className="rounded-lg bg-default-100 p-3">
                        <div className="text-xs text-foreground-500">Check-ins hoy</div>
                        <div className="text-lg font-semibold">{sucursal.checkinsHoy}</div>
                    </div>
                    <div className="rounded-lg bg-default-100 p-3">
                        <div className="text-xs text-foreground-500">Estado</div>
                        <div className="text-lg font-semibold">{sucursal.estado}</div>
                    </div>
                </CardBody>
            </Card>

            {/* Tabs */}
            <Tabs aria-label="Gestión de sucursal" color="primary" variant="bordered">
                <Tab key="overview" title={<span className="flex items-center gap-2"><Icon icon="solar:eye-bold-duotone" />Overview</span>}>
                    <Card className="border">
                        <CardBody className="space-y-2 text-sm">
                            <div><strong>ID Sucursal:</strong> {sucursal.id}</div>
                            <div><strong>Gimnasio:</strong> {sucursal.gymId}</div>
                            <div><strong>Ciudad:</strong> {sucursal.ciudad}</div>
                            <div><strong>Teléfono:</strong> {sucursal.telefono || "—"}</div>
                            <div><strong>Correo:</strong> {sucursal.correo || "—"}</div>
                            <div><strong>Creado:</strong> {sucursal.fechaCreacion ? new Date(sucursal.fechaCreacion.replace(" ", "T")).toLocaleString() : "—"}</div>
                        </CardBody>
                    </Card>
                </Tab>

                <Tab key="horarios" title={<span className="flex items-center gap-2"><Icon icon="solar:calendar-bold-duotone" />Horarios</span>}>
                    <Card className="border"><CardBody>Configura clases y franjas.</CardBody></Card>
                </Tab>

                <Tab key="staff" title={<span className="flex items-center gap-2"><Icon icon="solar:shield-user-bold-duotone" />Staff</span>}>
                    <Card className="border"><CardBody>CRUD de entrenadores y permisos.</CardBody></Card>
                </Tab>

                <Tab key="pagos" title={<span className="flex items-center gap-2"><Icon icon="solar:card-bold-duotone" />Pagos</span>}>
                    <Card className="border"><CardBody>Planes, cobros y vencimientos.</CardBody></Card>
                </Tab>
            </Tabs>
        </div>
    );
}
