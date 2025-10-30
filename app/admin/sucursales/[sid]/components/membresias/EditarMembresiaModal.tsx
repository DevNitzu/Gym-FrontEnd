"use client";
import React from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Switch } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiEstadoPago, ApiMembresia } from "../../../../lib/types";
import { apiUpdateMembresia } from "../../../../lib/api";

export default function EditarMembresiaModal({
    open, onClose, item, onSaved, estados,
}: { open: boolean; onClose: () => void; item: ApiMembresia | null; onSaved: (m: ApiMembresia) => void; estados: ApiEstadoPago[]; }) {
    const [estado, setEstado] = React.useState<string>("");
    const [renovable, setRenovable] = React.useState<boolean>(true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (open && item) {
            setEstado(String(item.id_estado_pago));
            setRenovable(Boolean(item.renovable));
            setSaving(false);
        }
    }, [open, item]);

    const save = async () => {
        if (!item) return;
        try {
            setSaving(true);
            const updated = await apiUpdateMembresia(item.id_membresia, { id_estado_pago: Number(estado), renovable });
            onSaved(updated); onClose();
        } finally { setSaving(false); }
    };

    return (
        <Modal isOpen={open} onOpenChange={(o) => !o && onClose()} backdrop="blur" placement="center" isDismissable={!saving}>
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex items-center gap-2"><Icon icon="solar:pen-bold-duotone" />Editar membresía #{item?.id_membresia}</ModalHeader>
                        <ModalBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Select label="Estado de pago" selectedKeys={estado ? new Set([estado]) : new Set([])} onSelectionChange={(k) => setEstado(String(Array.from(k)[0]))}>
                                {estados.map((e) => <SelectItem key={e.id_estado_pago}>{e.nombre}</SelectItem>)}
                            </Select>
                            <div className="flex items-center gap-3"><span>Renovable</span><Switch isSelected={renovable} onValueChange={setRenovable} /></div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onClose} isDisabled={saving}>Cancelar</Button>
                            <Button color="primary" onPress={save} isLoading={saving} startContent={<Icon icon="solar:check-read-line-duotone" />}>Guardar cambios</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
