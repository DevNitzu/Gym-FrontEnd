"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Spinner, Tab, Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { LOCALE } from "../../lib/utils";
import { estadoColor, mapGymToSucursalView, parseFromSid } from "../../lib/sucursal";
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
async function fetchMembresiasCountByGym(id_gimnasio: number): Promise<number> {
    const url = `${API_BASE}/api/v1/membresias/membresias_count/gimnasio/${encodeURIComponent(id_gimnasio)}`;

    const res = await authFetch(url, {
        headers: buildAuthHeaders(),
        cache: "no-store",
        mode: "cors",
    });

    if (!res.ok) {
        const t = await res.text().catch(() => "");
        const err = new Error(`HTTP ${res.status} al cargar ${url} ${t ? `- ${t}` : ""}`) as any;
        (err.__status = res.status);
        throw err;
    }

    const data = await res.json().catch(() => null);
    return coerceCount(data);
}

/** Clientes (miembros) por gimnasio */
async function fetchClientesCountByGym(id_gimnasio: number): Promise<number> {
    const url = `${API_BASE}/api/v1/membresias/clientes_count/gimnasio/${encodeURIComponent(id_gimnasio)}`;

    const res = await authFetch(url, {
        headers: buildAuthHeaders(),
        cache: "no-store",
        mode: "cors",
    });

    if (!res.ok) {
        const t = await res.text().catch(() => "");
        const err = new Error(`HTTP ${res.status} al cargar ${url} ${t ? `- ${t}` : ""}`) as any;
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
    const [miembrosLoading, setMiembrosLoading] = React.useState<boolean>(true);
    const [miembrosCount, setMiembrosCount] = React.useState<number | null>(null);
    const [miembrosErr, setMiembrosErr] = React.useState<string | null>(null);

    // Membresías activas
    const [membresiasLoading, setMembresiasLoading] = React.useState<boolean>(true);
    const [membresiasCount, setMembresiasCount] = React.useState<number | null>(null);
    const [membresiasErr, setMembresiasErr] = React.useState<string | null>(null);

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
                setError("No se encontró el id de empresa. Vuelve a iniciar sesión.");
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
                const list = await apiListGimnasiosByEmpresa(empresaId);
                const found = list.find((g) => Number(g.id_gimnasio) === gymIdNum);
                if (!found) throw new Error(`No se encontró el gimnasio ${gymIdStr} para la empresa ${empresaId}.`);
                const view = mapGymToSucursalView(found, sid);
                if (alive) setSucursal(view);
            } catch (e: any) {
                if (alive)
                    setError(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo cargar la sucursal.");
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

            // Miembros
            setMiembrosLoading(true);
            setMiembrosErr(null);

            // Membresías
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
                // Podría fallar uno y no el otro; para simplicidad, marcamos ambos si hay error global.
                // Si quieres granularidad, separa try/catch por petición.
                if (e?.message) {
                    setMiembrosErr(e.message);
                    setMembresiasErr(e.message);
                } else {
                    setMiembrosErr("No se pudo obtener el conteo de miembros.");
                    setMembresiasErr("No se pudo obtener el conteo de membresías activas.");
                }
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
            <div className="space-y-4">
                <Card className="border">
                    <CardBody className="text-center">
                        <p className="font-medium">No se pudo cargar la sucursal.</p>
                        <p className="text-sm text-foreground-500 mt-1">{error ?? "Sin datos"}</p>
                        <div className="mt-4 flex justify-center gap-2">
                            <Button
                                variant="flat"
                                startContent={<Icon icon="solar:arrow-left-line-duotone" />}
                                onClick={() => router.push("/login")}
                            >
                                Ir a iniciar sesión
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

    const fechaCreacionPretty = sucursal.fechaCreacion
        ? new Date(sucursal.fechaCreacion.replace(" ", "T")).toLocaleString(LOCALE, {
            dateStyle: "medium",
            timeStyle: "short",
        })
        : "—";

    return (
        <div className="space-y-6">
            {/* Encabezado */}
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
                                <Icon icon="solar:calendar-bold" /> {fechaCreacionPretty}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="flat"
                        startContent={<Icon icon="solar:arrow-left-line-duotone" />}
                        onClick={() => {
                            const eid = localStorage.getItem("auth:empresa") ?? "";
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
                        <div className="text-lg font-semibold">
                            {miembrosLoading ? "…" : miembrosErr ? "—" : miembrosCount ?? 0}
                        </div>
                    </div>
                    <div className="rounded-lg bg-default-100 p-3">
                        <div className="text-xs text-foreground-500">Membresías activas</div>
                        <div className="text-lg font-semibold">
                            {membresiasLoading ? "…" : membresiasErr ? "—" : membresiasCount ?? 0}
                        </div>
                    </div>
                    <div className="rounded-lg bg-default-100 p-3">
                        <div className="text-xs text-foreground-500">Check-ins de hoy</div>
                        <div className="text-lg font-semibold">{sucursal.checkinsHoy}</div>
                    </div>
                    <div className="rounded-lg bg-default-100 p-3">
                        <div className="text-xs text-foreground-500">Estado</div>
                        <div className={`text-lg font-semibold text-${estadoColor(sucursal.estado)}`}>
                            {sucursal.estado}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Pestañas */}
            <Tabs aria-label="Gestión de sucursal" color="primary" variant="bordered">
                <Tab
                    key="general"
                    title={
                        <span className="flex items-center gap-2">
                            <Icon icon="solar:eye-bold-duotone" />
                            General
                        </span>
                    }
                >
                    <Card className="border">
                        <CardBody className="space-y-2 text-sm">
                            <div>
                                <strong>ID de la sucursal:</strong> {sucursal.id}
                            </div>
                            <div>
                                <strong>Código del gimnasio:</strong> {sucursal.gymId}
                            </div>
                            <div>
                                <strong>Ciudad:</strong> {sucursal.ciudad}
                            </div>
                            <div>
                                <strong>Teléfono:</strong> {sucursal.telefono || "—"}
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
                    <MembresiasCrud id_gimnasio={Number(gymIdNum)} />
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
                    <ClientesCrud />
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
                    <div className="space-y-4">
                        <NuevaMembresiaCard
                            id_gimnasio={Number(gymIdNum)}
                            onCreated={async () => {
                                // Si quieres refrescar los contadores inmediatamente tras crear una membresía:
                                try {
                                    setMembresiasLoading(true);
                                    const nuevoMembresias = await fetchMembresiasCountByGym(Number(gymIdNum));
                                    setMembresiasCount(nuevoMembresias);
                                } finally {
                                    setMembresiasLoading(false);
                                }
                                // Si también deseas refrescar miembros cuando la venta implica alta de cliente:
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
                    <PersonalDeEsteGimnasio gymIdNum={Number(gymIdNum)} />
                </Tab>
            </Tabs>
        </div>
    );
}
