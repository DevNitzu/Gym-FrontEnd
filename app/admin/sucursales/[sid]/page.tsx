"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Tabs,
    Tab,
    Chip,
    Spinner,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    ModalFooter,
    Input,
    Select,
    SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";

/* ======================= Constantes ======================= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const LOCALE = "es-EC";
type EstadoSucursal = "Abierta" | "Cerrada" | "Mantenimiento";

/* ======================= Tipos API ======================= */
type ApiGimnasio = {
    id_gimnasio: number;
    id_empresa: number;
    nombre: string;
    direccion: string;
    telefono: string;
    correo: string;
    activo: number; // 1|0
    fecha_creacion: string;
};

type ApiHorarioGimnasio = {
    id_gimnasio: number;
    dia_semana: number; // API: 0=Dom ... 6=Sáb
    hora_apertura: string; // "HH:mm:ss" o ISO
    hora_cierre: string;   // "HH:mm:ss" o ISO
    id_horario_gimnasio: number;
    activo: boolean;
};

type ApiPrecioMembresia = {
    id_gimnasio: number;
    tipo: string;
    precio: number;
    fecha_creacion: string;
    id_precio_membresia: number;
    activo: boolean;
};

/* ======================= Vista Sucursal ======================= */
type SucursalView = {
    id: string;      // ej: G-009-S1
    gymId: string;   // ej: G-009
    nombre: string;
    ciudad: string;
    estado: EstadoSucursal;
    miembros: number;
    aforo: number;
    checkinsHoy: number;
    telefono?: string;
    correo?: string;
    fechaCreacion?: string;
};

function estadoColor(e: EstadoSucursal) {
    if (e === "Abierta") return "success" as const;
    if (e === "Cerrada") return "danger" as const;
    return "warning" as const;
}

function zpad(n: number, w = 2) {
    return n.toString().padStart(w, "0");
}
function zpad3(n: number) {
    return zpad(n, 3);
}

/** Extrae "G-009" y el id numérico (9) desde sid: "G-009-S1" */
function parseFromSid(sid: string) {
    const parts = sid.split("-");
    const gymPart = parts.slice(0, 2).join("-");
    const num = parseInt(parts[1], 10);
    return { gymIdStr: gymPart, gymIdNum: Number.isFinite(num) ? num : NaN };
}

