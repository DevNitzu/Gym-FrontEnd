"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Spinner,
    Tab,
    Tabs,
    Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { LOCALE } from "../../lib/utils";
import {
    estadoColor,
    mapGymToSucursalView,
    parseFromSid,
} from "../../lib/sucursal";
import { apiListGimnasiosByEmpresa } from "../../lib/api";
import { SucursalView } from "../../lib/types";
import MembresiasCrud from "./components/membresias/PlanesCrud";
import ClientesCrud from "./components/clientes/ClientesCrud";
import NuevaMembresiaCard from "./components/membresias/NuevaMembresiaCard";
import PersonalDeEsteGimnasio from "./components/personal/PersonalDeEsteGimnasio";

import { authFetch, buildAuthHeaders } from "../../lib/auth";

// === Ajusta tu base si hace falta ===
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/* ---------------- Utils para normalizar conteos ---------------- */
function coerceCount(data: any): number {
    if (typeof data === "number") return Number.isFinite(data) ? data : 0;
    if (typeof data === "string") {
        const n = Number(data);
        return Number.isFinite(n) ? n : 0;
    }
    if (data && typeof data === "object") {
        const maybe =
            data.active_membresias_count ??
            data.clientes_membresia_count ??
            data.count ??
            data.value ??
            null;
        const n = Number(maybe);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

/* ------------------- Servicios de conteo ------------------- */
/** Membresías activas por gimnasio */
async function fetchMembresiasCountByGym(
    id_gimnasio: number
): Promise<number> {
    const url = `${API_BASE}/api/v1/membresias/membresias_count/gimnasio/${encodeURIComponent(
        id_gimnasio
    )}`;

    const res = await authFetch(url, {
        headers: buildAuthHeaders(),
        cache: "no-store",
        mode: "cors",
    });

    if (!res.ok) {
        const t = await res.text().catch(() => "");
        const err = new Error(
            `HTTP ${res.status} al cargar ${url} ${t ? `- ${t}` : ""}`
        ) as any;
        (err.__status = res.status);
        throw err;
    }

    const data = await res.json().catch(() => null);
    return coerceCount(data);
}

/** Clientes (miembros) por gimnasio */
async function fetchClientesCountByGym(id_gimnasio: number): Promise<number> {
    const url = `${API_BASE}/api/v1/membresias/clientes_count/gimnasio/${encodeURIComponent(
        id_gimnasio
    )}`;

    const res = await authFetch(url, {
        headers: buildAuthHeaders(),
        cache: "no-store",
        mode: "cors",
    });

    if (!res.ok) {
        const t = await res.text().catch(() => "");
        const err = new Error(
            `HTTP ${res.status} al cargar ${url} ${t ? `- ${t}` : ""}`
        ) as any;
        (err.__status = res.status);
        throw err;
    }

    const data = await res.json().catch(() => null);
    return coerceCount(data);
}

/* ================================================================ */

export default function GestionSucursalPage() {
    const router = useRouter();
    const params = useParams<{ sid: string }>();
    const sid = (params?.sid || "").toString().toUpperCase();
    const { gymIdStr, gymIdNum } = parseFromSid(sid);

    const [empresaId, setEmpresaId] = React.useState<string | null>(null);
    const [sucursal, setSucursal] = React.useState<SucursalView | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    // ---- Estados para contadores ----
    // Miembros (clientes)
    const [miembrosLoading, setMiembrosLoading] =
        React.useState<boolean>(true);
    const [miembrosCount, setMiembrosCount] =
        React.useState<number | null>(null);
    const [miembrosErr, setMiembrosErr] =
        React.useState<string | null>(null);

    // Membresías activas
    const [membresiasLoading, setMembresiasLoading] =
        React.useState<boolean>(true);
    const [membresiasCount, setMembresiasCount] =
        React.useState<number | null>(null);
    const [membresiasErr, setMembresiasErr] =
        React.useState<string | null>(null);

    React.useEffect(() => {
        try {
            setEmpresaId(localStorage.getItem("auth:empresa"));
        } catch {
            setEmpresaId(null);
        }
    }, []);

    // Cargar datos base de la sucursal
    React.useEffect(() => {
        let alive = true;
        async function load() {
            if (!empresaId) {
                setLoading(false);
                setError(
                    "No se encontró el id de empresa. Vuelve a iniciar sesión."
                );
                return;
            }
            if (!Number.isFinite(gymIdNum)) {
                setLoading(false);
                setError(
                    `El identificador del gimnasio en "${sid}" no es válido.`
                );
                return;
            }
            setLoading(true);
            setError(null);
            setSucursal(null);
            try {
                const list = await apiListGimnasiosByEmpresa(empresaId);
                const found = list.find(
                    (g) => Number(g.id_gimnasio) === gymIdNum
                );
                if (!found)
                    throw new Error(
                        `No se encontró el gimnasio ${gymIdStr} para la empresa ${empresaId}.`
                    );
                const view = mapGymToSucursalView(found, sid);
                if (alive) setSucursal(view);
            } catch (e: any) {
                if (alive)
                    setError(
                        e?.__is401
                            ? "Sesión expirada (401). Inicia sesión."
                            : e?.message || "No se pudo cargar la sucursal."
                    );
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => {
            alive = false;
        };
    }, [empresaId, gymIdNum, gymIdStr, sid]);

    // Cargar conteos (miembros y membresías activas) cuando ya tenemos sucursal/gymId
    React.useEffect(() => {
        let alive = true;

        async function loadCounts() {
            if (!Number.isFinite(gymIdNum)) return;

            // Reset
            setMiembrosLoading(true);
            setMiembrosErr(null);
            setMembresiasLoading(true);
            setMembresiasErr(null);

            try {
                const [miembros, membresias] = await Promise.all([
                    fetchClientesCountByGym(gymIdNum),
                    fetchMembresiasCountByGym(gymIdNum),
                ]);

                if (!alive) return;

                setMiembrosCount(miembros);
                setMembresiasCount(membresias);
            } catch (e: any) {
                if (!alive) return;
                const msg =
                    e?.message ||
                    "No se pudo obtener el conteo de miembros/membresías.";
                setMiembrosErr(msg);
                setMembresiasErr(msg);
                setMiembrosCount(null);
                setMembresiasCount(null);
            } finally {
                if (!alive) return;
                setMiembrosLoading(false);
                setMembresiasLoading(false);
            }
        }

        if (sucursal) loadCounts();
        return () => {
            alive = false;
        };
    }, [sucursal, gymIdNum]);

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
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
                <Card className="border rounded-2xl bg-background/80 backdrop-blur">
                    <CardBody className="text-center py-10">
                        <p className="font-medium text-lg">
                            No se pudo cargar la sucursal.
                        </p>
                        <p className="text-sm text-foreground-500 mt-1">
                            {error ?? "Sin datos"}
                        </p>
                        <div className="mt-4 flex justify-center gap-2">
                            <Button
                                variant="flat"
                                startContent={
                                    <Icon icon="solar:arrow-left-line-duotone" />
                                }
                                onClick={() => router.push("/login")}
                            >
                                Ir a iniciar sesión
                            </Button>
                            <Button
                                color="primary"
                                startContent={
                                    <Icon icon="solar:refresh-bold-duotone" />
                                }
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

    const fechaCreacionPretty = sucursal.fechaCreacion
        ? new Date(
            sucursal.fechaCreacion.replace(" ", "T")
        ).toLocaleString(LOCALE, {
            dateStyle: "medium",
            timeStyle: "short",
        })
        : "—";

    return (
        <div className="w-full h-full">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
                {/* Encabezado */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-default-100 ring-1 ring-default-200">
                            <Icon
                                icon="solar:buildings-2-bold-duotone"
                                className="text-xl"
                            />
                        </span>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                                {sucursal.nombre}
                            </h1>
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
                                        <Icon icon="solar:calendar-bold" />{" "}
                                        {fechaCreacionPretty}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="flat"
                            startContent={
                                <Icon icon="solar:arrow-left-line-duotone" />
                            }
                            onClick={() => {
                                const eid =
                                    localStorage.getItem("auth:empresa") ?? "";
                                router.push(
                                    `/admin/gimnasios?empresa=${encodeURIComponent(
                                        eid
                                    )}`
                                );
                            }}
                        >
                            Volver al listado
                        </Button>
                    </div>
                </div>

                {/* Resumen */}
                <Card className="border rounded-2xl bg-background/80 backdrop-blur shadow-sm">
                    <CardHeader className="font-semibold border-b border-default-100 py-3 px-4 sm:px-6">
                        Resumen
                    </CardHeader>
                    <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4 p-4 sm:p-6">
                        <div className="rounded-xl bg-default-100 p-3 sm:p-4">
                            <div className="text-xs text-foreground-500 mb-1">
                                Miembros
                            </div>
                            <div className="text-lg font-semibold tabular-nums">
                                {miembrosLoading
                                    ? "…"
                                    : miembrosErr
                                        ? "—"
                                        : miembrosCount ?? 0}
                            </div>
                        </div>
                        <div className="rounded-xl bg-default-100 p-3 sm:p-4">
                            <div className="text-xs text-foreground-500 mb-1">
                                Membresías activas
                            </div>
                            <div className="text-lg font-semibold tabular-nums">
                                {membresiasLoading
                                    ? "…"
                                    : membresiasErr
                                        ? "—"
                                        : membresiasCount ?? 0}
                            </div>
                        </div>
                        <div className="rounded-xl bg-default-100 p-3 sm:p-4">
                            <div className="text-xs text-foreground-500 mb-1">
                                Check-ins de hoy
                            </div>
                            <div className="text-lg font-semibold tabular-nums">
                                {sucursal.checkinsHoy}
                            </div>
                        </div>
                        <div className="rounded-xl bg-default-100 p-3 sm:p-4">
                            <div className="text-xs text-foreground-500 mb-1">
                                Estado
                            </div>
                            <Chip
                                size="sm"
                                color={estadoColor(sucursal.estado)}
                                variant="flat"
                            >
                                {sucursal.estado}
                            </Chip>
                        </div>
                    </CardBody>
                </Card>

                {/* Pestañas */}
                <Tabs
                    aria-label="Gestión de sucursal"
                    color="primary"
                    variant="bordered"
                    radius="full"
                    className="mt-2"
                >
                    <Tab
                        key="general"
                        title={
                            <span className="flex items-center gap-2">
                                <Icon icon="solar:eye-bold-duotone" />
                                General
                            </span>
                        }
                    >
                        <Card className="border rounded-2xl mt-3 bg-background/80">
                            <CardBody className="space-y-2 text-sm p-4 sm:p-6">
                                <div>
                                    <strong>ID de la sucursal:</strong> {sucursal.id}
                                </div>
                                <div>
                                    <strong>Código del gimnasio:</strong>{" "}
                                    {sucursal.gymId}
                                </div>
                                <div>
                                    <strong>Ciudad:</strong> {sucursal.ciudad}
                                </div>
                                <div>
                                    <strong>Teléfono:</strong>{" "}
                                    {sucursal.telefono || "—"}
                                </div>
                                <div>
                                    <strong>Correo:</strong> {sucursal.correo || "—"}
                                </div>
                                <div>
                                    <strong>Creado:</strong> {fechaCreacionPretty}
                                </div>
                            </CardBody>
                        </Card>
                    </Tab>

                    <Tab
                        key="planes"
                        title={
                            <span className="flex items-center gap-2">
                                <Icon icon="solar:wallet-money-bold-duotone" />
                                Membresías (Precios)
                            </span>
                        }
                    >
                        <div className="mt-3">
                            <MembresiasCrud id_gimnasio={Number(gymIdNum)} />
                        </div>
                    </Tab>

                    <Tab
                        key="clientes"
                        title={
                            <span className="flex items-center gap-2">
                                <Icon icon="solar:users-group-rounded-bold-duotone" />
                                Clientes
                            </span>
                        }
                    >
                        <div className="mt-3">
                            <ClientesCrud />
                        </div>
                    </Tab>

                    <Tab
                        key="ventas"
                        title={
                            <span className="flex items-center gap-2">
                                <Icon icon="solar:card-bold-duotone" />
                                Ventas
                            </span>
                        }
                    >
                        <div className="mt-3 space-y-4">
                            <NuevaMembresiaCard
                                id_gimnasio={Number(gymIdNum)}
                                onCreated={async () => {
                                    try {
                                        setMembresiasLoading(true);
                                        const nuevoMembresias =
                                            await fetchMembresiasCountByGym(
                                                Number(gymIdNum)
                                            );
                                        setMembresiasCount(nuevoMembresias);
                                    } finally {
                                        setMembresiasLoading(false);
                                    }
                                    // Si también quieres refrescar miembros:
                                    // try {
                                    //   setMiembrosLoading(true);
                                    //   const nuevoMiembros = await fetchClientesCountByGym(Number(gymIdNum));
                                    //   setMiembrosCount(nuevoMiembros);
                                    // } finally {
                                    //   setMiembrosLoading(false);
                                    // }
                                }}
                            />
                        </div>
                    </Tab>

                    <Tab
                        key="staff"
                        title={
                            <span className="flex items-center gap-2">
                                <Icon icon="solar:shield-user-bold-duotone" />
                                Personal
                            </span>
                        }
                    >
                        <div className="mt-3">
                            <PersonalDeEsteGimnasio gymIdNum={Number(gymIdNum)} />
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
