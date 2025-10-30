"use client";

import React from "react";
import {
    Card, CardHeader, CardBody, CardFooter,
    Button, Chip, Input, Spinner, Tooltip, Image, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";

type EstadoSucursal = "Abierta" | "Cerrada" | "Mantenimiento";

/** Estructura exacta que devuelve tu API de gimnasios */
type ApiGimnasio = {
    id_gimnasio: number;
    id_empresa: number;
    nombre: string;
    direccion: string;
    telefono: string;
    correo: string;
    activo: number | boolean;      // 1|0 o true|false
    fecha_creacion: string;        // "YYYY-MM-DD HH:mm:ss" o ISO
};

/** Estructura exacta que devuelve tu API de empresa */
type ApiEmpresa = {
    id_empresa: number;
    nombre: string;
    ruc?: string | null;
    direccion?: string | null;
    telefono?: string | null;
    correo?: string | null;
    fecha_creacion?: string | null;
    activo?: boolean | number;
    logo_url?: string | null;
};

type Row = {
    gymId: string;
    gymNombre: string;
    ciudad: string;
    sucursalId: string;
    miembros: number;
    aforo: number;
    checkinsHoy: number;
    estado: EstadoSucursal;
    telefono: string;
    correo: string;
    fechaCreacion?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const estadoColor = (e: EstadoSucursal) =>
    e === "Abierta" ? "success" : e === "Cerrada" ? "danger" : "warning";

const zpad3 = (n: number) => n.toString().padStart(3, "0");

function toBool(v: number | boolean) {
    return typeof v === "boolean" ? v : Number(v) === 1;
}

/** Resuelve logo_url relativo → absoluto */
function getLogoUrl(logo_url?: string | null): string | null {
    if (!logo_url) return null;
    if (/^(https?:)?\/\//i.test(logo_url) || /^data:image\//i.test(logo_url)) return logo_url;
    if (logo_url.startsWith("/")) return `${API_BASE}${logo_url}`;
    return `${API_BASE}/${logo_url}`;
}

/** Mapea tu fila de BD a lo que la UI usa */
function mapApiToRow(item: ApiGimnasio): Row {
    const gymId = `G-${zpad3(Number(item.id_gimnasio))}`;
    const sucursalId = `${gymId}-S1`;
    const estado: EstadoSucursal = toBool(item.activo) ? "Abierta" : "Cerrada";

    return {
        gymId,
        gymNombre: item.nombre ?? "Gimnasio",
        ciudad: item.direccion ?? "—",
        sucursalId,
        miembros: 0,
        aforo: 0,
        checkinsHoy: 0,
        estado,
        telefono: item.telefono ?? "",
        correo: item.correo ?? "",
        fechaCreacion: item.fecha_creacion,
    };
}

/** ---- Modal de creación ---- */
function NewGymModal({
    open,
    onClose,
    empresaId,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    empresaId: string;
    onCreated: (nuevo: Row) => void;
}) {
    const [nombre, setNombre] = React.useState("");
    const [direccion, setDireccion] = React.useState("");
    const [telefono, setTelefono] = React.useState("");
    const [correo, setCorreo] = React.useState("");
    const [activo, setActivo] = React.useState(true);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setNombre("");
            setDireccion("");
            setTelefono("");
            setCorreo("");
            setActivo(true);
            setLoading(false);
            setError(null);
        }
    }, [open]);

    function isEmail(v: string) {
        return !v || /\S+@\S+\.\S+/.test(v);
    }

    const canSave = nombre.trim().length > 0 && isEmail(correo) && !loading;

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            const body = {
                id_empresa: Number(empresaId),
                nombre: nombre.trim(),
                direccion: direccion.trim(),
                telefono: telefono.trim(),
                correo: correo.trim(),
                activo, // el schema muestra boolean; si tu API acepta 1/0, cámbialo a Number(activo)
                // fecha_creacion: se puede omitir para que el backend setee
            };

            const url = `${API_BASE}/api/v1/gimnasios`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                mode: "cors",
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} al crear: ${t || "sin detalle"}`);
            }

            const created: ApiGimnasio =
                (await res.json()) as ApiGimnasio;

            // Normaliza por si el backend devuelve boolean/number y fecha en ISO
            const creadoMapeado = mapApiToRow({
                ...created,
                activo: typeof created.activo === "boolean" ? created.activo : Number(created.activo),
                fecha_creacion:
                    created.fecha_creacion ??
                    new Date().toISOString(),
            });

            onCreated(creadoMapeado);
            onClose();
        } catch (e: any) {
            setError(e?.message ?? "No se pudo crear el gimnasio");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={open} onClose={onClose} size="lg" backdrop="opaque">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <Icon icon="solar:add-circle-bold-duotone" />
                    Agregar gimnasio
                </ModalHeader>
                <ModalBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                            isRequired
                            label="Nombre"
                            placeholder="Ej. Gimnasio Central"
                            value={nombre}
                            onValueChange={setNombre}
                        />
                        <Input
                            label="Teléfono"
                            placeholder="099 999 9999"
                            value={telefono}
                            onValueChange={setTelefono}
                        />
                        <Input
                            label="Correo"
                            type="email"
                            isInvalid={!!correo && !/\S+@\S+\.\S+/.test(correo)}
                            errorMessage={!!correo && !/\S+@\S+\.\S+/.test(correo) ? "Correo inválido" : undefined}
                            placeholder="user@example.com"
                            value={correo}
                            onValueChange={setCorreo}
                        />
                        <Input
                            label="Dirección"
                            placeholder="Ciudad, calle y número"
                            value={direccion}
                            onValueChange={setDireccion}
                        />
                    </div>
                    <div className="pt-1">
                        <Checkbox isSelected={activo} onValueChange={setActivo}>
                            Activo (aparece como <span className="font-semibold">Abierta</span> en la lista)
                        </Checkbox>
                    </div>

                    {error && (
                        <Card className="border bg-danger-50">
                            <CardBody className="text-danger-700 text-sm">
                                {error}
                            </CardBody>
                        </Card>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onClick={onClose} isDisabled={loading}>
                        Cancelar
                    </Button>
                    <Button color="primary" onClick={handleSubmit} isLoading={loading} isDisabled={!canSave}>
                        Guardar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

/** ---- Página ---- */
export default function GimnasiosPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const empresaId = sp.get("empresa") ?? "1";

    const [q, setQ] = React.useState("");
    const [rows, setRows] = React.useState<Row[] | null>(null);
    const [empresa, setEmpresa] = React.useState<ApiEmpresa | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [isNewOpen, setIsNewOpen] = React.useState(false);

    React.useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setError(null);
                setRows(null);
                setEmpresa(null);

                const gymsUrl = `${API_BASE}/api/v1/gimnasios/${encodeURIComponent(empresaId)}`;
                const empUrl = `${API_BASE}/api/v1/empresas/${encodeURIComponent(empresaId)}`;

                const [gymsRes, empRes] = await Promise.all([
                    fetch(gymsUrl, { headers: { Accept: "application/json" }, cache: "no-store", mode: "cors" }),
                    fetch(empUrl, { headers: { Accept: "application/json" }, cache: "no-store", mode: "cors" }),
                ]);

                if (!gymsRes.ok) throw new Error(`HTTP ${gymsRes.status} al cargar ${gymsUrl}`);
                if (!empRes.ok) throw new Error(`HTTP ${empRes.status} al cargar ${empUrl}`);

                const gymsData = await gymsRes.json();
                const empData: ApiEmpresa = await empRes.json();

                const list: ApiGimnasio[] = Array.isArray(gymsData)
                    ? gymsData
                    : Array.isArray((gymsData as any)?.items)
                        ? (gymsData as any).items
                        : [];

                const mapped = list.map(mapApiToRow);

                if (alive) {
                    setRows(mapped);
                    setEmpresa(empData);
                }
            } catch (e: any) {
                if (alive) setError(e?.message ?? "Error al cargar");
            }
        })();

        return () => { alive = false; };
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
                r.telefono,
                r.correo,
                r.fechaCreacion ?? "",
            ]
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [rows, q]);

    const handleCardKeyDown = (e: React.KeyboardEvent, href: string) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(href);
        }
    };

    const logo = getLogoUrl(empresa?.logo_url);
    const empresaIniciales =
        (empresa?.nombre || "")
            .split(/\s+/)
            .map(w => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "EM";

    // --- Reloj Guayaquil ---
    function useGuayaquilNow() {
        const [now, setNow] = React.useState<Date | null>(null);

        React.useEffect(() => {
            // Evita desajustes de hidratación: inicia después del mount
            setNow(new Date());
            const id = setInterval(() => setNow(new Date()), 1000);
            return () => clearInterval(id);
        }, []);

        if (!now) return { time: "—", date: "" };

        const time = new Intl.DateTimeFormat("es-EC", {
            timeZone: "America/Guayaquil",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }).format(now);

        const date = new Intl.DateTimeFormat("es-EC", {
            timeZone: "America/Guayaquil",
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(now);

        return { time, date };
    }

    function GuayaquilClock() {
        const { time, date } = useGuayaquilNow();
        return (
            <div className="text-right leading-tight">
                <div className="text-xs text-foreground-500 flex items-center gap-1 justify-end">
                    <Icon icon="solar:clock-circle-bold-duotone" />
                    <span>Hora actual · EC</span>
                </div>
                <div className="font-semibold tabular-nums">{time}</div>
                <div className="text-xs text-foreground-500">{date}</div>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* Header con logo y datos de empresa */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-default-100 flex items-center justify-center overflow-hidden">
                        {logo ? (
                            <Image
                                src={logo}
                                alt={empresa?.nombre || "Logo empresa"}
                                className="h-12 w-12 object-contain"
                                removeWrapper
                            />
                        ) : (
                            <span className="text-2xl font-bold text-foreground-500"> {empresaIniciales}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold truncate">
                            {empresa?.nombre || "Empresa"}
                        </h1>
                        {(empresa?.correo && empresa?.telefono) && (
                            <p className="text-sm text-foreground-500 truncate">
                                {empresa?.correo && <span className="mr-3">{empresa.correo}</span>}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <GuayaquilClock />
                    <Button
                        color="primary"
                        startContent={<Icon icon="solar:add-circle-bold-duotone" />}
                        onClick={() => setIsNewOpen(true)}
                    >
                        Nuevo Gimnasio
                    </Button>
                </div>

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
                            onClick={() => location.reload()}
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

                                                </div>
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
                                            e.stopPropagation();
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

            {/* Modal crear */}
            <NewGymModal
                open={isNewOpen}
                onClose={() => setIsNewOpen(false)}
                empresaId={empresaId}
                onCreated={(nuevo) => {
                    setRows((prev) => (prev ? [nuevo, ...prev] : [nuevo]));
                }}
            />
        </div>
    );
}