/** Mapea un ApiGimnasio a SucursalView */
function mapGymToSucursalView(g: ApiGimnasio, sid: string): SucursalView {
    const gymId = `G-${zpad3(g.id_gimnasio)}`;
    const estado: EstadoSucursal = Number(g.activo) === 1 ? "Abierta" : "Cerrada";
    return {
        id: sid,
        gymId,
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

/* ======================= Helpers de horarios ======================= */
const SHORT_DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// API: 0=Dom ... 6=Sáb  -> UI: 1..7 (Lun..Dom)
function normalizeDayToUI(dia_semana: number): number {
    return dia_semana === 0 ? 7 : dia_semana;
}
// UI 1..7 -> API 0..6
function uiDayToApi(uiDay: number): number {
    return uiDay === 7 ? 0 : uiDay;
}

/** Convierte "HH:mm:ss" (o ISO) a minutos desde 0:00 */
function timeToMinutes(t: string): number {
    const isoMatch = t.match(/T(\d{2}):(\d{2}):?(\d{2})?/);
    const hms = isoMatch ? [isoMatch[1], isoMatch[2], isoMatch[3] || "00"] : t.split(":");
    const [hh, mm] = [parseInt(hms[0], 10), parseInt(hms[1], 10)];
    if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
    return hh * 60 + mm;
}
function toHHMM(m: number) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${zpad(h)}:${zpad(mm)}`;
}
function toHHMMSS(time: string | number) {
    if (typeof time === "number") {
        const h = Math.floor(time / 60);
        const m = time % 60;
        return `${zpad(h)}:${zpad(m)}:00`;
    }
    const parts = time.split(":");
    const h = zpad(parseInt(parts[0] || "0", 10));
    const m = zpad(parseInt(parts[1] || "0", 10));
    const s = zpad(parseInt(parts[2] || "0", 10));
    return `${h}:${m}:${s}`;
}

/** Agrupa por día UI (1..7) */
function groupByDay(data: ApiHorarioGimnasio[]) {
    type Range = { open: number; close: number; raw: ApiHorarioGimnasio };
    const map = new Map<number, Range[]>();
    data
        .filter((h) => h.activo)
        .forEach((h) => {
            const d = normalizeDayToUI(h.dia_semana);
            const bucket = map.get(d) ?? [];
            bucket.push({
                open: timeToMinutes(h.hora_apertura),
                close: timeToMinutes(h.hora_cierre),
                raw: h,
            });
            map.set(d, bucket);
        });
    map.forEach((arr, k) => {
        arr.sort((a: Range, b: Range) => a.open - b.open);
        map.set(k, arr);
    });
    return map;
}

/* ======================= API Horarios ======================= */
async function apiCreateHorario(h: {
    id_gimnasio: number;
    dia_semana: number; // 0..6
    hora_apertura: string; // "HH:mm:ss"
    hora_cierre: string;   // "HH:mm:ss"
}) {
    const res = await fetch(`${API_BASE}/api/v1/horario_gimnasios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(h),
    });
    if (!res.ok) throw new Error(`Error ${res.status} al crear horario`);
    return (await res.json()) as ApiHorarioGimnasio;
}
async function apiUpdateHorario(id: number, h: {
    id_gimnasio: number;
    dia_semana: number;
    hora_apertura: string;
    hora_cierre: string;
}) {
    const res = await fetch(`${API_BASE}/api/v1/horario_gimnasios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(h),
    });
    if (!res.ok) throw new Error(`Error ${res.status} al actualizar horario`);
    return (await res.json()) as ApiHorarioGimnasio;
}
async function apiDeleteHorario(id: number) {
    const res = await fetch(`${API_BASE}/api/v1/horario_gimnasios/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Error ${res.status} al eliminar horario`);
}

/* ======================= Modal Horarios ======================= */
type HorarioFormState = {
    id_horario_gimnasio?: number;
    id_gimnasio: number;
    dia_semana: number;     // 0..6 (bloqueado)
    hora_apertura: string;  // "HH:MM"
    hora_cierre: string;    // "HH:MM"
};

function HorarioFormModal({
    open,
    onClose,
    initial,
    onSaved,
    onDeleted,
    isCreate,
    dayLockedLabel,
}: {
    open: boolean;
    onClose: () => void;
    initial: HorarioFormState;
    onSaved: (saved: ApiHorarioGimnasio) => void;
    onDeleted?: () => void;
    isCreate: boolean;
    dayLockedLabel: string;
}) {
    const [form, setForm] = React.useState<HorarioFormState>(initial);
    const [saving, setSaving] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    React.useEffect(() => {
        setForm(initial);
        setErr(null);
    }, [initial, open]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setErr(null);
            if (form.hora_apertura >= form.hora_cierre) {
                setErr("La hora de apertura debe ser menor que la de cierre.");
                setSaving(false);
                return;
            }
            const payload = {
                id_gimnasio: form.id_gimnasio,
                dia_semana: form.dia_semana,
                hora_apertura: toHHMMSS(form.hora_apertura),
                hora_cierre: toHHMMSS(form.hora_cierre),
            };
            const saved = form.id_horario_gimnasio
                ? await apiUpdateHorario(form.id_horario_gimnasio, payload)
                : await apiCreateHorario(payload);
            onSaved(saved);
            onClose();
        } catch (e: any) {
            setErr(e?.message || "No se pudo guardar el horario.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!form.id_horario_gimnasio) return;
        try {
            setSaving(true);
            setErr(null);
            await apiDeleteHorario(form.id_horario_gimnasio);
            onDeleted?.();
            onClose();
        } catch (e: any) {
            setErr(e?.message || "No se pudo eliminar el horario.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={open}
            onOpenChange={(o) => (o ? null : onClose())}
            backdrop="blur"
            placement="center"
            isDismissable={false} // <- evita que se cierre por click fuera / Esc
        >
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="solar:calendar-bold-duotone" />
                            {isCreate ? "Definir horario" : "Editar horario"}
                        </ModalHeader>
                        <ModalBody>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Día bloqueado (solo display) */}
                                <Select label="Día de la semana" selectedKeys={new Set(["locked"])} isDisabled>
                                    <SelectItem key="locked">{dayLockedLabel}</SelectItem>
                                </Select>

                                <Input
                                    label="Hora de apertura"
                                    type="time"
                                    value={form.hora_apertura}
                                    onChange={(e) => setForm((f) => ({ ...f, hora_apertura: e.target.value }))}
                                />
                                <Input
                                    label="Hora de cierre"
                                    type="time"
                                    value={form.hora_cierre}
                                    onChange={(e) => setForm((f) => ({ ...f, hora_cierre: e.target.value }))}
                                />

                                <Input label="ID Gimnasio" value={String(form.id_gimnasio)} isReadOnly />
                            </div>

                            {err && (
                                <div className="text-danger-500 text-sm mt-2 flex items-center gap-2">
                                    <Icon icon="solar:danger-triangle-bold-duotone" />
                                    {err}
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter className="justify-between">
                            {form.id_horario_gimnasio ? (
                                <Button
                                    color="danger"
                                    variant="flat"
                                    startContent={<Icon icon="solar:trash-bin-minimalistic-bold-duotone" />}
                                    onPress={handleDelete}
                                    isDisabled={saving}
                                >
                                    Eliminar
                                </Button>
                            ) : (
                                <div />
                            )}
                            <div className="flex gap-2">
                                <Button variant="flat" onPress={() => onClose()} isDisabled={saving}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleSave}
                                    isDisabled={saving}
                                    startContent={<Icon icon="solar:check-read-line-duotone" />}
                                >
                                    {form.id_horario_gimnasio ? "Guardar cambios" : "Crear horario"}
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

/* ======================= Lista por día (máx 1 franja) ======================= */
function ListView({
    data,
    onEditHorario,
    onCreateForDay,
}: {
    data: ApiHorarioGimnasio[];
    onEditHorario: (h: ApiHorarioGimnasio) => void;
    onCreateForDay: (uiDay: number) => void; // 1..7
}) {
    const grouped = groupByDay(data);
    return (
        <div className="space-y-2">
            {SHORT_DAY_LABELS.map((name, idx) => {
                const uiDay = idx + 1; // 1..7
                const ranges = grouped.get(uiDay) || [];
                const hasOne = ranges.length >= 1;
                const main = ranges[0];

                return (
                    <Card key={uiDay} className="border-sm">
                        <CardBody className="py-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="font-semibold min-w-[72px]">{name}</div>

                                    {!hasOne ? (
                                        <Chip size="sm" color="danger" variant="flat">
                                            Sin horario
                                        </Chip>
                                    ) : (
                                        <div className="flex gap-2 flex-wrap">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                startContent={<Icon icon="solar:clock-circle-line-duotone" />}
                                                onPress={() => onEditHorario(main.raw)}
                                            >
                                                {toHHMM(main.open)}–{toHHMM(main.close)}
                                            </Button>

                                            {/* Extras (visibles para permitir borrarlos) */}
                                            {ranges.slice(1).map((r, i) => (
                                                <Button
                                                    key={i}
                                                    size="sm"
                                                    variant="light"
                                                    startContent={<Icon icon="solar:warning-triangle-line-duotone" />}
                                                    onPress={() => onEditHorario(r.raw)}
                                                >
                                                    {toHHMM(r.open)}–{toHHMM(r.close)} (extra)
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {!hasOne ? (
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="flat"
                                        startContent={<Icon icon="solar:add-circle-bold-duotone" />}
                                        onPress={() => onCreateForDay(uiDay)}
                                    >
                                        Definir horario
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        startContent={<Icon icon="solar:pen-bold-duotone" />}
                                        onPress={() => onEditHorario(main.raw)}
                                    >
                                        Editar
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                );
            })}
        </div>
    );
}

/* ======================= Componente: Horarios (lista + modal) ======================= */
function HorariosLista({ id_gimnasio }: { id_gimnasio: number }) {
    const [data, setData] = React.useState<ApiHorarioGimnasio[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [modalOpen, setModalOpen] = React.useState(false);
    const [isCreate, setIsCreate] = React.useState(true);
    const [dayLockedLabel, setDayLockedLabel] = React.useState<string>("Lunes");

    const [formInit, setFormInit] = React.useState<HorarioFormState>({
        id_gimnasio,
        dia_semana: 1,
        hora_apertura: "08:00",
        hora_cierre: "20:00",
    });
    const [reloadTick, setReloadTick] = React.useState(0);
    const reload = () => setReloadTick((x) => x + 1);

    const openCreateForDay = (uiDay: number) => {
        const apiDay = uiDayToApi(uiDay);
        const labelsFull = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        setIsCreate(true);
        setDayLockedLabel(labelsFull[uiDay - 1]);
        setFormInit({
            id_gimnasio,
            dia_semana: apiDay,
            hora_apertura: "08:00",
            hora_cierre: "20:00",
        });
        setModalOpen(true);
    };

    const openEdit = (h: ApiHorarioGimnasio) => {
        const uiDay = normalizeDayToUI(h.dia_semana);
        const labelsFull = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        setIsCreate(false);
        setDayLockedLabel(labelsFull[uiDay - 1]);
        setFormInit({
            id_horario_gimnasio: h.id_horario_gimnasio,
            id_gimnasio: h.id_gimnasio,
            dia_semana: h.dia_semana,
            hora_apertura: toHHMM(timeToMinutes(h.hora_apertura)),
            hora_cierre: toHHMM(timeToMinutes(h.hora_cierre)),
        });
        setModalOpen(true);
    };

    React.useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const url = `${API_BASE}/api/v1/horario_gimnasios/gimnasio/${encodeURIComponent(id_gimnasio)}`;
                const res = await fetch(url, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                    cache: "no-store",
                    signal: controller.signal,
                    mode: "cors",
                });
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const json: ApiHorarioGimnasio[] = await res.json();
                if (!mounted) return;
                setData(json || []);
            } catch (e: any) {
                if (e?.name === "AbortError") return;
                if (!mounted) return;
                setError(e?.message || "No se pudieron cargar los horarios.");
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [id_gimnasio, reloadTick]);

    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:calendar-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Horarios</span>
                    {data && (
                        <Chip size="sm" variant="flat" color="success">
                            {data.filter((d) => d.activo).length} tramos activos
                        </Chip>
                    )}
                </div>
                <div className="text-xs text-foreground-500">
                    Máximo 1 horario por día (Lunes a Domingo).
                </div>
            </CardHeader>

            <CardBody>
                {loading && (
                    <div className="flex items-center gap-2 text-foreground-500">
                        <Spinner size="sm" /> Cargando horarios…
                    </div>
                )}

                {error && !loading && (
                    <div className="text-danger-500 flex items-center gap-2 mb-3">
                        <Icon icon="solar:danger-triangle-bold-duotone" />
                        {error}
                    </div>
                )}

                {!loading && (
                    <ListView
                        data={Array.isArray(data) ? data : []}
                        onEditHorario={openEdit}
                        onCreateForDay={openCreateForDay}
                    />
                )}
            </CardBody>

            <HorarioFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                initial={formInit}
                onSaved={() => reload()}
                onDeleted={() => reload()}
                isCreate={isCreate}
                dayLockedLabel={dayLockedLabel}
            />
        </Card>
    );
}

//* ======================= Membresías (CRUD) ======================= */

/** Opciones visibles en el Select (puedes ajustar o traducir). */
const TIPO_OPCIONES = [
    "Oro",
];

type MembresiaForm = {
    id_precio_membresia?: number;
    id_gimnasio: number;
    tipo: string;        // valor de Select
    customTipo?: string; // texto libre si "Otro"
    precio: string;      // como string para el Input
};

type TierKey = "oro" | "plata" | "bronce" | "neutral";

/** Normaliza un tipo a un “tier” de diseño (oro/plata/bronce/neutral) */
function tierFromTipo(tipo: string): TierKey {
    const t = (tipo || "").toLowerCase().trim();
    if (t.includes("oro") || t.includes("gold")) return "oro";
    if (t.includes("plata") || t.includes("silver")) return "plata";
    if (t.includes("bronce") || t.includes("bronze")) return "bronce";
    return "neutral";
}

/** Estilos de tarjeta por tier — usa gradientes y anillos con colores reales de metales */
function getTierStyles(tier: TierKey) {
    switch (tier) {
        case "oro":
            return {
                ring: "ring-2 ring-[#D4AF37]/60",
                textTitle: "text-[#6b5b17]",
                chip: "bg-[#D4AF37]/15 text-[#6b5b17] border border-[#D4AF37]/40",
                icon: "text-[#B18F2D]",
                // Gradiente dorado con brillo suave
                bgStyle: {
                    backgroundImage:
                        "linear-gradient(135deg, #FFF7D6 0%, #F5E6A6 35%, #EED27A 60%, #F5E6A6 85%)",
                } as React.CSSProperties,
            };
        case "plata":
            return {
                ring: "ring-2 ring-[#C0C0C0]/60",
                textTitle: "text-[#4d4d4d]",
                chip: "bg-[#C0C0C0]/15 text-[#4d4d4d] border border-[#C0C0C0]/40",
                icon: "text-[#8E8E8E]",
                bgStyle: {
                    backgroundImage:
                        "linear-gradient(135deg, #F7F7F8 0%, #E6E7EA 35%, #D6D7DB 60%, #ECEDEF 85%)",
                } as React.CSSProperties,
            };
        case "bronce":
            return {
                ring: "ring-2 ring-[#CD7F32]/60",
                textTitle: "text-[#6a3f1f]",
                chip: "bg-[#CD7F32]/15 text-[#6a3f1f] border border-[#CD7F32]/40",
                icon: "text-[#9E5F26]",
                bgStyle: {
                    backgroundImage:
                        "linear-gradient(135deg, #FFE7D6 0%, #F3C09A 35%, #E3A16F 60%, #F3C09A 85%)",
                } as React.CSSProperties,
            };
        default:
            return {
                ring: "ring-1 ring-default-200",
                textTitle: "text-foreground",
                chip: "bg-default-100 text-foreground-600 border border-default-200",
                icon: "text-foreground-500",
                bgStyle: { background: "linear-gradient(135deg,#fafafa,#f2f2f2)" } as React.CSSProperties,
            };
    }
}

/** Tarjeta visual de una membresía con look metalizado y acciones */
function MembershipCard({
    item,
    onEdit,
    onDelete,
}: {
    item: ApiPrecioMembresia;
    onEdit: (m: ApiPrecioMembresia) => void;
    onDelete: (m: ApiPrecioMembresia) => void;
}) {
    const tier = tierFromTipo(item.tipo);
    const sty = getTierStyles(tier);

    return (
        <div
            className={`
        relative overflow-hidden rounded-2xl p-4 transition-transform
        hover:-translate-y-0.5 hover:shadow-lg
        ${sty.ring}
      `}
            style={sty.bgStyle}
        >
            {/* Brillo suave */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-25 bg-white" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 font-semibold ${sty.textTitle}`}>
                    <Icon icon="solar:crown-bold-duotone" className={`text-xl ${sty.icon}`} />
                    <span className="tracking-wide uppercase">{item.tipo}</span>
                </div>

                <div
                    className={`px-2 py-0.5 text-[11px] rounded-full ${sty.chip}`}
                    title={item.activo ? "Activo" : "Inactivo"}
                >
                    ID #{item.id_precio_membresia}
                </div>
            </div>

            {/* Precio */}
            <div className="mt-3 flex items-end gap-2">
                <div className="text-3xl font-bold leading-none">
                    {new Intl.NumberFormat(LOCALE, {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                    }).format(item.precio ?? 0)}
                </div>
                <div className="mb-1 text-xs text-foreground-500">precio base</div>
            </div>

            {/* Meta */}
            <div className="mt-2 text-[12px] text-foreground-600">
                Creado: {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleString(LOCALE) : "—"}
            </div>

            {/* Acciones */}
            <div className="mt-4 flex gap-2">
                <Button
                    size="sm"
                    variant="flat"
                    startContent={<Icon icon="solar:pen-bold-duotone" />}
                    onPress={() => onEdit(item)}
                >
                    Editar
                </Button>
                <Button
                    size="sm"
                    variant="bordered"
                    color="danger"
                    startContent={<Icon icon="solar:trash-bin-minimalistic-bold-duotone" />}
                    onPress={() => onDelete(item)}
                >
                    Eliminar
                </Button>
            </div>
        </div>
    );
}

