"use client";

import React from "react";
import {
    Button, Card, CardBody, CardHeader, Chip, Spinner, Input,
    Select, SelectItem, Tooltip, Progress, Kbd, Divider
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import type { ApiEstadoPago, ApiMembresia } from "../../lib/types";
import { LOCALE, money } from "../../lib/utils";
import { apiListMembresiasByGym, apiListEstadosPago } from "../../lib/api";
import EditarMembresiaModal from "../../sucursales/[sid]/components/membresias/EditarMembresiaModal";

/* --- helpers --- */
const daysBetween = (a: Date, b: Date) =>
    Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const estadoColor = (nombre?: string): "default" | "success" | "warning" | "danger" | "primary" => {
    const n = (nombre || "").toLowerCase();
    if (/(pag|completo|aprob|ok)/.test(n)) return "success";
    if (/(pend|parcial|rev)/.test(n)) return "warning";
    if (/(venc|rech|anul)/.test(n)) return "danger";
    return "primary";
};
type EstadoOption = { id: string; nombre: string };

export default function Page() {
    const router = useRouter();
    const sp = useSearchParams();
    const { id_gimnasio } = useParams<{ id_gimnasio: string }>();

    const gid = Number.parseInt(String(id_gimnasio), 10);
    React.useEffect(() => {
        if (Number.isFinite(gid) && gid > 0) {
            try { localStorage.setItem("gymId", String(gid)); } catch { }
        }
    }, [gid]);

    const [items, setItems] = React.useState<ApiMembresia[]>([]);
    const [estados, setEstados] = React.useState<ApiEstadoPago[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    const [search, setSearch] = React.useState("");
    const [filtro, setFiltro] = React.useState<"todas" | "activas" | "vencidas" | "hoy">("todas");
    const [estadoSel, setEstadoSel] = React.useState<string>("");
    const [sort, setSort] = React.useState<"recientes" | "antiguas" | "monto">("recientes");
    const [page, setPage] = React.useState(1);
    const pageSize = 12;

    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<ApiMembresia | null>(null);

    const now = new Date();

    const reload = React.useCallback(async () => {
        setLoading(true); setErr(null);
        try {
            const [list, ep] = await Promise.all([
                apiListMembresiasByGym(gid),
                apiListEstadosPago(),
            ]);
            list.sort((a, b) => b.id_membresia - a.id_membresia);
            setItems(list);
            setEstados(ep);
            setPage(1);
        } catch (e: any) {
            setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo listar membresías.");
        } finally {
            setLoading(false);
        }
    }, [gid]);

    React.useEffect(() => { if (Number.isFinite(gid)) reload(); }, [gid, reload]);

    React.useEffect(() => {
        const onKey = (ev: KeyboardEvent) => { if (ev.key.toLowerCase() === "r") reload(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [reload]);

    const estadosById = React.useMemo(() => {
        const map = new Map<number, ApiEstadoPago>();
        estados.forEach((e) => map.set(e.id_estado_pago, e));
        return map;
    }, [estados]);

    const filtrados = React.useMemo(() => {
        const term = search.trim().toLowerCase();
        const list = items.filter((m) => {
            const exp = new Date(m.fecha_expiracion);
            const activo = exp > now;
            const passFiltro =
                filtro === "todas" ||
                (filtro === "activas" && activo) ||
                (filtro === "vencidas" && !activo) ||
                (filtro === "hoy" && isSameDay(exp, now));
            const passEstado = !estadoSel || String(m.id_estado_pago) === estadoSel;
            if (!passFiltro || !passEstado) return false;

            if (!term) return true;
            const base = [`#${m.id_membresia}`, m.unidad_duracion, String(m.cantidad_duracion), money(m.precio_total)]
                .join(" ")
                .toLowerCase();
            return base.includes(term);
        });

        list.sort((a, b) => {
            if (sort === "monto") return (b.precio_total || 0) - (a.precio_total || 0);
            if (sort === "antiguas") return a.id_membresia - b.id_membresia;
            return b.id_membresia - a.id_membresia;
        });

        return list;
    }, [items, search, filtro, estadoSel, sort, now]);

    const totalMonto = React.useMemo(
        () => filtrados.reduce((acc, x) => acc + (x.precio_total || 0), 0),
        [filtrados]
    );

    const paginados = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtrados.slice(start, start + pageSize);
    }, [filtrados, page]);

    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));

    const estadoOptions: EstadoOption[] = React.useMemo(() => ([
        { id: "", nombre: "Todos los estados" },
        ...estados.map((e) => ({ id: String(e.id_estado_pago), nombre: e.nombre })),
    ]), [estados]);

    const goSelector = () => {
        try { localStorage.removeItem("gymId"); } catch { }
        const qs = sp.get("empresa") ? `?empresa=${sp.get("empresa")}` : "";
        router.push(`/admin/historial${qs}`);
    };

    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="flat" onPress={goSelector}
                        startContent={<Icon icon="solar:arrow-left-2-bold-duotone" />}>
                        Cambiar gimnasio
                    </Button>
                    <Icon icon="solar:bill-list-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Historial de membresías</span>
                    <Chip size="sm" variant="flat" color="success">{items.length}</Chip>
                </div>
                <Tooltip content="Refrescar (R)">
                    <Button size="sm" variant="flat" startContent={<Icon icon="solar:refresh-bold-duotone" />} onPress={reload}>
                        Refrescar
                    </Button>
                </Tooltip>
            </CardHeader>

            <CardBody className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-[220px] max-w-[280px]">
                        <Input
                            size="sm"
                            placeholder="Buscar #ID, tipo, monto…"
                            startContent={<Icon icon="solar:magnifer-bold-duotone" />}
                            value={search}
                            onValueChange={(v) => { setSearch(v); setPage(1); }}
                        />
                    </div>

                    <div className="flex gap-2">
                        {(["todas", "activas", "vencidas", "hoy"] as const).map((key) => (
                            <Chip
                                key={key}
                                variant={filtro === key ? "solid" : "flat"}
                                color={key === "activas" ? "success" : key === "vencidas" ? "danger" : key === "hoy" ? "warning" : "primary"}
                                onClick={() => { setFiltro(key); setPage(1); }}
                                className="cursor-pointer"
                            >
                                {key === "todas" ? "Todas" : key === "hoy" ? "Expiran hoy" : key.charAt(0).toUpperCase() + key.slice(1)}
                            </Chip>
                        ))}
                    </div>

                    {/* Select con items + render prop (evita error TS) */}
                    <Select
                        aria-label="Estado"
                        size="sm"
                        className="w-[180px]"
                        items={estadoOptions}
                        selectedKeys={estadoSel ? new Set([estadoSel]) : new Set([])}
                        onSelectionChange={(keys) => {
                            const v = String(Array.from(keys)[0] ?? "");
                            setEstadoSel(v);
                            setPage(1);
                        }}
                        disallowEmptySelection={false}
                    >
                        {(item: EstadoOption) => <SelectItem key={item.id}>{item.nombre}</SelectItem>}
                    </Select>

                    <Select
                        aria-label="Orden"
                        size="sm"
                        className="w-[160px]"
                        selectedKeys={new Set([sort])}
                        onSelectionChange={(k) => setSort(String(Array.from(k)[0]) as any)}
                    >
                        <SelectItem key="recientes">Más recientes</SelectItem>
                        <SelectItem key="antiguas">Más antiguas</SelectItem>
                        <SelectItem key="monto">Mayor monto</SelectItem>
                    </Select>

                    <div className="ml-auto flex items-center gap-2 text-sm">
                        <span>Total filtrado:</span>
                        <Chip color="success" variant="flat">{money(totalMonto)}</Chip>
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center gap-2 text-foreground-500">
                        <Spinner size="sm" /> Cargando…
                    </div>
                )}
                {err && !loading && (
                    <div className="text-danger-500 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold-duotone" />
                        {err}
                        <Button size="sm" variant="flat" onPress={reload} className="ml-2">Reintentar</Button>
                    </div>
                )}

                {!loading && filtrados.length === 0 && (
                    <div className="text-sm text-foreground-500">Sin resultados con los filtros actuales.</div>
                )}

                {/* Lista */}
                {!loading && filtrados.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {paginados.map((m) => {
                            const exp = new Date(m.fecha_expiracion);
                            const ini = new Date(m.fecha_inicio);
                            const totalDays = Math.max(1, daysBetween(ini, exp));
                            const daysLeft = Math.max(0, daysBetween(new Date(), exp));
                            const progress = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));
                            const estado = estadosById.get(m.id_estado_pago);

                            return (
                                <Card key={m.id_membresia} className="border-sm hover:shadow-md transition-shadow">
                                    <CardBody className="flex flex-col gap-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Chip size="sm" variant="flat">#{m.id_membresia}</Chip>
                                                <Chip size="sm" variant="flat" color="primary">
                                                    {m.unidad_duracion.toUpperCase()} × {m.cantidad_duracion}
                                                </Chip>
                                            </div>
                                            <Chip size="sm" color={estadoColor(estado?.nombre)} variant="flat">
                                                {estado?.nombre || "—"}
                                            </Chip>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-foreground-500">
                                                <div>Inicio: {new Date(m.fecha_inicio).toLocaleString(LOCALE)}</div>
                                                <div>Expira: {exp.toLocaleString(LOCALE)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">{money(m.precio_total)}</div>
                                                {daysLeft > 0 ? (
                                                    <div className="text-xs opacity-80">{daysLeft} días restantes</div>
                                                ) : (
                                                    <div className="text-xs text-danger-500">Vencida</div>
                                                )}
                                            </div>
                                        </div>

                                        <Progress aria-label="progreso" value={progress} className="h-1.5" />

                                        <div className="flex justify-end gap-2 pt-1">
                                            <Tooltip content="Editar">
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => { setEditing(m); setEditOpen(true); }}
                                                    startContent={<Icon icon="solar:pen-bold-duotone" />}
                                                >
                                                    Editar
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Paginación */}
                {!loading && filtrados.length > pageSize && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-foreground-500">
                            Página {page} de {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="flat" isDisabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
                                Anterior
                            </Button>
                            <Button size="sm" variant="flat" isDisabled={page >= totalPages} onPress={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}

                <Divider />
                <div className="flex items-center justify-between text-xs text-foreground-500">
                    <div className="flex items-center gap-1"></div>
                    <div className="opacity-80">
                        Mostrando {Math.min(paginados.length, filtrados.length)} de {filtrados.length} resultados
                    </div>
                </div>
            </CardBody>

            <EditarMembresiaModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                item={editing}
                estados={estados}
                onSaved={(upd) => {
                    setItems((prev) => prev.map((x) => (x.id_membresia === upd.id_membresia ? upd : x)));
                }}
            />
        </Card>
    );
}
