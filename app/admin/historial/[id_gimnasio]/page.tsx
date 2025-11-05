"use client";

import React from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Spinner,
    Input,
    Select,
    SelectItem,
    Tooltip,
    Progress,
    Divider,
    Tabs,
    Tab,
    Accordion,
    AccordionItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import type { ApiEstadoPago, ApiMembresia, ApiCliente } from "../../lib/types";
import { LOCALE, money } from "../../lib/utils";
import {
    apiListMembresiasByGym,
    apiListEstadosPago,
    apiGetCliente,
} from "../../lib/api";
import EditarMembresiaModal from "../../sucursales/[sid]/components/membresias/EditarMembresiaModal";

/* ===================== Helpers ===================== */
const daysBetween = (a: Date, b: Date) =>
    Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const estadoColor = (
    nombre?: string
): "default" | "success" | "warning" | "danger" | "primary" => {
    const n = (nombre || "").toLowerCase();
    if (/(pag|completo|aprob|ok)/.test(n)) return "success";
    if (/(pend|parcial|rev)/.test(n)) return "warning";
    if (/(venc|rech|anul)/.test(n)) return "danger";
    return "primary";
};

type EstadoOption = { id: string; nombre: string };

/* ✅ Formato de fecha sin hora */
const DATE_OPTS: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
};
const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString(LOCALE, DATE_OPTS);

/* Etiquetas legibles para unidad */
const UNITS_LABEL: Record<string, string> = {
    DIA: "Día",
    SEMANA: "Semana",
    MES: "Mes",
    ANO: "Año",
    AÑO: "Año",
};
const unitLabel = (u?: string) =>
    UNITS_LABEL[(u || "").toUpperCase()] || (u || "—");

/** Nombre del miembro con preferencia por cache de cliente */
function getMemberName(m: any, cache?: Map<number, ApiCliente>): string {
    const id = Number(m?.id_cliente);
    const byId = Number.isFinite(id) && cache ? cache.get(id) : undefined;
    if (byId) return `${byId.nombre ?? ""} ${byId.apellido ?? ""}`.trim();

    const cand = m?.miembro ?? m?.socio ?? m?.cliente ?? m?.usuario ?? null;
    const chain = [
        cand?.nombre && cand?.apellido ? `${cand.nombre} ${cand.apellido}` : null,
        cand?.nombres && cand?.apellidos ? `${cand.nombres} ${cand.apellidos}` : null,
        typeof cand === "string" ? cand : null,
        m?.miembro_nombre ??
        m?.cliente_nombre ??
        m?.socio_nombre ??
        m?.usuario_nombre ??
        null,
        m?.nombres && m?.apellidos ? `${m.nombres} ${m.apellidos}` : null,
        m?.nombre_completo ?? null,
    ].filter(Boolean);

    return ((chain[0] as string) || "").trim();
}

