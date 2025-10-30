"use client";
import React from "react";
import { Button, Card, CardBody, CardHeader, Chip, Input, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiEmpleado } from "../../../../lib/types";
import { apiListEmpleadosByGimnasio } from "../../../../lib/api";

function EmpleadoRow({ e }: { e: ApiEmpleado }) {
    return (
        <Card className="border-sm">
            <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-default-200 grid place-content-center"><Icon icon="solar:user-bold-duotone" /></div>
                    <div>
                        <div className="font-semibold">{e.nombre} {e.apellido}</div>
                        <div className="text-xs text-foreground-500">{e.correo} • {e.telefono || "—"} • Cédula: {e.cedula || "—"}</div>
                        <div className="mt-1">
                            <Chip size="sm" color="success" variant="flat" startContent={<Icon icon="solar:map-point-bold-duotone" />}>
                                Pertenece a este gimnasio
                            </Chip>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

export default function PersonalDeEsteGimnasio({ gymIdNum }: { gymIdNum: number }) {
    const [items, setItems] = React.useState<ApiEmpleado[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);
    const [q, setQ] = React.useState("");

    const reload = React.useCallback(async () => {
        setLoading(true); setErr(null);
        try {
            const list = await apiListEmpleadosByGimnasio(gymIdNum);
            list.sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre));
            setItems(list);
        } catch (e: any) {
            setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo cargar el personal.");
        } finally { setLoading(false); }
    }, [gymIdNum]);

    React.useEffect(() => { reload(); }, [reload]);

    const filtered = (items || []).filter((e) => {
        const t = `${e.nombre} ${e.apellido} ${e.correo} ${e.cedula}`.toLowerCase();
        return q.trim() ? t.includes(q.trim().toLowerCase()) : true;
    });

    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:shield-user-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Personal asignado a este gimnasio</span>
                    {items && <Chip size="sm" variant="flat" color="success">{items.length} empleados</Chip>}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Input className="w-full sm:w-64" size="sm" startContent={<Icon icon="solar:magnifier-bold-duotone" />}
                        placeholder="Buscar por nombre, correo o cédula…" value={q} onValueChange={setQ} />
                    <Button size="sm" variant="flat" startContent={<Icon icon="solar:refresh-bold-duotone" />} onPress={reload}>Refrescar</Button>
                </div>
            </CardHeader>

            <CardBody className="space-y-3">
                {loading && <div className="flex items-center gap-2 text-foreground-500"><Spinner size="sm" /> Cargando personal…</div>}
                {err && !loading && <div className="text-danger-500 flex items-center gap-2"><Icon icon="solar:danger-triangle-bold-duotone" />{err}</div>}
                {!loading && items && filtered.length === 0 && <div className="text-sm text-foreground-500">No hay empleados asignados {q.trim() ? "para tu búsqueda" : ""}.</div>}
                {!loading && filtered.map((e) => <EmpleadoRow key={e.id_empleado} e={e} />)}
            </CardBody>
        </Card>
    );
}
