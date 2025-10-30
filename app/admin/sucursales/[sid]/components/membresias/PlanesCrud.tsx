"use client";
import React from "react";
import { Button, Card, CardBody, CardHeader, Chip, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Spinner, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiPrecioMembresia } from "../../../../lib/types";
import { apiCreatePrecioMembresia, apiDeletePrecioMembresia, apiListPrecioMembresias, apiUpdatePrecioMembresia } from "../../../../lib/api";

const TIPO_OPCIONES = [
    { key: "dia", label: "Día" },
    { key: "mes", label: "Mes" },
    { key: "año", label: "Año" },
];

function tierFromTipo(tipo: string) {
    const t = (tipo || "").toLowerCase();
    if (t.includes("oro") || t.includes("gold")) return "oro";
    if (t.includes("plata") || t.includes("silver")) return "plata";
    if (t.includes("bronce") || t.includes("bronze")) return "bronce";
    return "neutral";
}
function getTierStyles(tier: "oro" | "plata" | "bronce" | "neutral") {
    switch (tier) {
        case "oro": return { ring: "ring-2 ring-[#D4AF37]/60", chip: "bg-[#D4AF37]/15 text-[#6b5b17] border border-[#D4AF37]/40", bg: { backgroundImage: "linear-gradient(135deg,#FFF7D6 0%,#F5E6A6 35%,#EED27A 60%,#F5E6A6 85%)" } as React.CSSProperties };
        case "plata": return { ring: "ring-2 ring-[#C0C0C0]/60", chip: "bg-[#C0C0C0]/15 text-[#4d4d4d] border border-[#C0C0C0]/40", bg: { backgroundImage: "linear-gradient(135deg,#F7F7F8 0%,#E6E7EA 35%,#D6D7DB 60%,#ECEDEF 85%)" } as React.CSSProperties };
        case "bronce": return { ring: "ring-2 ring-[#CD7F32]/60", chip: "bg-[#CD7F32]/15 text-[#6a3f1f] border border-[#CD7F32]/40", bg: { backgroundImage: "linear-gradient(135deg,#FFE7D6 0%,#F3C09A 35%,#E3A16F 60%,#F3C09A 85%)" } as React.CSSProperties };
        default: return { ring: "ring-1 ring-default-200", chip: "bg-default-100 text-foreground-600 border border-default-200", bg: { background: "linear-gradient(135deg,#fafafa,#f2f2f2)" } as React.CSSProperties };
    }
}

function MembershipCard({
    item, onEdit, onDelete,
}: { item: ApiPrecioMembresia; onEdit: (m: ApiPrecioMembresia) => void; onDelete: (m: ApiPrecioMembresia) => void; }) {
    const tier = tierFromTipo(item.tipo) as "oro" | "plata" | "bronce" | "neutral";
    const sty = getTierStyles(tier);
    return (
        <div className={`relative overflow-hidden rounded-2xl p-4 transition-transform hover:-translate-y-0.5 hover:shadow-lg ${sty.ring}`} style={sty.bg}>
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-25 bg-white" />
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                    <Icon icon="solar:crown-bold-duotone" className="text-xl" />
                    <span className="tracking-wide uppercase">{item.tipo}</span>
                </div>
                <div className={`px-2 py-0.5 text-[11px] rounded-full ${sty.chip}`} title={item.activo ? "Activo" : "Inactivo"}>
                    ID #{item.id_precio_membresia}
                </div>
            </div>
            <div className="mt-3 flex items-end gap-2">
                <div className="text-3xl font-bold leading-none">${(item.precio ?? 0).toFixed(2)}</div>
                <div className="mb-1 text-xs text-foreground-500">precio base</div>
            </div>
            <div className="mt-2 text-[12px] text-foreground-600">
                Creado: {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleString("es-EC") : "—"}
            </div>
            <div className="mt-4 flex gap-2">
                <Button size="sm" variant="flat" startContent={<Icon icon="solar:pen-bold-duotone" />} onPress={() => onEdit(item)}>Editar</Button>
                <Button size="sm" variant="bordered" color="danger" startContent={<Icon icon="solar:trash-bin-minimalistic-bold-duotone" />} onPress={() => onDelete(item)}>Eliminar</Button>
            </div>
        </div>
    );
}