/* ===================== Página ===================== */
export default function Page() {
    const router = useRouter();
    const sp = useSearchParams();
    const { id_gimnasio } = useParams<{ id_gimnasio: string }>();

    const gid = Number.parseInt(String(id_gimnasio), 10);
    React.useEffect(() => {
        if (Number.isFinite(gid) && gid > 0) {
            try {
                localStorage.setItem("gymId", String(gid));
            } catch { }
        }
    }, [gid]);

    const [items, setItems] = React.useState<ApiMembresia[]>([]);
    const [estados, setEstados] = React.useState<ApiEstadoPago[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    // Filtros básicos (barra)
    const [search, setSearch] = React.useState("");
    const [filtro, setFiltro] = React.useState<"todas" | "activas" | "vencidas">(
        "todas"
    );
    const [estadoSel, setEstadoSel] = React.useState<string>(""); // "" = Todos los estados

    // Vista por pestañas
    const [tab, setTab] = React.useState<"lista" | "member" | "duration" | "reportes">("lista");

    // Paginación (solo en "lista")
    const [page, setPage] = React.useState(1);
    const PAGE_SIZE = 12;

    // Modal edición
    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<ApiMembresia | null>(null);

    const now = new Date();

    // cache de clientes por id_cliente
    const [clienteCache, setClienteCache] = React.useState<
        Map<number, ApiCliente>
    >(new Map());

    const reload = React.useCallback(async () => {
        setLoading(true);
        setErr(null);
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
            setErr(
                e?.__is401
                    ? "Sesión expirada (401). Inicia sesión."
                    : e?.message || "No se pudo listar membresías."
            );
        } finally {
            setLoading(false);
        }
    }, [gid]);

    React.useEffect(() => {
        if (Number.isFinite(gid)) reload();
    }, [gid, reload]);

    React.useEffect(() => {
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key.toLowerCase() === "r") reload();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [reload]);

    const estadosById = React.useMemo(() => {
        const map = new Map<number, ApiEstadoPago>();
        estados.forEach((e) => map.set(e.id_estado_pago, e));
        return map;
    }, [estados]);

    // Prefetch de clientes necesarios según lo filtrado para enriquecer búsqueda/UI
    React.useEffect(() => {
        const idsNecesarios = new Set<number>();
        for (const m of items) {
            const id = Number(m.id_cliente);
            if (Number.isFinite(id)) idsNecesarios.add(id);
        }
        const faltan = Array.from(idsNecesarios).filter((id) => !clienteCache.has(id));
        if (faltan.length === 0) return;

        (async () => {
            try {
                const fetched = await Promise.all(faltan.map((id) => apiGetCliente(id)));
                setClienteCache((prev) => {
                    const next = new Map(prev);
                    for (const c of fetched) next.set(c.id_cliente, c);
                    return next;
                });
            } catch (e) {
                console.error("No se pudo cargar uno o más clientes", e);
            }
        })();
    }, [items, clienteCache]);

    // Opciones "Estado"
    const estadoOptions: EstadoOption[] = React.useMemo(
        () => [
            { id: "", nombre: "Todos los estados" },
            ...estados.map((e) => ({ id: String(e.id_estado_pago), nombre: e.nombre })),
        ],
        [estados]
    );

    // Filtro + búsqueda (común a todas las vistas)
    const filtrados = React.useMemo(() => {
        const term = search.trim().toLowerCase();

        const list = items.filter((m) => {
            const exp = new Date(m.fecha_expiracion);
            const activo = exp > now;

            const passFiltro =
                filtro === "todas" ||
                (filtro === "activas" && activo) ||
                (filtro === "vencidas" && !activo);

            const passEstado = !estadoSel || String(m.id_estado_pago) === estadoSel;
            if (!passFiltro || !passEstado) return false;

            if (!term) return true;

            const cli = Number.isFinite(Number(m.id_cliente))
                ? clienteCache.get(Number(m.id_cliente))
                : undefined;

            const base = [
                `#${m.id_membresia}`,
                m.unidad_duracion,
                String(m.cantidad_duracion),
                money(m.precio_total),
                getMemberName(m, clienteCache),
                cli?.cedula,
                cli?.telefono,
                cli?.correo,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return base.includes(term);
        });

        return list;
    }, [items, search, filtro, estadoSel, now, clienteCache]);

    // Métricas rápidas
    const totalMonto = React.useMemo(
        () => filtrados.reduce((acc, x) => acc + (x.precio_total || 0), 0),
        [filtrados]
    );
    const countActivas = React.useMemo(
        () => filtrados.filter((m) => new Date(m.fecha_expiracion) > now).length,
        [filtrados, now]
    );
    const countVencidas = React.useMemo(
        () => filtrados.filter((m) => new Date(m.fecha_expiracion) <= now).length,
        [filtrados, now]
    );
    const ticketProm = filtrados.length ? totalMonto / filtrados.length : 0;

    // Agrupaciones para pestañas
    const groupedByMember = React.useMemo(() => {
        const map = new Map<string, ApiMembresia[]>();
        for (const it of filtrados) {
            const name = getMemberName(it, clienteCache) || "— Sin nombre —";
            if (!map.has(name)) map.set(name, []);
            map.get(name)!.push(it);
        }
        const entries = Array.from(map.entries()).sort((a, b) => {
            const suma = (arr: ApiMembresia[]) =>
                arr.reduce((acc, x) => acc + (x.precio_total || 0), 0);
            return suma(b[1]) - suma(a[1]);
        });
        return entries;
    }, [filtrados, clienteCache]);

    const groupedByDuration = React.useMemo(() => {
        const map = new Map<string, ApiMembresia[]>();
        for (const it of filtrados) {
            const key = (it.unidad_duracion || "—").toString().toUpperCase();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(it);
        }
        const entries = Array.from(map.entries()).sort((a, b) => {
            const suma = (arr: ApiMembresia[]) =>
                arr.reduce((acc, x) => acc + (x.precio_total || 0), 0);
            return suma(b[1]) - suma(a[1]);
        });
        return entries;
    }, [filtrados]);

    // Paginación (vista lista)
    const paginados = React.useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filtrados.slice(start, start + PAGE_SIZE);
    }, [filtrados, page]);
    const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));

    const goSelector = () => {
        try {
            localStorage.removeItem("gymId");
        } catch { }
        const qs = sp.get("empresa") ? `?empresa=${sp.get("empresa")}` : "";
        router.push(`/admin/historial${qs}`);
    };

    /* ===== Tarjeta de membresía (solo color sutil por estado, sin chip de "pagado") ===== */
    const MembresiaCard: React.FC<{ m: ApiMembresia }> = ({ m }) => {
        const exp = new Date(m.fecha_expiracion);
        const ini = new Date(m.fecha_inicio);
        const totalDays = Math.max(1, daysBetween(ini, exp));
        const daysLeft = Math.max(0, daysBetween(new Date(), exp));
        const progress = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));

        const estado = estadosById.get(m.id_estado_pago);
        const vencida = exp <= now;

        // Tono por estado (sin mostrar texto)
        const tone: "success" | "warning" | "danger" | "primary" | "default" =
            vencida ? "danger" : estadoColor(estado?.nombre) || "default";

        const borderCls: Record<string, string> = {
            success: "border-success/30",
            warning: "border-warning/30",
            danger: "border-danger/30",
            primary: "border-default-200",
            default: "border-default-200",
        };
        const stripCls: Record<string, string> = {
            success: "bg-success/20",
            warning: "bg-warning/20",
            danger: "bg-danger/20",
            primary: "bg-default-200",
            default: "bg-default-200",
        };

        return (
            <Card
                key={m.id_membresia}
                className={`border-sm hover:shadow-md transition-shadow ${borderCls[tone]}`}
            >
                {/* Barra superior sutil según estado (1–2px) */}
                <div className={`h-1 rounded-t-medium ${stripCls[tone]}`} />

                <CardBody className="flex flex-col gap-2 text-sm">
                    {/* Top: cliente + acción editar (sin chip de estado) */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-[13px] text-foreground-500 truncate">
                                <strong>{getMemberName(m, clienteCache) || "— Sin nombre —"}</strong>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Chip size="sm" variant="flat">
                                    {unitLabel(m.unidad_duracion)?.toUpperCase()} × {m.cantidad_duracion}
                                </Chip>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Tooltip content="Editar">
                                <Button
                                    size="sm"
                                    isIconOnly
                                    variant="flat"
                                    onPress={() => { setEditing(m); setEditOpen(true); }}
                                >
                                    <Icon icon="solar:pen-bold-duotone" />
                                </Button>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Fechas + monto (sin hora) */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="text-foreground-500">
                            <div>Inicio: {fmtDate(m.fecha_inicio)}</div>
                            <div>
                                Expira: {fmtDate(exp)} {vencida && <span className="text-danger-500">· Vencida</span>}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-semibold leading-none">{money(m.precio_total)}</div>
                            <div className="text-[12px] opacity-80">
                                {daysLeft > 0 ? `${daysLeft} días restantes` : "0 días restantes"}
                            </div>
                        </div>
                    </div>

                    <Progress aria-label="progreso" value={progress} className="h-1.5" />
                </CardBody>
            </Card>
        );
    };

    /* ===================== Utils Reportes ===================== */
    const downloadBlob = (content: BlobPart, filename: string, type = "text/csv;charset=utf-8") => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toCSV = (rows: string[][]) =>
        rows.map(r => r.map(cell => {
            const v = (cell ?? "").toString();
            if (v.includes(",") || v.includes(";") || v.includes('"') || v.includes("\n")) {
                return `"${v.replace(/"/g, '""')}"`;
            }
            return v;
        }).join(",")).join("\n");

    const estadoNombre = (m: ApiMembresia) => estadosById.get(m.id_estado_pago)?.nombre ?? "";

    // Filtros específicos de Reportes
    const [repDesde, setRepDesde] = React.useState<string>(""); // YYYY-MM-DD
    const [repHasta, setRepHasta] = React.useState<string>("");
    const repData = React.useMemo(() => {
        const d0 = repDesde ? new Date(repDesde + "T00:00:00") : null;
        const d1 = repHasta ? new Date(repHasta + "T23:59:59") : null;
        return filtrados.filter(m => {
            const ini = new Date(m.fecha_inicio);
            const exp = new Date(m.fecha_expiracion);
            const okIni = d0 ? ini >= d0 : true;
            const okFin = d1 ? exp <= d1 : true;
            return okIni && okFin;
        });
    }, [filtrados, repDesde, repHasta]);

    const exportCSV = () => {
        const header = [
            "ID",
            "Miembro",
            "Unidad",
            "Cant.",
            "Inicio",
            "Expira",
            "Precio",
            "Estado",
            "Activa",
            "Días restantes",
        ];
        const rows = repData.map(m => {
            const exp = new Date(m.fecha_expiracion);
            const active = exp > now;
            const daysLeft = Math.max(0, daysBetween(new Date(), exp));
            return [
                String(m.id_membresia),
                getMemberName(m, clienteCache),
                (m.unidad_duracion || "").toString().toUpperCase(),
                String(m.cantidad_duracion ?? ""),
                fmtDate(m.fecha_inicio),
                fmtDate(m.fecha_expiracion),
                money(m.precio_total),
                estadoNombre(m),
                active ? "Sí" : "No",
                String(daysLeft),
            ];
        });
        downloadBlob(toCSV([header, ...rows]), `membresias_${Date.now()}.csv`);
    };

    const exportCSVByMember = () => {
        const header = ["Miembro", "Cantidad", "Total"];
        const map = new Map<string, number>();
        repData.forEach(m => {
            const name = getMemberName(m, clienteCache) || "— Sin nombre —";
            map.set(name, (map.get(name) ?? 0) + (m.precio_total || 0));
        });
        const rows = Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, total]) => [name, String(repData.filter(x => getMemberName(x, clienteCache) === name).length), money(total)]);
        downloadBlob(toCSV([header, ...rows]), `membresias_por_miembro_${Date.now()}.csv`);
    };

    const printReport = () => {
        const win = window.open("", "_blank");
        if (!win) return;
        const rows = repData.map(m => {
            return `<tr>
        <td>${m.id_membresia}</td>
        <td>${getMemberName(m, clienteCache)}</td>
        <td>${(m.unidad_duracion || "").toString().toUpperCase()}</td>
        <td>${m.cantidad_duracion ?? ""}</td>
        <td>${fmtDate(m.fecha_inicio)}</td>
        <td>${fmtDate(m.fecha_expiracion)}</td>
        <td>${money(m.precio_total)}</td>
        <td>${estadoNombre(m)}</td>
      </tr>`;
        }).join("");

        win.document.write(`
      <html>
        <head>
          <title>Reporte de Membresías</title>
          <style>
            body{font-family: ui-sans-serif, system-ui; padding:16px;}
            h1{font-size:18px; margin:0 0 12px;}
            table{width:100%; border-collapse:collapse; font-size:12px;}
            th,td{border:1px solid #ddd; padding:6px; text-align:left;}
            th{background:#f5f5f5;}
          </style>
        </head>
        <body>
          <h1>Reporte de Membresías</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Miembro</th><th>Unidad</th><th>Cant.</th>
                <th>Inicio</th><th>Expira</th><th>Precio</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
        win.document.close();
        win.focus();
        win.print();
    };

    return (
        <Card className="border">
            {/* ===== Header ===== */}
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:bill-list-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Historial de membresías</span>
                    <Chip size="sm" variant="flat" color="success">
                        {items.length}
                    </Chip>
                </div>

                {/* Botones a la derecha */}
                <div className="flex items-center gap-2">
                    <Tooltip content="Cambiar gimnasio">
                        <Button
                            size="sm"
                            onPress={goSelector}
                            startContent={<Icon icon="solar:gym-bold-duotone" className="text-lg" />}
                        >
                            Cambiar gimnasio
                        </Button>
                    </Tooltip>
                    <Tooltip content="Refrescar (R)">
                        <Button
                            size="sm"
                            variant="flat"
                            startContent={<Icon icon="solar:refresh-bold-duotone" />}
                            onPress={reload}
                        >
                            Refrescar
                        </Button>
                    </Tooltip>
                </div>
            </CardHeader>

            <CardBody className="space-y-4">
                {/* ===== Resumen rápido ===== */}
                <div className="flex flex-wrap gap-2 text-sm">
                    <Chip
                        color="success"
                        variant="flat"
                        startContent={<Icon icon="solar:check-circle-bold-duotone" />}
                    >
                        {countActivas} Activas
                    </Chip>
                    <Chip
                        color="danger"
                        variant="flat"
                        startContent={<Icon icon="solar:close-circle-bold-duotone" />}
                    >
                        {countVencidas} Vencidas
                    </Chip>
                </div>

                {/* ===== Toolbar ===== */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-[260px] max-w-[360px]">
                        <Input
                            size="sm"
                            placeholder="Buscar"
                            startContent={<Icon icon="solar:magnifer-bold-duotone" />}
                            value={search}
                            onValueChange={(v) => { setSearch(v); setPage(1); }}
                        />
                    </div>

                    {/* Filtro rápido por estado temporal */}
                    <div className="flex gap-2">
                        {(["todas", "activas", "vencidas"] as const).map((key) => (
                            <Chip
                                key={key}
                                variant={filtro === key ? "solid" : "flat"}
                                color={key === "activas" ? "success" : key === "vencidas" ? "danger" : "primary"}
                                onClick={() => { setFiltro(key); setPage(1); }}
                                className="cursor-pointer"
                            >
                                {key === "todas" ? "Todas" : key.charAt(0).toUpperCase() + key.slice(1)}
                            </Chip>
                        ))}
                    </div>

                    {/* Estado */}
                    <Select
                        aria-label="Estado"
                        size="sm"
                        className="w-[180px]"
                        items={estadoOptions}
                        selectedKeys={new Set([estadoSel])} // "" = Todos los estados
                        onSelectionChange={(keys) => {
                            const v = String(Array.from(keys)[0] ?? "");
                            setEstadoSel(v);
                            setPage(1);
                        }}
                        disallowEmptySelection={false}
                    >
                        {(item: EstadoOption) => <SelectItem key={item.id}>{item.nombre}</SelectItem>}
                    </Select>

                    <div className="ml-auto flex items-center gap-2 text-sm">
                        <span>Total:</span>
                        <Chip color="success" variant="flat">
                            <strong>{money(totalMonto)}</strong>
                        </Chip>
                    </div>
                </div>

                {/* Mensajes de estado */}
                {loading && (
                    <div className="flex items-center gap-2 text-foreground-500">
                        <Spinner size="sm" /> Cargando…
                    </div>
                )}
                {err && !loading && (
                    <div className="text-danger-500 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold-duotone" />
                        {err}
                        <Button size="sm" variant="flat" onPress={reload} className="ml-2">
                            Reintentar
                        </Button>
                    </div>
                )}
                {!loading && filtrados.length === 0 && (
                    <div className="text-sm text-foreground-500">
                        Sin resultados con los filtros actuales.
                    </div>
                )}

                {/* ===== Pestañas de vista ===== */}
                <Tabs
                    selectedKey={tab}
                    onSelectionChange={(k) => setTab(String(k) as typeof tab)}
                    variant="underlined"
                    aria-label="Vistas de historial"
                >
                    <Tab
                        key="lista"
                        title={<div className="flex items-center gap-2"><Icon className="text-base" icon="solar:list-bold-duotone" /><span>Lista</span></div>}
                    >
                        {!loading && filtrados.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {paginados.map((m) => <MembresiaCard key={m.id_membresia} m={m} />)}
                                </div>

                                {filtrados.length > PAGE_SIZE && (
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
                            </>
                        )}
                    </Tab>

                    <Tab
                        key="member"
                        title={<div className="flex items-center gap-2"><Icon className="text-base" icon="solar:user-bold-duotone" /><span>Por miembro</span></div>}
                    >
                        {!loading && filtrados.length > 0 && (
                            <Accordion variant="bordered" selectionMode="multiple" defaultExpandedKeys={new Set([])}>
                                {groupedByMember.map(([memberName, arr]) => {
                                    const suma = arr.reduce((acc, x) => acc + (x.precio_total || 0), 0);
                                    return (
                                        <AccordionItem
                                            key={memberName}
                                            aria-label={memberName}
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="solar:user-bold-duotone" className="text-base" />
                                                    <span className="font-medium">{memberName}</span>
                                                    <Chip size="sm" variant="flat">{arr.length}</Chip>
                                                    <Chip size="sm" color="success" variant="flat">{money(suma)}</Chip>
                                                </div>
                                            }
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                {arr.map((m) => <MembresiaCard key={m.id_membresia} m={m} />)}
                                            </div>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        )}
                    </Tab>

                    <Tab
                        key="duration"
                        title={<div className="flex items-center gap-2"><Icon className="text-base" icon="solar:calendar-bold-duotone" /><span>Por duración</span></div>}
                    >
                        {!loading && filtrados.length > 0 && (
                            <Accordion variant="bordered" selectionMode="multiple" defaultExpandedKeys={new Set([])}>
                                {groupedByDuration.map(([unit, arr]) => {
                                    const suma = arr.reduce((acc, x) => acc + (x.precio_total || 0), 0);
                                    const activas = arr.filter((x) => new Date(x.fecha_expiracion) > now).length;
                                    const vencidas = arr.length - activas;
                                    return (
                                        <AccordionItem
                                            key={unit}
                                            aria-label={unit}
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="solar:calendar-bold-duotone" className="text-base" />
                                                    <span className="font-medium">{unitLabel(unit)}</span>
                                                    <Chip size="sm" variant="flat">{arr.length}</Chip>
                                                    <Chip size="sm" color="success" variant="flat">{activas} act.</Chip>
                                                    <Chip size="sm" color="danger" variant="flat">{vencidas} ven.</Chip>
                                                    <Chip size="sm" color="success" variant="flat">{money(suma)}</Chip>
                                                </div>
                                            }
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                {arr.map((m) => <MembresiaCard key={m.id_membresia} m={m} />)}
                                            </div>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        )}
                    </Tab>

                    {/* ==================== NUEVA PESTAÑA: REPORTES ==================== */}
                    <Tab
                        key="reportes"
                        title={<div className="flex items-center gap-2"><Icon className="text-base" icon="solar:chart-square-bold-duotone" /><span>Reportes</span></div>}
                    >
                        <div className="flex flex-wrap items-end gap-3">
                            <Input
                                type="date"
                                label="Desde (Inicio)"
                                size="sm"
                                value={repDesde}
                                onValueChange={setRepDesde}
                                className="w-[180px]"
                            />
                            <Input
                                type="date"
                                label="Hasta (Expira)"
                                size="sm"
                                value={repHasta}
                                onValueChange={setRepHasta}
                                className="w-[180px]"
                            />

                            <div className="flex items-center gap-2 text-sm ml-auto">
                                <Chip variant="flat">Registros: {repData.length}</Chip>
                                <Chip color="success" variant="flat">
                                    Activas: {repData.filter(m => new Date(m.fecha_expiracion) > now).length}
                                </Chip>
                                <Chip color="danger" variant="flat">
                                    Vencidas: {repData.filter(m => new Date(m.fecha_expiracion) <= now).length}
                                </Chip>
                                <Chip color="success" variant="flat">
                                    Total: {money(repData.reduce((a, x) => a + (x.precio_total || 0), 0))}
                                </Chip>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            <Button size="sm" onPress={exportCSV} startContent={<Icon icon="solar:export-bold-duotone" />}>
                                Exportar CSV (detalle)
                            </Button>
                            <Button size="sm" variant="flat" onPress={exportCSVByMember} startContent={<Icon icon="solar:users-group-two-rounded-bold-duotone" />}>
                                CSV por miembro
                            </Button>
                            <Button size="sm" variant="flat" onPress={printReport} startContent={<Icon icon="solar:printer-bold-duotone" />}>
                                Imprimir
                            </Button>
                        </div>

                        {/* Vista previa rápida del reporte */}
                        <div className="mt-3 border rounded-medium overflow-auto">
                            <Table aria-label="Vista previa reporte" removeWrapper>
                                <TableHeader>
                                    <TableColumn>ID</TableColumn>
                                    <TableColumn>Miembro</TableColumn>
                                    <TableColumn>Unidad</TableColumn>
                                    <TableColumn>Cant.</TableColumn>
                                    <TableColumn>Inicio</TableColumn>
                                    <TableColumn>Expira</TableColumn>
                                    <TableColumn align="end">Precio</TableColumn>
                                    <TableColumn>Estado</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="Sin registros">
                                    {repData.map((m) => (
                                        <TableRow key={m.id_membresia}>
                                            <TableCell>#{m.id_membresia}</TableCell>
                                            <TableCell>{getMemberName(m, clienteCache)}</TableCell>
                                            <TableCell>{(m.unidad_duracion || "").toString().toUpperCase()}</TableCell>
                                            <TableCell>{m.cantidad_duracion ?? ""}</TableCell>
                                            <TableCell>{fmtDate(m.fecha_inicio)}</TableCell>
                                            <TableCell>{fmtDate(m.fecha_expiracion)}</TableCell>
                                            <TableCell>{money(m.precio_total)}</TableCell>
                                            <TableCell>{estadoNombre(m)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Tab>
                </Tabs>

                <Divider />
                <div className="flex items-center justify-between text-xs text-foreground-500">
                    <div className="opacity-80">
                        Mostrando{" "}
                        {tab === "lista"
                            ? Math.min(paginados.length, filtrados.length)
                            : filtrados.length}{" "}
                        de {filtrados.length} resultados
                    </div>
                </div>
            </CardBody>

            {/* ✅ Modal controlado: cerrar SOLO tras onSaved */}
            <EditarMembresiaModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                item={editing}
                estados={estados}
                onSaved={(upd) => {
                    setItems((prev) =>
                        prev.map((x) => (x.id_membresia === upd.id_membresia ? upd : x))
                    );
                    setEditOpen(false); // cerrar solo en éxito
                }}
            />
        </Card>
    );
}
