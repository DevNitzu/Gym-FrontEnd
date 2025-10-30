"use client";
import React from "react";
import { Button, Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiEstadoPago, ApiMembresia } from "../../../../lib/types";
import { LOCALE, money } from "../../../../lib/utils";
import { apiListMembresiasByGym, apiListEstadosPago } from "../../../../lib/api";
import EditarMembresiaModal from "./EditarMembresiaModal";

export default function ListaMembresias({ id_gimnasio }: { id_gimnasio: number }) {
    const [items, setItems] = React.useState<ApiMembresia[]>([]);
    const [estados, setEstados] = React.useState<ApiEstadoPago[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<ApiMembresia | null>(null);
    const [okOpen, setOkOpen] = React.useState(false);

    const reload = React.useCallback(async () => {
        setLoading(true); setErr(null);
        try {
            const [list, ep] = await Promise.all([apiListMembresiasByGym(id_gimnasio), apiListEstadosPago()]);
            list.sort((a, b) => (b.id_membresia - a.id_membresia));
            setItems(list); setEstados(ep);
        } catch (e: any) {
            setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo listar membresías.");
        } finally { setLoading(false); }
    }, [id_gimnasio]);

    React.useEffect(() => { reload(); }, [reload]);

    const openEdit = (m: ApiMembresia) => { setEditing(m); setEditOpen(true); };

    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:bill-list-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Membresías vendidas</span>
                    <Chip size="sm" variant="flat" color="success">{items.length}</Chip>
                </div>
                <Button size="sm" variant="flat" startContent={<Icon icon="solar:refresh-bold-duotone" />} onPress={reload}>Refrescar</Button>
            </CardHeader>

            <CardBody className="space-y-2">
                {loading && <div className="flex items-center gap-2 text-foreground-500"><Spinner size="sm" /> Cargando…</div>}
                {err && !loading && <div className="text-danger-500 flex items-center gap-2"><Icon icon="solar:danger-triangle-bold-duotone" />{err}</div>}
                {!loading && items.length === 0 && <div className="text-sm text-foreground-500">Sin ventas registradas.</div>}

                {!loading && items.map((m) => (
                    <Card key={m.id_membresia} className="border-sm">
                        <CardBody className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex flex-col">
                                <div className="font-semibold">#{m.id_membresia} • {m.unidad_duracion.toUpperCase()} × {m.cantidad_duracion}</div>
                                <div className="text-foreground-500">
                                    Inicio: {new Date(m.fecha_inicio).toLocaleString(LOCALE)} — Expira: {new Date(m.fecha_expiracion).toLocaleString(LOCALE)}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="font-semibold">{money(m.precio_total)}</div>
                                <Button size="sm" variant="flat" startContent={<Icon icon="solar:pen-bold-duotone" />} onPress={() => openEdit(m)}>Editar</Button>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </CardBody>

            <EditarMembresiaModal
                open={editOpen} onClose={() => setEditOpen(false)} item={editing} estados={estados}
                onSaved={(upd) => { setItems((prev) => prev.map((x) => (x.id_membresia === upd.id_membresia ? upd : x))); setOkOpen(true); }}
            />
        </Card>
    );
}
