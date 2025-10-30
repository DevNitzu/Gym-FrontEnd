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
import ListaMembresias from "./components/membresias/ListaMembresias";
import PersonalDeEsteGimnasio from "./components/personal/PersonalDeEsteGimnasio";

export default function GestionSucursalPage() {
    const router = useRouter();
    const params = useParams<{ sid: string }>();
    const sid = (params?.sid || "").toString().toUpperCase();
    const { gymIdStr, gymIdNum } = parseFromSid(sid);

    const [empresaId, setEmpresaId] = React.useState<string | null>(null);
    const [sucursal, setSucursal] = React.useState<SucursalView | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        try { setEmpresaId(localStorage.getItem("auth:empresa")); } catch { setEmpresaId(null); }
    }, []);

    React.useEffect(() => {
        let alive = true;
        async function load() {
            if (!empresaId) { setLoading(false); setError("No se encontró el id de empresa. Vuelve a iniciar sesión."); return; }
            if (!Number.isFinite(gymIdNum)) { setLoading(false); setError(`El identificador del gimnasio en "${sid}" no es válido.`); return; }
            setLoading(true); setError(null); setSucursal(null);
            try {
                const list = await apiListGimnasiosByEmpresa(empresaId);
                const found = list.find((g) => Number(g.id_gimnasio) === gymIdNum);
                if (!found) throw new Error(`No se encontró el gimnasio ${gymIdStr} para la empresa ${empresaId}.`);
                const view = mapGymToSucursalView(found, sid);
                if (alive) setSucursal(view);
            } catch (e: any) {
                if (alive) setError(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo cargar la sucursal.");
            } finally { if (alive) setLoading(false); }
        }
        load(); return () => { alive = false; };
    }, [empresaId, gymIdNum, gymIdStr, sid]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-foreground-500"><Spinner /><span>Cargando información de la sucursal…</span></div>
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
                            <Button variant="flat" startContent={<Icon icon="solar:arrow-left-line-duotone" />} onClick={() => router.push("/login")}>
                                Ir a iniciar sesión
                            </Button>
                            <Button color="primary" startContent={<Icon icon="solar:refresh-bold-duotone" />} onClick={() => router.refresh()}>
                                Reintentar
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const fechaCreacionPretty = sucursal.fechaCreacion
        ? new Date(sucursal.fechaCreacion.replace(" ", "T")).toLocaleString(LOCALE, { dateStyle: "medium", timeStyle: "short" })
        : "—";

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{sucursal.nombre}</h1>
                    <p className="text-sm text-foreground-500">{sucursal.id} • {sucursal.ciudad} • {sucursal.gymId}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-foreground-500">
                        {sucursal.telefono && <span className="inline-flex items-center gap-1"><Icon icon="solar:phone-bold" /> {sucursal.telefono}</span>}
                        {sucursal.correo && <span className="inline-flex items-center gap-1"><Icon icon="solar:letter-bold" /> {sucursal.correo}</span>}
                        {sucursal.fechaCreacion && <span className="inline-flex items-center gap-1"><Icon icon="solar:calendar-bold" /> {fechaCreacionPretty}</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="flat" startContent={<Icon icon="solar:arrow-left-line-duotone" />} onClick={() => {
                        const eid = localStorage.getItem("auth:empresa") ?? "";
                        router.push(`/admin/gimnasios?empresa=${encodeURIComponent(eid)}`);
                    }}>
                        Volver al listado
                    </Button>
                </div>
            </div>

            {/* Resumen simple */}
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
                        <div className="text-xs text-foreground-500">Check-ins de hoy</div>
                        <div className="text-lg font-semibold">{sucursal.checkinsHoy}</div>
                    </div>
                    <div className="rounded-lg bg-default-100 p-3">
                        <div className="text-xs text-foreground-500">Estado</div>
                        <div className={`text-lg font-semibold text-${estadoColor(sucursal.estado)}`}>{sucursal.estado}</div>
                    </div>
                </CardBody>
            </Card>

            {/* Pestañas */}
            <Tabs aria-label="Gestión de sucursal" color="primary" variant="bordered">
                <Tab key="general" title={<span className="flex items-center gap-2"><Icon icon="solar:eye-bold-duotone" />General</span>}>
                    <Card className="border">
                        <CardBody className="space-y-2 text-sm">
                            <div><strong>ID de la sucursal:</strong> {sucursal.id}</div>
                            <div><strong>Código del gimnasio:</strong> {sucursal.gymId}</div>
                            <div><strong>Ciudad:</strong> {sucursal.ciudad}</div>
                            <div><strong>Teléfono:</strong> {sucursal.telefono || "—"}</div>
                            <div><strong>Correo:</strong> {sucursal.correo || "—"}</div>
                            <div><strong>Creado:</strong> {fechaCreacionPretty}</div>
                        </CardBody>
                    </Card>
                </Tab>

                <Tab key="planes" title={<span className="flex items-center gap-2"><Icon icon="solar:wallet-money-bold-duotone" />Membresías (Precios)</span>}>
                    <MembresiasCrud id_gimnasio={Number(gymIdNum)} />
                </Tab>

                <Tab key="clientes" title={<span className="flex items-center gap-2"><Icon icon="solar:users-group-rounded-bold-duotone" />Clientes</span>}>
                    <ClientesCrud />
                </Tab>

                <Tab key="ventas" title={<span className="flex items-center gap-2"><Icon icon="solar:card-bold-duotone" />Ventas</span>}>
                    <div className="space-y-4">
                        <NuevaMembresiaCard id_gimnasio={Number(gymIdNum)} onCreated={() => { /* hook si deseas refrescar */ }} />
                        <ListaMembresias id_gimnasio={Number(gymIdNum)} />
                    </div>
                </Tab>

                <Tab key="staff" title={<span className="flex items-center gap-2"><Icon icon="solar:shield-user-bold-duotone" />Personal</span>}>
                    <PersonalDeEsteGimnasio gymIdNum={Number(gymIdNum)} />
                </Tab>
            </Tabs>
        </div>
    );
}
