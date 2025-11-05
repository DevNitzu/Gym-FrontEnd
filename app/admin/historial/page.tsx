"use client";

import React from "react";
import {
    Button, Card, CardBody, CardHeader, Chip, Spinner, Tooltip, Input,
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
            try { localStorage.setItem("auth:empresaId", empresaFromURL); } catch { }
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

    React.useEffect(() => { loadGyms(); }, [loadGyms]);

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
        <Card className="border">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:gym-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Selecciona un gimnasio</span>
                    <Chip size="sm" variant="flat">{gyms.length}</Chip>
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                    <Input
                        size="sm"
                        className="w-full sm:w-64"
                        startContent={<Icon icon="solar:magnifier-bold-duotone" />}
                        placeholder="Buscar gimnasio…"
                        value={q}
                        onValueChange={setQ}
                        isDisabled={loading}
                    />
                    <Tooltip content="Refrescar">
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

            <CardBody className="space-y-4">
                {!empresaId && (
                    <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm flex items-center gap-2">
                        <Icon
                            icon="solar:info-square-bold-duotone"
                            className="text-warning-500 text-xl"
                        />
                        Agrega <code>?empresa=ID_EMPRESA</code> a la URL
                        (o guarda <code>auth:empresaId</code> en el navegador).
                    </div>
                )}

                {loading && (
                    <div className="flex items-center gap-2 text-foreground-500">
                        <Spinner size="sm" /> Cargando gimnasios…
                    </div>
                )}

                {err && !loading && (
                    <div className="text-danger-500 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold-duotone" />
                        {err}
                    </div>
                )}

                {!loading && empresaId && filtered.length === 0 && !err && (
                    <div className="text-sm text-foreground-500">No se encontraron gimnasios.</div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {filtered.map((g) => {
                            const color = chipColor(g.activo);
                            const label = chipLabel(g.activo);

                            // ✅ Construimos el href con query ?empresa si existe
                            const href = {
                                pathname: `/admin/historial/${g.id_gimnasio}`,
                                query: empresaId ? { empresa: empresaId } : undefined,
                            };

                            return (
                                <Link
                                    key={g.id_gimnasio}
                                    href={href}
                                    className="focus:outline-none rounded-xl"
                                >
                                    <Card
                                        className="border-sm hover:shadow-md transition-shadow cursor-pointer h-full"
                                        role="link"
                                        tabIndex={0}
                                        aria-label={`Abrir historial de ${g.nombre ?? `Gimnasio #${g.id_gimnasio}`}`}
                                    >
                                        <CardBody className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-default-100">
                                                    <Icon icon="solar:buildings-2-bold-duotone" className="text-xl" />
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="truncate font-semibold">
                                                        {g.nombre?.trim() || `Gimnasio #${g.id_gimnasio}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
