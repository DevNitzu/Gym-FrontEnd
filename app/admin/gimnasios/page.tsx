"use client";

import React from "react";
import {
    Card, CardHeader, CardBody, CardFooter,
    Button, Chip, Input, Spinner, Tooltip
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";

type EstadoSucursal = "Abierta" | "Cerrada" | "Mantenimiento";

/** Estructura exacta que devuelve tu API */
type ApiGimnasio = {
    id_gimnasio: number;
    id_empresa: number;
    nombre: string;
    direccion: string;
    telefono: string;
    correo: string;
    activo: number;              // 1|0
    fecha_creacion: string;      // "YYYY-MM-DD HH:mm:ss"
};

type Row = {
    gymId: string;               // p.ej. G-009
    gymNombre: string;           // nombre
    ciudad: string;              // tomado de direccion
    sucursalId: string;          // G-009-S1 (una sucursal por gym)
    sucursalNombre: string;      // "Sucursal Única"
    miembros: number;
    aforo: number;
    checkinsHoy: number;
    estado: EstadoSucursal;      // desde activo
    telefono: string;
    correo: string;
    fechaCreacion?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const estadoColor = (e: EstadoSucursal) =>
    e === "Abierta" ? "success" : e === "Cerrada" ? "danger" : "warning";

const zpad3 = (n: number) => n.toString().padStart(3, "0");

/** Mapea tu fila de BD a lo que la UI usa */
function mapApiToRow(item: ApiGimnasio): Row {
    const gymId = `G-${zpad3(Number(item.id_gimnasio))}`;
    const sucursalId = `${gymId}-S1`;
    const estado: EstadoSucursal = Number(item.activo) === 1 ? "Abierta" : "Cerrada";

    return {
        gymId,
        gymNombre: item.nombre ?? "Gimnasio",
        ciudad: item.direccion ?? "—",
        sucursalId,
        sucursalNombre: "Sucursal Única",
        miembros: 0,
        aforo: 0,
        checkinsHoy: 0,
        estado,
        telefono: item.telefono ?? "",
        correo: item.correo ?? "",
        fechaCreacion: item.fecha_creacion,
    };
}

export default function GimnasiosPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const empresaId = sp.get("empresa") ?? "1";

    const [q, setQ] = React.useState("");
    const [rows, setRows] = React.useState<Row[] | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setError(null);
                setRows(null);

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

                const mapped = list.map(mapApiToRow);
                if (alive) setRows(mapped);
            } catch (e: any) {
                if (alive) setError(e?.message ?? "Error al cargar");
            }
        })();
        return () => {
            alive = false;
        };
    }, [empresaId]);

    const filtered = React.useMemo(() => {
        if (!rows) return null;
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter((r) =>
            [
                r.gymId,
                r.gymNombre,
                r.ciudad,
                r.sucursalId,
                r.sucursalNombre,
                r.telefono,
                r.correo,
                r.fechaCreacion ?? "",
            ]
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [rows, q]);

    // handler para accesibilidad con teclado
    const handleCardKeyDown = (e: React.KeyboardEvent, href: string) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(href);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Gimnasios</h1>
                    <p className="text-sm text-foreground-500"></p>
                </div>
                <Button
                    color="primary"
                    startContent={<Icon icon="solar:add-circle-bold-duotone" />}
                    onClick={() => router.push("/admin/gimnasios/nuevo")}
                >
                    Nuevo Gimnasio
                </Button>
            </div>

            {/* Filtro */}
            <div className="flex items-center gap-3">
                <Input
                    className="max-w-md"
                    startContent={<Icon icon="solar:magnifier-linear" />}
                    placeholder="Buscar por gym/sucursal/ciudad/teléfono/correo…"
                    value={q}
                    onValueChange={setQ}
                    isDisabled={!rows && !error}
                />
                <div className="ml-auto text-sm text-foreground-500">
                    {rows ? `${filtered?.length ?? 0} resultado${(filtered?.length ?? 0) === 1 ? "" : "s"}` : ""}
                </div>
            </div>

            {/* Loading / Error / Listado */}
            {!rows && !error && (
                <div className="flex items-center justify-center py-16">
                    <div className="flex items-center gap-3 text-foreground-500">
                        <Spinner />
                        <span>Cargando gimnasios…</span>
                    </div>
                </div>
            )}

            {error && (
                <Card className="border">
                    <CardBody className="text-center">
                        <p className="font-medium">No se pudo cargar la lista.</p>
                        <p className="text-sm text-foreground-500 mt-1">{error}</p>
                        <Button
                            className="mt-3"
                            variant="flat"
                            startContent={<Icon icon="solar:refresh-bold-duotone" />}
                            onClick={() => router.refresh()}
                        >
                            Reintentar
                        </Button>
                    </CardBody>
                </Card>
            )}

            {rows && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(filtered ?? []).map((r) => {
                        const href = `/admin/sucursales/${r.sucursalId}`;
                        return (
                            <Card
                                key={r.sucursalId}
                                // ✅ SIN isPressable para evitar <button> dentro de <button>
                                className="border hover:shadow-md transition cursor-pointer"
                                onClick={() => router.push(href)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => handleCardKeyDown(e, href)}
                            >
                                <CardHeader className="justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-default-100">
                                                <Icon icon="solar:buildings-2-bold-duotone" className="text-xl" />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold">{r.gymNombre}</h3>
                                                <p className="truncate text-xs text-foreground-500">
                                                    {r.gymId} • {r.ciudad}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-500">
                                                    {r.telefono && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Icon icon="solar:phone-bold" />
                                                            {r.telefono}
                                                        </span>
                                                    )}
                                                    {r.correo && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Icon icon="solar:letter-bold" />
                                                            {r.correo}
                                                        </span>
                                                    )}
                                                    {r.fechaCreacion && (
                                                        <Tooltip content="Fecha de creación">
                                                            <span className="inline-flex items-center gap-1">
                                                                <Icon icon="solar:calendar-bold" />
                                                                {new Date(r.fechaCreacion.replace(" ", "T")).toLocaleString()}
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                                <p className="truncate text-xs text-foreground-500">
                                                    <span className="font-medium">Sucursal:</span> {r.sucursalNombre} ({r.sucursalId})
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <Chip size="sm" color={estadoColor(r.estado)} variant="flat">
                                        {r.estado}
                                    </Chip>
                                </CardHeader>

                                <CardBody className="pt-0">
                                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                        <div className="rounded-lg bg-default-100 p-2">
                                            <div className="text-xs text-foreground-500">Miembros</div>
                                            <div className="font-semibold">{r.miembros}</div>
                                        </div>
                                        <div className="rounded-lg bg-default-100 p-2">
                                            <div className="text-xs text-foreground-500">Aforo</div>
                                            <div className="font-semibold">{r.aforo}</div>
                                        </div>
                                        <div className="rounded-lg bg-default-100 p-2">
                                            <div className="text-xs text-foreground-500">Check-ins hoy</div>
                                            <div className="font-semibold">{r.checkinsHoy}</div>
                                        </div>
                                    </div>
                                </CardBody>

                                <CardFooter className="justify-end">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        startContent={<Icon icon="solar:eye-bold-duotone" />}
                                        onClick={(e) => {
                                            e.stopPropagation(); // evita que el click burbujee al Card
                                            router.push(href);
                                        }}
                                    >
                                        Ver / gestionar
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
