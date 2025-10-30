"use client";
import React from "react";
import { Button, Card, CardBody, CardHeader, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiCliente } from "../../../../lib/types";
import { apiCreateCliente, apiDeleteCliente, apiListClientes, apiUpdateCliente } from "../../../../lib/api";

export default function ClientesCrud({ onSelect }: { onSelect?: (c: ApiCliente) => void }) {
    const [items, setItems] = React.useState<ApiCliente[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);
    const [q, setQ] = React.useState("");

    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<ApiCliente | null>(null);
    const [saving, setSaving] = React.useState(false);

    const [form, setForm] = React.useState<{ nombre: string; apellido: string; cedula: string; correo: string; telefono: string; contrasena?: string }>({
        nombre: "", apellido: "", cedula: "", correo: "", telefono: "", contrasena: "",
    });

    const reload = React.useCallback(async () => {
        setLoading(true); setErr(null);
        try {
            const list = await apiListClientes();
            list.sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre));
            setItems(list);
        } catch (e: any) {
            setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo cargar clientes.");
        } finally { setLoading(false); }
    }, []);

    React.useEffect(() => { reload(); }, [reload]);

    const filtered = (items || []).filter((c) => {
        const t = `${c.nombre} ${c.apellido} ${c.cedula} ${c.correo}`.toLowerCase();
        return q.trim() ? t.includes(q.trim().toLowerCase()) : true;
    });

    const openCreate = () => { setEditing(null); setForm({ nombre: "", apellido: "", cedula: "", correo: "", telefono: "", contrasena: "" }); setModalOpen(true); };
    const openEdit = (c: ApiCliente) => { setEditing(c); setForm({ nombre: c.nombre, apellido: c.apellido, cedula: c.cedula, correo: c.correo, telefono: c.telefono, contrasena: "" }); setModalOpen(true); };

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [toDelete, setToDelete] = React.useState<ApiCliente | null>(null);

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = { ...form };
            if (!payload.nombre || !payload.apellido || !payload.cedula) throw new Error("Nombre, apellido y cédula son obligatorios.");
            if (editing) await apiUpdateCliente(editing.id_cliente, payload);
            else await apiCreateCliente(payload);
            await reload(); setModalOpen(false);
        } catch (e: any) {
            setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo guardar.");
        } finally { setSaving(false); }
    };

    const confirmDelete = (c: ApiCliente) => { setToDelete(c); setConfirmOpen(true); };
    const doDelete = async () => {
        if (!toDelete) return;
        try { await apiDeleteCliente(toDelete.id_cliente); await reload(); }
        catch (e: any) { setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo eliminar."); }
        finally { setConfirmOpen(false); setToDelete(null); }
    };

    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:users-group-rounded-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Clientes</span>
                    {items && <Chip size="sm" variant="flat" color="success">{items.length}</Chip>}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Input className="w-full sm:w-72" size="sm" startContent={<Icon icon="solar:magnifier-bold-duotone" />}
                        placeholder="Buscar cliente…" value={q} onValueChange={setQ} />
                    <Button size="sm" variant="flat" startContent={<Icon icon="solar:refresh-bold-duotone" />} onPress={reload}>Refrescar</Button>
                    <Button size="sm" color="primary" startContent={<Icon icon="solar:add-circle-bold-duotone" />} onPress={openCreate}>Nuevo</Button>
                </div>
            </CardHeader>

            <CardBody className="space-y-3">
                {loading && <div className="flex items-center gap-2 text-foreground-500"><Spinner size="sm" /> Cargando clientes…</div>}
                {err && !loading && <div className="text-danger-500 flex items-center gap-2"><Icon icon="solar:danger-triangle-bold-duotone" /> {err}</div>}
                {!loading && filtered.length === 0 && <div className="text-sm text-foreground-500">Sin resultados.</div>}

                {!loading && filtered.map((c) => (
                    <Card key={c.id_cliente} className="border-sm">
                        <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-default-200 grid place-content-center"><Icon icon="solar:user-bold-duotone" /></div>
                                <div>
                                    <div className="font-semibold">{c.nombre} {c.apellido}</div>
                                    <div className="text-xs text-foreground-500">{c.correo || "—"} • {c.telefono || "—"} • Cédula: {c.cedula || "—"}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {onSelect && <Button size="sm" color="primary" variant="flat" startContent={<Icon icon="solar:check-read-line-duotone" />} onPress={() => onSelect(c)}>Seleccionar</Button>}
                                <Button size="sm" variant="flat" startContent={<Icon icon="solar:pen-bold-duotone" />} onPress={() => openEdit(c)}>Editar</Button>
                                <Button size="sm" variant="bordered" color="danger" startContent={<Icon icon="solar:trash-bin-minimalistic-bold-duotone" />} onPress={() => confirmDelete(c)}>Eliminar</Button>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </CardBody>

            {/* Modal Crear/Editar */}
            <Modal isOpen={modalOpen} onOpenChange={setModalOpen} isDismissable={!saving} backdrop="blur" placement="center">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <Icon icon="solar:user-plus-bold-duotone" /> {editing ? "Editar cliente" : "Nuevo cliente"}
                            </ModalHeader>
                            <ModalBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input label="Nombre" value={form.nombre} onValueChange={(v) => setForm(f => ({ ...f, nombre: v }))} />
                                <Input label="Apellido" value={form.apellido} onValueChange={(v) => setForm(f => ({ ...f, apellido: v }))} />
                                <Input label="Cédula" value={form.cedula} onValueChange={(v) => setForm(f => ({ ...f, cedula: v }))} />
                                <Input label="Correo" type="email" value={form.correo} onValueChange={(v) => setForm(f => ({ ...f, correo: v }))} />
                                <Input label="Teléfono" value={form.telefono} onValueChange={(v) => setForm(f => ({ ...f, telefono: v }))} />
                                <Input label="Contraseña (opcional)" type="password" value={form.contrasena || ""} onValueChange={(v) => setForm(f => ({ ...f, contrasena: v }))} />
                            </ModalBody>
                            <ModalFooter className="flex justify-between">
                                <Button variant="flat" onPress={onClose} isDisabled={saving}>Cancelar</Button>
                                <Button color="primary" onPress={handleSave} isLoading={saving} startContent={<Icon icon="solar:check-read-line-duotone" />}>Guardar</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Confirmación eliminar */}
            <Modal isOpen={confirmOpen} onOpenChange={setConfirmOpen} backdrop="blur" placement="center">
                <ModalContent>
                    {() => (
                        <>
                            <ModalHeader>Eliminar cliente</ModalHeader>
                            <ModalBody>¿Seguro que deseas eliminar al cliente <b>{toDelete?.nombre} {toDelete?.apellido}</b>?</ModalBody>
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
