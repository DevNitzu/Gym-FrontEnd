"use client";

import React from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Chip,
    Input,
    Spinner,
    Image,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Checkbox,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch, buildAuthHeaders } from "../lib/auth";

type EstadoSucursal = "Abierta" | "Cerrada" | "Mantenimiento";

/** API Gimnasio */
type ApiGimnasio = {
    id_gimnasio: number;
    id_empresa: number;
    nombre: string;
    direccion: string;
    telefono: string;
    correo: string;
    activo: number | boolean;
    fecha_creacion: string;
};

/** API Empresa */
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
    gymId: string;      // "G-010"
    gymIdNum: number;   // 10
    gymNombre: string;
    ciudad: string;
    sucursalId: string;
    miembros: number;    // ← clientes_count (n° de clientes)
    membresias: number;  // ← active_count (membresías activas)
    estado: EstadoSucursal;
    telefono: string;
    correo: string;
    fechaCreacion?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const estadoColor = (e: EstadoSucursal) =>
    e === "Abierta" ? "success" : e === "Cerrada" ? "danger" : "warning";

const zpad3 = (n: number) => n.toString().padStart(3, "0");
const toBool = (v: number | boolean) =>
    typeof v === "boolean" ? v : Number(v) === 1;

/** Logo relativo → absoluto */
function getLogoUrl(logo_url?: string | null): string | null {
    if (!logo_url) return null;
    if (/^(https?:)?\/\//i.test(logo_url) || /^data:image\//i.test(logo_url)) return logo_url;
    if (logo_url.startsWith("/")) return `${API_BASE}${logo_url}`;
    return `${API_BASE}/${logo_url}`;
}

/** Mapea gimnasio a fila de UI (incluye id numérico real) */
function mapApiToRow(item: ApiGimnasio): Row {
    const gymIdNum = Number(item.id_gimnasio);
    const gymId = `G-${zpad3(gymIdNum)}`;
    const sucursalId = `${gymId}-S1`;
    const estado: EstadoSucursal = toBool(item.activo) ? "Abierta" : "Cerrada";

    return {
        gymId,
        gymIdNum,
        gymNombre: item.nombre ?? "Gimnasio",
        ciudad: item.direccion ?? "—",
        sucursalId,
        miembros: 0,      // se llenará con clientes_count
        membresias: 0,    // se llenará con active_count
        estado,
        telefono: item.telefono ?? "",
        correo: item.correo ?? "",
        fechaCreacion: item.fecha_creacion,
    };
}

/* ===================== Servicios de conteo ===================== */

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

/** Membresías activas por gimnasio */
async function fetchActiveCountByGym(id_gimnasio: number): Promise<number> {
    const url = `${API_BASE}/api/v1/membresias/membresias_count/gimnasio/${encodeURIComponent(
        id_gimnasio
    )}`;

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

/** Clientes (miembros) por gimnasio - OJO: ruta con prefijo /membresias/ */
async function fetchClientesCountByGym(id_gimnasio: number): Promise<number> {
    const url = `${API_BASE}/api/v1/membresias/clientes_count/gimnasio/${encodeURIComponent(
        id_gimnasio
    )}`;

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

/* ===================== Modal crear gym ===================== */

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

    const isEmail = (v: string) => !v || /\S+@\S+\.\S+/.test(v);
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
                activo,
            };
            const url = `${API_BASE}/api/v1/gimnasios`;
            const res = await authFetch(url, {
                method: "POST",
                headers: buildAuthHeaders({ "Content-Type": "application/json" }),
                mode: "cors",
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} al crear: ${t || "sin detalle"}`);
            }
            const created: ApiGimnasio = await res.json();
            const creadoMapeado = mapApiToRow({
                ...created,
                activo:
                    typeof created.activo === "boolean"
                        ? created.activo
                        : Number(created.activo),
                fecha_creacion: created.fecha_creacion ?? new Date().toISOString(),
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
                            placeholder="user@example.com"
                            isInvalid={!!correo && !/\S+@\S+\.\S+/.test(correo)}
                            errorMessage={
                                !!correo && !/\S+@\S+\.\S+/.test(correo)
                                    ? "Correo inválido"
                                    : undefined
                            }
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
                            Activo (aparece como <span className="font-semibold">Abierta</span>{" "}
                            en la lista)
                        </Checkbox>
                    </div>
                    {error && (
                        <Card className="border bg-danger-50">
                            <CardBody className="text-danger-700 text-sm">{error}</CardBody>
                        </Card>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onClick={onClose} isDisabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        color="primary"
                        onClick={handleSubmit}
                        isLoading={loading}
                        isDisabled={!canSave}
                    >
                        Guardar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

/* ===================== Página ===================== */

export default function GimnasiosPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const empresaId = sp.get("empresa") ?? "1";

    const [q, setQ] = React.useState("");
    const [rows, setRows] = React.useState<Row[] | null>(null);
    const [empresa, setEmpresa] = React.useState<ApiEmpresa | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [isNewOpen, setIsNewOpen] = React.useState(false);
    const [authExpired, setAuthExpired] = React.useState(false);

    /** ===== Carga principal ===== */
    React.useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setError(null);
                setRows(null);
                setEmpresa(null);
                setAuthExpired(false);

                const gymsUrl = `${API_BASE}/api/v1/gimnasios/${encodeURIComponent(
                    empresaId
                )}`;
                const empUrl = `${API_BASE}/api/v1/empresas/${encodeURIComponent(
                    empresaId
                )}`;

                const [gymsRes, empRes] = await Promise.all([
                    authFetch(gymsUrl, {
                        headers: buildAuthHeaders(),
                        cache: "no-store",
                        mode: "cors",
                    }),
                    authFetch(empUrl, {
                        headers: buildAuthHeaders(),
                        cache: "no-store",
                        mode: "cors",
                    }),
                ]);

                if (!gymsRes.ok) throw new Error(`HTTP ${gymsRes.status} al cargar ${gymsUrl}`);
                if (!empRes.ok) throw new Error(`HTTP ${empRes.status} al cargar ${empUrl}`);

                const gymsData = await gymsRes.json();
                const empData: ApiEmpresa = await empRes.json();

                const gymsList: ApiGimnasio[] = Array.isArray(gymsData)
                    ? gymsData
                    : Array.isArray((gymsData as any)?.items)
                        ? (gymsData as any).items
                        : [];

                const mapped = gymsList.map(mapApiToRow);

                // === Rellenar conteos por gym (clientes_count = miembros, active_count = membresias)
                try {
                    const counts = await Promise.all(
                        mapped.map(async (r) => {
                            try {
                                const [miembros, membresias] = await Promise.all([
                                    fetchClientesCountByGym(r.gymIdNum), // ← /api/v1/membresias/clientes_count/gimnasio/{id}
                                    fetchActiveCountByGym(r.gymIdNum),   // ← /api/v1/membresias/active_count/gimnasio/{id}
                                ]);
                                return { id: r.gymIdNum, miembros, membresias };
                            } catch (err: any) {
                                if (err?.__status === 401) setAuthExpired(true);
                                return { id: r.gymIdNum, miembros: 0, membresias: 0 };
                            }
                        })
                    );

                    const byIdMiembros = new Map<number, number>(counts.map(c => [c.id, c.miembros]));
                    const byIdMembresias = new Map<number, number>(counts.map(c => [c.id, c.membresias]));

                    for (const r of mapped) {
                        r.miembros = byIdMiembros.get(r.gymIdNum) ?? 0;
                        r.membresias = byIdMembresias.get(r.gymIdNum) ?? 0;
                    }
                } catch (e) {
                    if (process.env.NODE_ENV !== "production") {
                        console.warn("Fallo al obtener conteos de miembros/membresías:", e);
                    }
                }


                if (alive) {
                    setRows([...mapped]); // asegura re-render
                    setEmpresa(empData);
                }
            } catch (e: any) {
                if (alive) setError(e?.message ?? "Error al cargar");
            }
        })();

        return () => {
            alive = false;
        };
    }, [empresaId]);

    /** ===== Filtro ===== */
    const filtered = React.useMemo(() => {
        if (!rows) return null;
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter((r) =>
            [r.gymId, r.gymNombre, r.ciudad, r.sucursalId, r.telefono, r.correo, r.fechaCreacion ?? ""]
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [rows, q]);

    /** Header: empresa + reloj */
    const logo = getLogoUrl(empresa?.logo_url);
    const empresaIniciales =
        (empresa?.nombre || "")
            .split(/\s+/)
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "EM";

    function useGuayaquilNow() {
        const [now, setNow] = React.useState<Date | null>(null);
        React.useEffect(() => {
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

        <div className="relative z-10 space-y-6">
            {/* Aviso de sesión expirada (401) */}
            {authExpired && (
                <Card className="border">
                    <CardBody className="text-center">
                        <p className="font-medium">Sesión expirada (401).</p>
                        <p className="text-sm text-foreground-500 mt-1">
                            Vuelve a iniciar sesión para ver los conteos por gimnasio.
                        </p>
                        <Button
                            className="mt-3"
                            color="primary"
                            startContent={<Icon icon="solar:login-2-bold-duotone" />}
                            onClick={() => {
                                try {
                                    localStorage.removeItem("auth:token");
                                } catch { }
                                location.href = "/";
                            }}
                        >
                            Iniciar sesión
                        </Button>
                    </CardBody>
                </Card>
            )}

            {/* HEADER — Hero con fondo y overlay */}
            <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="relative overflow-hidden border-b">
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mt-3 mb-3 rounded-2xl border bg-background/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm">
                            <div className="px-4 md:px-6 py-3">
                                <div className="flex items-center justify-between gap-4">
                                    {/* Identidad */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-default-100 ring-1 ring-default-200 overflow-hidden flex items-center justify-center shrink-0">
                                            {logo ? (
                                                <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                                            ) : (
                                                <span className="text-2xl md:text-3xl font-bold text-foreground-500">
                                                    {empresaIniciales}
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                                                {empresa?.nombre || "Empresa"}
                                            </h1>
                                            {(empresa?.correo || empresa?.telefono) && (
                                                <p className="text-sm text-foreground-500 truncate flex items-center gap-3">
                                                    {empresa?.correo && <span>{empresa.correo}</span>}
                                                    {empresa?.telefono && <span>{empresa.telefono}</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reloj + CTA */}
                                    <div className="flex items-center gap-4">
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
                            </div>
                        </div>
                    </div>
                </div>
            </header>


            {/* TOOLBAR — búsqueda y contador */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    <Input
                        className="md:flex-1"
                        size="lg"
                        startContent={<Icon icon="solar:magnifier-linear" />}
                        placeholder="Buscar por gym, sucursal, ciudad, teléfono o correo…"
                        value={q}
                        onValueChange={setQ}
                        isDisabled={!rows && !error}
                    />

                    <div className="ml-0 md:ml-auto text-sm text-foreground-500 text-right">
                        {rows ? (
                            <span>
                                {filtered?.length ?? 0} resultado{(filtered?.length ?? 0) === 1 ? "" : "s"}
                            </span>
                        ) : null}
                    </div>
                </div>
            </section>


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
                                className="border hover:shadow-md hover:-translate-y-0.5 transition ease-out cursor-pointer rounded-2xl"
                                onClick={() => router.push(href)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        router.push(href);
                                    }
                                }}
                            >
                                <CardHeader className="justify-between">
                                    <div className="min-w-0 flex items-start gap-3">
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-default-100 ring-1 ring-default-200 shrink-0">
                                            <Icon icon="solar:buildings-2-bold-duotone" className="text-lg" />
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="truncate font-semibold">{r.gymNombre}</h3>
                                            <p className="truncate text-xs text-foreground-500">
                                                {r.gymId} • {r.ciudad}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-500">
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
                                    <Chip size="sm" color={estadoColor(r.estado)} variant="flat">
                                        {r.estado}
                                    </Chip>
                                </CardHeader>

                                <CardBody className="pt-0">
                                    <div className="grid grid-cols-2 gap-2 text-center text-sm">
                                        <div className="rounded-lg bg-default-100 p-2">
                                            <div className="text-xs text-foreground-500">Miembros</div>
                                            <div className="font-semibold tabular-nums">{r.miembros}</div>
                                        </div>
                                        <div className="rounded-lg bg-default-100 p-2">
                                            <div className="text-xs text-foreground-500">Membresías</div>
                                            <div className="font-semibold tabular-nums">{r.membresias}</div>
                                        </div>
                                    </div>
                                </CardBody>

                                <CardFooter className="justify-between">
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
                onCreated={(nuevo) =>
                    setRows((prev) => (prev ? [nuevo, ...prev] : [nuevo]))
                }
            />
        </div>
    );
}
