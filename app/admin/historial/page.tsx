"use client";

import React from "react";
import {
    Button, Card, CardBody, CardHeader, Chip, Spinner, Tooltip, Kbd, Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ApiGimnasio } from "../lib/types";
import { apiListGimnasiosByEmpresa } from "../lib/api";

/* ---- Helpers de estado persistente ---- */
function useEmpresaId(): string | undefined {
    const sp = useSearchParams();
    const q = sp.get("empresa") || undefined;
    if (q && typeof window !== "undefined") {
        try { localStorage.setItem("auth:empresaId", q); } catch { }
        return q;
    }
    if (typeof window !== "undefined") {
        const saved = localStorage.getItem("auth:empresaId") || undefined;
        return saved || undefined;
    }
    return undefined;
}

export default function Page() {
    const router = useRouter();
    const sp = useSearchParams();
    const empresaId = useEmpresaId();

    const [gyms, setGyms] = React.useState<ApiGimnasio[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    const loadGyms = React.useCallback(async () => {
        if (!empresaId) {
            setGyms([]);
            setErr("Falta ?empresa en la URL o en localStorage.");
            return;
        }
        setLoading(true); setErr(null);
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

    const goHistorial = (id: number) => {
        try { localStorage.setItem("gymId", String(id)); } catch { }
        const qs = new URLSearchParams(sp.toString());
        // conservamos ?empresa si existe
        const suffix = qs.has("empresa") ? `?empresa=${qs.get("empresa")}` : "";
        router.push(`/admin/historial/${id}${suffix}`);
    };

    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:gym-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Selecciona un gimnasio</span>
                    <Chip size="sm" variant="flat">{gyms.length}</Chip>
                </div>
                <Tooltip content="Refrescar">
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={loadGyms}
                        startContent={<Icon icon="solar:refresh-bold-duotone" />}
                    >
                        Refrescar
                    </Button>
                </Tooltip>
            </CardHeader>

            <CardBody className="space-y-4">
                {!empresaId && (
                    <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm flex items-center gap-2">
                        <Icon icon="solar:info-square-bold-duotone" className="text-warning-500 text-xl" />
                        Agrega <code>?empresa=ID_EMPRESA</code> a la URL o guarda <code>auth:empresaId</code> en localStorage.
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

                {!loading && gyms.length === 0 && empresaId && !err && (
                    <div className="text-sm text-foreground-500">No se encontraron gimnasios para esta empresa.</div>
                )}

                {!loading && gyms.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {gyms.map((g) => (
                            <Card
                                key={g.id_gimnasio}
                                className="border-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => goHistorial(g.id_gimnasio)}
                            >
                                <CardBody className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold">
                                            {g.nombre?.trim() || `Gimnasio #${g.id_gimnasio}`}
                                        </div>
                                        <div className="text-xs text-foreground-500">ID: {g.id_gimnasio}</div>
                                    </div>
                                    <Button size="sm" variant="flat" onPress={() => goHistorial(g.id_gimnasio)}>
                                        Ver historial
                                    </Button>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}

                <Divider />
                <div className="text-xs text-foreground-500 flex items-center gap-1">
                    <Kbd>R</Kbd> para refrescar
                </div>
            </CardBody>
        </Card>
    );
}
