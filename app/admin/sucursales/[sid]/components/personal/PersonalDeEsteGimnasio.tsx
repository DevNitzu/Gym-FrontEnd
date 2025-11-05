"use client";
import React from "react";
import {
    Avatar,
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Spinner,
    Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiEmpleado } from "../../../../lib/types";
import { apiListEmpleadosByGimnasio } from "../../../../lib/api";

/* ====================== Utils UI ====================== */
function initialsFromName(nombre?: string, apellido?: string) {
    const n = (nombre || "").trim();
    const a = (apellido || "").trim();
    const ni = n ? n[0] : "";
    const ai = a ? a[0] : "";
    return `${ni}${ai}`.toUpperCase() || "👤";
}

function EmpleadoRow({ e }: { e: ApiEmpleado }) {
    return (
        <Card
            className="border-sm hover:shadow-md transition-shadow duration-200"
            radius="lg"
        >
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left block: avatar + principal info */}
                <div className="flex items-start sm:items-center gap-3">
                    <Avatar
                        name={`${e.nombre} ${e.apellido}`}
                        className="shrink-0"
                        color="success"
                        radius="full"
                    >
                        {initialsFromName(e.nombre, e.apellido)}
                    </Avatar>

                    <div className="min-w-0">
                        <div className="font-semibold truncate">
                            {e.nombre} {e.apellido}
                        </div>

                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-xs text-foreground-500">
                            <div className="flex items-center gap-1 min-w-0">
                                <Icon className="text-base" icon="solar:letter-bold-duotone" />
                                <span className="truncate">{e.correo}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Icon className="text-base" icon="solar:phone-bold-duotone" />
                                <span>{e.telefono || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Icon className="text-base" icon="solar:id-bold-duotone" />
                                <span>Cédula: {e.cedula || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Icon
                                    className="text-base"
                                    icon="solar:calendar-mark-bold-duotone"
                                />
                                <span className="truncate">
                                    Alta: {new Date(e.fecha_creacion).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right block: quick actions */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Tooltip content="Enviar correo">
                        <Button
                            isIconOnly
                            variant="light"
                            radius="full"
                            as="a"
                            href={`mailto:${e.correo}`}
                        >
                            <Icon className="text-xl" icon="solar:letter-linear" />
                        </Button>
                    </Tooltip>
                    <Tooltip content="Llamar / WhatsApp">
                        <Button
                            isIconOnly
                            variant="light"
                            radius="full"
                            as="a"
                            href={e.telefono ? `tel:${e.telefono}` : "#"}
                        >
                            <Icon className="text-xl" icon="solar:phone-linear" />
                        </Button>
                    </Tooltip>
                    <Tooltip content="Copiar cédula">
                        <Button
                            isIconOnly
                            variant="light"
                            radius="full"
                            onPress={() => navigator.clipboard?.writeText(e.cedula || "")}
                        >
                            <Icon className="text-xl" icon="solar:copy-linear" />
                        </Button>
                    </Tooltip>
                </div>
            </CardBody>
        </Card>
    );
}

/* ================ Skeleton ================ */
function EmpleadoSkeleton() {
    return (
        <Card className="border-sm">
            <CardBody className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full">
                    <div className="h-10 w-10 rounded-full bg-default-200 animate-pulse" />
                    <div className="w-full">
                        <div className="h-4 w-40 bg-default-200 rounded animate-pulse" />
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="h-3 w-44 bg-default-200 rounded animate-pulse" />
                            <div className="h-3 w-28 bg-default-200 rounded animate-pulse" />
                            <div className="h-3 w-36 bg-default-200 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-default-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="h-8 w-8 bg-default-200 rounded-full animate-pulse" />
            </CardBody>
        </Card>
    );
}

/* ================ Empty State ================ */
function EmptyState({ q }: { q: string }) {
    return (
        <div className="text-sm text-foreground-500 flex flex-col items-center gap-2 py-6">
            <Icon icon="solar:user-cross-bold-duotone" className="text-2xl" />
            <span>
                {q.trim()
                    ? "No hay empleados que coincidan con tu búsqueda."
                    : "No hay empleados asignados todavía."}
            </span>
        </div>
    );
}

/* ================ Main ================ */
export default function PersonalDeEsteGimnasio({
    gymIdNum,
}: {
    gymIdNum: number;
}) {
    const [items, setItems] = React.useState<ApiEmpleado[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);
    const [q, setQ] = React.useState("");

    const reload = React.useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const list = await apiListEmpleadosByGimnasio(gymIdNum);
            list.sort(
                (a, b) =>
                    a.apellido.localeCompare(b.apellido) ||
                    a.nombre.localeCompare(b.nombre)
            );
            setItems(list);
        } catch (e: any) {
            setErr(
                e?.__is401
                    ? "Sesión expirada (401). Inicia sesión."
                    : e?.message || "No se pudo cargar el personal."
            );
        } finally {
            setLoading(false);
        }
    }, [gymIdNum]);

    React.useEffect(() => {
        reload();
    }, [reload]);

    const filtered = (items || []).filter((e) => {
        const t = `${e.nombre} ${e.apellido} ${e.correo} ${e.cedula}`.toLowerCase();
        return q.trim() ? t.includes(q.trim().toLowerCase()) : true;
    });

    return (
        <Card className="border" radius="lg">
            <CardHeader className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Icon icon="solar:shield-user-bold-duotone" className="text-xl" />
                    <span className="font-semibold truncate">
                        Personal asignado a este gimnasio
                    </span>
                    {items && (
                        <Chip size="sm" variant="flat" color="success">
                            {items.length} empleados
                        </Chip>
                    )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <Input
                        className="w-full sm:w-72"
                        size="sm"
                        startContent={<Icon icon="solar:magnifier-bold-duotone" />}
                        placeholder="Buscar por nombre, correo o cédula…"
                        value={q}
                        onValueChange={setQ}
                    />
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<Icon icon="solar:refresh-bold-duotone" />}
                        onPress={reload}
                    >
                        Refrescar
                    </Button>
                </div>
            </CardHeader>

            <CardBody className="space-y-3">
                {loading && !items && (
                    <>
                        <div className="flex items-center gap-2 text-foreground-500">
                            <Spinner size="sm" /> Cargando personal…
                        </div>
                        <EmpleadoSkeleton />
                        <EmpleadoSkeleton />
                        <EmpleadoSkeleton />
                    </>
                )}

                {err && !loading && (
                    <div className="text-danger-500 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold-duotone" className="text-lg" />
                        {err}
                    </div>
                )}

                {!loading && items && filtered.length === 0 && <EmptyState q={q} />}

                {!loading &&
                    filtered.map((e) => <EmpleadoRow key={e.id_empleado} e={e} />)}
            </CardBody>
        </Card>
    );
}