export default function MembresiasCrud({ id_gimnasio }: { id_gimnasio: number }) {
    const [items, setItems] = React.useState<ApiPrecioMembresia[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [isCreate, setIsCreate] = React.useState(true);

    const [form, setForm] = React.useState<{ id_precio_membresia?: number; id_gimnasio: number; tipo: string; precio: string; }>
        ({ id_gimnasio, tipo: "", precio: "" });

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [toDelete, setToDelete] = React.useState<ApiPrecioMembresia | null>(null);

    const reload = React.useCallback(async () => {
        setLoading(true); setErr(null);
        try {
            const list = await apiListPrecioMembresias(id_gimnasio);
            const priority = { oro: 0, plata: 1, bronce: 2, neutral: 3 } as Record<string, number>;
            list.sort((a, b) => priority[tierFromTipo(a.tipo)] - priority[tierFromTipo(b.tipo)]);
            setItems(list);
        } catch (e: any) {
            setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo listar las membresías.");
        } finally { setLoading(false); }
    }, [id_gimnasio]);

    React.useEffect(() => { reload(); }, [reload]);

    const openCreate = () => { setIsCreate(true); setForm({ id_gimnasio, tipo: "", precio: "" }); setModalOpen(true); };
    const openEdit = (m: ApiPrecioMembresia) => { setIsCreate(false); setForm({ id_precio_membresia: m.id_precio_membresia, id_gimnasio: m.id_gimnasio, tipo: m.tipo, precio: String(m.precio ?? "") }); setModalOpen(true); };

    const askDelete = (m: ApiPrecioMembresia) => { setToDelete(m); setConfirmOpen(true); };
    const doDelete = async () => {
        if (!toDelete) return;
        try { await apiDeletePrecioMembresia(toDelete.id_precio_membresia); await reload(); }
        catch (e: any) { setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo eliminar."); }
        finally { setConfirmOpen(false); setToDelete(null); }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const finalTipo = (form.tipo || "").trim();
            if (!finalTipo) throw new Error("Selecciona un tipo (día, mes o año).");
            const precioNum = Number(form.precio);
            if (!Number.isFinite(precioNum) || precioNum <= 0) throw new Error("Ingresa un precio válido (> 0).");

            if (form.id_precio_membresia) {
                await apiUpdatePrecioMembresia(form.id_precio_membresia, { id_gimnasio, tipo: finalTipo, precio: precioNum });
            } else {
                await apiCreatePrecioMembresia({ id_gimnasio, tipo: finalTipo, precio: precioNum });
            }
            await reload(); setModalOpen(false);
        } catch (e: any) {
            setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo guardar.");
        } finally { setSaving(false); }
    };

    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:wallet-money-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Planes de Membresía (precios)</span>
                    {items && <Chip size="sm" variant="flat" color="success">{items.length} planes</Chip>}
                </div>
                <Button color="primary" startContent={<Icon icon="solar:add-circle-bold-duotone" />} onPress={openCreate}>Nuevo plan</Button>
            </CardHeader>

            <CardBody className="space-y-3">
                {loading && <div className="flex items-center gap-2 text-foreground-500"><Spinner size="sm" /> Cargando planes…</div>}
                {err && !loading && <div className="text-danger-500 flex items-center gap-2"><Icon icon="solar:danger-triangle-bold-duotone" /> {err}</div>}
                {!loading && (!items || items.length === 0) && <div className="text-sm text-foreground-500">Aún no tienes planes creados.</div>}
                {!loading && items && items.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((m) => (<MembershipCard key={m.id_precio_membresia} item={m} onEdit={openEdit} onDelete={askDelete} />))}
                    </div>
                )}
            </CardBody>

            {/* Modal crear/editar */}
            <Modal isOpen={modalOpen} onOpenChange={setModalOpen} isDismissable={!saving} backdrop="blur" placement="center">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2"><Icon icon="solar:wallet-money-bold-duotone" />{isCreate ? "Nuevo plan" : "Editar plan"}</ModalHeader>
                            <ModalBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select label="Tipo" placeholder="Selecciona un tipo" selectedKeys={form.tipo ? new Set([form.tipo]) : new Set([])}
                                    onSelectionChange={(keys) => setForm((f) => ({ ...f, tipo: (Array.from(keys)[0] as string) || "" }))}>
                                    {TIPO_OPCIONES.map((o) => <SelectItem key={o.key}>{o.label}</SelectItem>)}
                                </Select>
                                <Input label="Precio (USD)" type="number" inputMode="decimal" value={form.precio} onValueChange={(v) => setForm((f) => ({ ...f, precio: v }))} description="Usa punto como separador decimal" />
                            </ModalBody>
                            <ModalFooter className="flex justify-between">
                                <Button variant="flat" onPress={onClose} isDisabled={saving}>Cancelar</Button>
                                <Button color="primary" onPress={handleSave} isLoading={saving} startContent={<Icon icon="solar:check-read-line-duotone" />}>{isCreate ? "Guardar" : "Actualizar"}</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Confirm eliminar */}
            <Modal isOpen={confirmOpen} onOpenChange={setConfirmOpen} backdrop="blur" placement="center">
                <ModalContent>
                    {() => (
                        <>
                            <ModalHeader>Eliminar plan</ModalHeader>
                            <ModalBody>¿Seguro que deseas eliminar el plan <b>{toDelete?.tipo}</b>?</ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={() => setConfirmOpen(false)}>Cancelar</Button>
                                <Button color="danger" onPress={doDelete} startContent={<Icon icon="solar:trash-bin-minimalistic-bold-duotone" />}>Eliminar</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </Card>
    );
}
