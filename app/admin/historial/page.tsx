"use client";

import React from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Spinner,
    Tooltip,
    Input,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { ApiGimnasio } from "../lib/types";
import { apiListGimnasiosByEmpresa } from "../lib/api";

/* ---- Helpers ---- */
function chipColor(activo?: number | boolean) {
    const on = typeof activo === "boolean" ? activo : Number(activo) === 1;
    return on ? ("success" as const) : ("danger" as const);
}
function chipLabel(activo?: number | boolean) {
    const on = typeof activo === "boolean" ? activo : Number(activo) === 1;
    return on ? "Abierta" : "Cerrada";
}

type PageProps = {
    searchParams: Promise<{ empresa?: string }>;
};

export default function Page({ searchParams }: PageProps) {
    const router = useRouter();

    // ✅ En Next 15: unwrap del Promise
    const sp = React.use(searchParams);
    const empresaFromURL = sp?.empresa ?? "";

    const [empresaId, setEmpresaId] = React.useState<string>(empresaFromURL);

    // Persistimos/recuperamos empresaId sin romper hidratación
    React.useEffect(() => {
        if (!empresaFromURL) {
            try {
                const saved = localStorage.getItem("auth:empresaId");
                if (saved) setEmpresaId(saved);
            } catch { }
        } else {
            try {
                localStorage.setItem("auth:empresaId", empresaFromURL);
            } catch { }
        }
    }, [empresaFromURL]);

    const [gyms, setGyms] = React.useState<ApiGimnasio[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);
    const [q, setQ] = React.useState("");

    const loadGyms = React.useCallback(async () => {
        if (!empresaId) {
            setGyms([]);
            setErr("Falta el parámetro ?empresa.");
            return;
        }
        setLoading(true);
        setErr(null);
        try {
            const list = await apiListGimnasiosByEmpresa(empresaId);
            setGyms(list);
        } catch (e: any) {
            setErr(e?.message || "No se pudieron cargar los gimnasios.");
        } finally {
            setLoading(false);
        }
    }, [empresaId]);

    React.useEffect(() => {
        loadGyms();
    }, [loadGyms]);

    const filtered = React.useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return gyms;
        return gyms.filter((g) =>
            [
                g.nombre ?? "",
                g.direccion ?? "",
                g.telefono ?? "",
                g.correo ?? "",
                String(g.id_gimnasio),
            ]
                .join(" ")
                .toLowerCase()
                .includes(needle)
        );
    }, [gyms, q]);

    return (
        <div className="w-full h-full">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <Card className="border bg-background/80 backdrop-blur rounded-2xl shadow-sm">
                    {/* HEADER */}
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-3 border-b border-default-100">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-base md:text-lg">
                                        Selecciona un gimnasio
                                    </span>
                                    <Chip size="sm" variant="flat">
                                        {gyms.length} total
                                    </Chip>
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                size="sm"
                                radius="lg"
                                className="w-full md:w-64"
                                startContent={<Icon icon="solar:magnifier-bold-duotone" />}
                                placeholder="Buscar gimnasio…"
                                value={q}
                                onValueChange={setQ}
                                isDisabled={loading}
                            />
                            <Tooltip content="Refrescar lista">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={loadGyms}
                                    startContent={<Icon icon="solar:refresh-bold-duotone" />}
                                    isDisabled={loading}
                                >
                                    Refrescar
                                </Button>
                            </Tooltip>
                        </div>
                    </CardHeader>

                    {/* BODY */}
                    <CardBody className="space-y-4 py-4">
                        {!empresaId && (
                            <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm flex items-start gap-2">
                                <Icon
                                    icon="solar:info-square-bold-duotone"
                                    className="text-warning-500 text-xl mt-0.5"
                                />
                                <div>
                                    <p className="font-medium mb-0.5">Falta el ID de empresa.</p>
                                    <p className="text-xs text-foreground-600">
                                        Agrega <code>?empresa=ID_EMPRESA</code> a la URL o guarda{" "}
                                        <code>auth:empresaId</code> en el navegador.
                                    </p>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="flex items-center gap-2 text-foreground-500 text-sm">
                                <Spinner size="sm" /> Cargando gimnasios…
                            </div>
                        )}

                        {err && !loading && (
                            <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm flex items-start gap-2">
                                <Icon
                                    icon="solar:danger-triangle-bold-duotone"
                                    className="text-danger-500 text-xl mt-0.5"
                                />
                                <div>
                                    <p className="font-medium mb-0.5">
                                        No se pudieron cargar los gimnasios.
                                    </p>
                                    <p className="text-xs text-foreground-600">{err}</p>
                                </div>
                            </div>
                        )}

                        {!loading && empresaId && filtered.length === 0 && !err && (
                            <div className="text-sm text-foreground-500">
                                No se encontraron gimnasios con ese criterio de búsqueda.
                            </div>
                        )}

                        {!loading && filtered.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filtered.map((g) => {
                                    const color = chipColor(g.activo);
                                    const label = chipLabel(g.activo);

                                    // Construimos el href con query ?empresa si existe
                                    const href = {
                                        pathname: `/admin/historial/${g.id_gimnasio}`,
                                        query: empresaId ? { empresa: empresaId } : undefined,
                                    };

                                    return (
                                        <Link
                                            key={g.id_gimnasio}
                                            href={href}
                                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-2xl"
                                        >
                                            <Card
                                                className="border-sm rounded-2xl bg-background/90 hover:shadow-md hover:-translate-y-0.5 transition-transform cursor-pointer h-full"
                                                role="link"
                                                tabIndex={0}
                                                aria-label={`Abrir historial de ${g.nombre ?? `Gimnasio #${g.id_gimnasio}`}`}
                                            >
                                                <CardBody className="flex flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-default-100 ring-1 ring-default-200">
                                                                <Icon
                                                                    icon="solar:buildings-2-bold-duotone"
                                                                    className="text-lg"
                                                                />
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="truncate font-semibold text-sm">
                                                                    {g.nombre?.trim() ||
                                                                        `Gimnasio #${g.id_gimnasio}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Chip size="sm" color={color} variant="flat">
                                                            {label}
                                                        </Chip>
                                                    </div>

                                                    {(g.direccion || g.telefono || g.correo) && (
                                                        <div className="space-y-1 text-[11px] text-foreground-500">
                                                            {g.direccion && (
                                                                <div className="flex items-center gap-1 truncate">
                                                                    <Icon icon="solar:map-point-bold" />
                                                                    <span className="truncate">{g.direccion}</span>
                                                                </div>
                                                            )}
                                                            {g.telefono && (
                                                                <div className="flex items-center gap-1 truncate">
                                                                    <Icon icon="solar:phone-bold" />
                                                                    <span>{g.telefono}</span>
                                                                </div>
                                                            )}
                                                            {g.correo && (
                                                                <div className="flex items-center gap-1 truncate">
                                                                    <Icon icon="solar:letter-bold" />
                                                                    <span className="truncate">{g.correo}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