async function apiListMembresias(id_gimnasio: number): Promise<ApiPrecioMembresia[]> {
    const res = await fetch(
        `${API_BASE}/api/v1/precio_membresias/gimnasio/${encodeURIComponent(id_gimnasio)}`,
        { headers: { Accept: "application/json" }, cache: "no-store", mode: "cors" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status} al listar membresías`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
}

async function apiCreateMembresia(body: { id_gimnasio: number; tipo: string; precio: number }) {
    const res = await fetch(`${API_BASE}/api/v1/precio_membresias`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        mode: "cors",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al crear membresía`);
    return (await res.json()) as ApiPrecioMembresia;
}

async function apiUpdateMembresia(
    id: number,
    body: { id_gimnasio: number; tipo: string; precio: number }
) {
    const res = await fetch(`${API_BASE}/api/v1/precio_membresias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        mode: "cors",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al actualizar membresía`);
    return (await res.json()) as ApiPrecioMembresia;
}

async function apiDeleteMembresia(id: number) {
    const res = await fetch(`${API_BASE}/api/v1/precio_membresias/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        cache: "no-store",
        mode: "cors",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al eliminar membresía`);
}

/** CRUD con tarjetas de tiers metalizados */
function MembresiasCrud({ id_gimnasio }: { id_gimnasio: number }) {
    const [items, setItems] = React.useState<ApiPrecioMembresia[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    const [modalOpen, setModalOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [isCreate, setIsCreate] = React.useState(true);

    const [form, setForm] = React.useState<MembresiaForm>({
        id_gimnasio,
        tipo: "",
        customTipo: "",
        precio: "",
    });

    const reload = React.useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const list = await apiListMembresias(id_gimnasio);
            // Ordena para mostrar Oro/Plata/Bronce primero (si existen)
            const priority = { oro: 0, plata: 1, bronce: 2, neutral: 3 } as Record<TierKey, number>;
            list.sort(
                (a, b) => priority[tierFromTipo(a.tipo)] - priority[tierFromTipo(b.tipo)]
            );
            setItems(list);
        } catch (e: any) {
            setErr(e?.message || "No se pudo listar las membresías.");
        } finally {
            setLoading(false);
        }
    }, [id_gimnasio]);

    React.useEffect(() => {
        reload();
    }, [reload]);

    const openCreate = () => {
        setIsCreate(true);
        setForm({ id_gimnasio, tipo: "", customTipo: "", precio: "" });
        setModalOpen(true);
    };

    const openEdit = (m: ApiPrecioMembresia) => {
        const isOther = !TIPO_OPCIONES.includes(m.tipo);
        setIsCreate(false);
        setForm({
            id_precio_membresia: m.id_precio_membresia,
            id_gimnasio: m.id_gimnasio,
            tipo: isOther ? "Otro" : m.tipo,
            customTipo: isOther ? m.tipo : "",
            precio: String(m.precio ?? ""),
        });
        setModalOpen(true);
    };

    const remove = async (m: ApiPrecioMembresia) => {
        if (!confirm(`¿Eliminar el plan "${m.tipo}"?`)) return;
        try {
            await apiDeleteMembresia(m.id_precio_membresia);
            await reload();
        } catch (e: any) {
            alert(e?.message || "No se pudo eliminar.");
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const finalTipo = form.tipo === "Otro" ? (form.customTipo || "").trim() : (form.tipo || "").trim();
            if (!finalTipo) throw new Error("Selecciona un tipo o especifica uno en 'Otro'.");
            const precioNum = Number(form.precio);
            if (!Number.isFinite(precioNum) || precioNum <= 0) throw new Error("Ingresa un precio válido (> 0).");

            if (form.id_precio_membresia) {
                await apiUpdateMembresia(form.id_precio_membresia, {
                    id_gimnasio,
                    tipo: finalTipo,
                    precio: precioNum,
                });
            } else {
                await apiCreateMembresia({
                    id_gimnasio,
                    tipo: finalTipo,
                    precio: precioNum,
                });
            }
            await reload();
            setModalOpen(false);
        } catch (e: any) {
            alert(e?.message || "No se pudo guardar.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:wallet-money-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Membresías (Precios)</span>
                    {items && (
                        <Chip size="sm" variant="flat" color="success">
                            {items.length} planes
                        </Chip>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        color="primary"
                        startContent={<Icon icon="solar:add-circle-bold-duotone" />}
                        onPress={openCreate}
                    >
                        Nuevo plan
                    </Button>
                </div>
            </CardHeader>

            <CardBody className="space-y-3">
                {loading && (
                    <div className="flex items-center gap-2 text-foreground-500">
                        <Spinner size="sm" /> Cargando membresías…
                    </div>
                )}
                {err && !loading && (
                    <div className="text-danger-500 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold-duotone" />
                        {err}
                    </div>
                )}

                {!loading && (!items || items.length === 0) && (
                    <div className="text-sm text-foreground-500">Aún no tienes planes creados.</div>
                )}

                {!loading && items && items.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((m) => (
                            <MembershipCard
                                key={m.id_precio_membresia}
                                item={m}
                                onEdit={openEdit}
                                onDelete={remove}
                            />
                        ))}
                    </div>
                )}
            </CardBody>

            {/* Modal Crear/Editar */}
            <Modal
                isOpen={modalOpen}
                onOpenChange={(open) => setModalOpen(open)}
                isDismissable={false}
                backdrop="blur"
                placement="center"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <Icon icon="solar:wallet-money-bold-duotone" />
                                {isCreate ? "Nueva membresía" : "Editar membresía"}
                            </ModalHeader>
                            <ModalBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Tipo"
                                    placeholder="Selecciona un tipo"
                                    selectedKeys={form.tipo ? new Set([form.tipo]) : new Set([])}
                                    onSelectionChange={(keys) => {
                                        const v = Array.from(keys)[0] as string;
                                        setForm((f) => ({
                                            ...f,
                                            tipo: v,
                                            customTipo: v === "Otro" ? f.customTipo : "",
                                        }));
                                    }}
                                >
                                    {TIPO_OPCIONES.map((t) => (
                                        <SelectItem key={t}>{t}</SelectItem>
                                    ))}
                                </Select>

                                {form.tipo === "Otro" && (
                                    <Input
                                        label="Especifica el tipo"
                                        placeholder="Ej. Pase médico, Familiar, etc."
                                        value={form.customTipo || ""}
                                        onValueChange={(v) => setForm((f) => ({ ...f, customTipo: v }))}
                                    />
                                )}

                                <Input
                                    label="Precio (USD)"
                                    type="number"
                                    inputMode="decimal"
                                    value={form.precio}
                                    onValueChange={(v) => setForm((f) => ({ ...f, precio: v }))}
                                    description="Usa punto como separador decimal"
                                />

                                <Input label="ID Gimnasio" value={String(id_gimnasio)} isReadOnly />
                            </ModalBody>
                            <ModalFooter className="flex justify-between">
                                <Button variant="flat" onPress={onClose} isDisabled={saving}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleSave}
                                    isLoading={saving}
                                    startContent={<Icon icon="solar:check-read-line-duotone" />}
                                >
                                    {isCreate ? "Guardar" : "Actualizar"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </Card>
    );
}


/* ======================= Página principal ======================= */
export default function GestionSucursalPage() {
    const router = useRouter();
    const params = useParams<{ sid: string }>();
    const sid = (params?.sid || "").toString().toUpperCase(); // p.ej. G-009-S1
    const { gymIdStr, gymIdNum } = parseFromSid(sid);

    const [empresaId, setEmpresaId] = React.useState<string | null>(null);
    const [sucursal, setSucursal] = React.useState<SucursalView | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        try {
            const v = localStorage.getItem("auth:empresa");
            setEmpresaId(v);
        } catch {
            setEmpresaId(null);
        }
    }, []);

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
                if (alive) setError(e?.message || "No se pudo cargar la sucursal.");
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => {
            alive = false;
        };
    }, [empresaId, gymIdNum, gymIdStr, sid]);

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
                                onClick={() => router.push("/admin/gimnasios")}
                            >
                                Volver al listado
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

    const fechaCreacionPretty =
        sucursal.fechaCreacion
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
                            <div><strong>ID de la sucursal:</strong> {sucursal.id}</div>
                            <div><strong>Código del gimnasio:</strong> {sucursal.gymId}</div>
                            <div><strong>Ciudad:</strong> {sucursal.ciudad}</div>
                            <div><strong>Teléfono:</strong> {sucursal.telefono || "—"}</div>
                            <div><strong>Correo:</strong> {sucursal.correo || "—"}</div>
                            <div><strong>Creado:</strong> {fechaCreacionPretty}</div>
                        </CardBody>
                    </Card>
                </Tab>

                <Tab
                    key="horarios"
                    title={
                        <span className="flex items-center gap-2">
                            <Icon icon="solar:calendar-bold-duotone" />
                            Horarios
                        </span>
                    }
                >
                    <HorariosLista id_gimnasio={gymIdNum} />
                </Tab>

                <Tab
                    key="membresias"
                    title={
                        <span className="flex items-center gap-2">
                            <Icon icon="solar:wallet-money-bold-duotone" />
                            Membresías
                        </span>
                    }
                >
                    <MembresiasCrud id_gimnasio={gymIdNum} />
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
                    <Card className="border"><CardBody>CRUD de entrenadores y permisos.</CardBody></Card>
                </Tab>

                <Tab
                    key="pagos"
                    title={
                        <span className="flex items-center gap-2">
                            <Icon icon="solar:card-bold-duotone" />
                            Pagos
                        </span>
                    }
                >
                    <Card className="border"><CardBody>Planes, cobros y vencimientos.</CardBody></Card>
                </Tab>
            </Tabs>
        </div>
    );
}
