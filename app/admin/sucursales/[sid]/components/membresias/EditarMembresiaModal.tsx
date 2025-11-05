"use client";
import React from "react";
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Switch,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiEstadoPago, ApiMembresia } from "../../../../lib/types";
import { apiUpdateMembresia } from "../../../../lib/api";

type Props = {
    open: boolean;
    onClose: () => void;
    item: ApiMembresia | null;
    onSaved: (m: ApiMembresia) => void;
    estados: ApiEstadoPago[];
};

export default function EditarMembresiaModal({
    open,
    onClose,
    item,
    onSaved,
    estados,
}: Props) {
    const [estado, setEstado] = React.useState<string>("");
    const [renovable, setRenovable] = React.useState<boolean>(true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (open && item) {
            setEstado(String(item.id_estado_pago ?? ""));
            setRenovable(Boolean(item.renovable));
            setSaving(false);
        }
    }, [open, item]);

    const save = async () => {
        if (!item) return;
        try {
            setSaving(true);
            const updated = await apiUpdateMembresia(item.id_membresia, {
                id_estado_pago: Number(estado),
                renovable,
            });
            // 👇 Solo informamos al padre; él decide cerrar.
            onSaved(updated);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={open}
            // ❌ Quitamos onOpenChange para evitar cierres implícitos
            isDismissable={false} // no cerrar con ESC ni click fuera
            backdrop="blur"
            placement="center"
            hideCloseButton // sin botón X para evitar cierres accidentales
        >
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        <Icon icon="solar:pen-bold-duotone" />
                        Editar membresía #{item?.id_membresia}
                    </ModalHeader>

                    <ModalBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                            label="Estado de pago"
                            selectedKeys={estado ? new Set([estado]) : new Set([])}
                            onSelectionChange={(k) => {
                                const val = String(Array.from(k)[0] ?? "");
                                setEstado(val);
                            }}
                            disallowEmptySelection
                        >
                            {estados.map((e) => (
                                <SelectItem key={e.id_estado_pago}>{e.nombre}</SelectItem>
                            ))}
                        </Select>

                        <div className="flex items-center gap-3">
                            <span>Renovable</span>
                            <Switch
                                isSelected={renovable}
                                onValueChange={setRenovable}
                                isDisabled={saving}
                            />
                        </div>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="flat" onPress={onClose} isDisabled={saving}>
                            Cancelar
                        </Button>
                        <Button
                            color="primary"
                            onPress={save}
                            isLoading={saving}
                            startContent={<Icon icon="solar:check-read-line-duotone" />}
                            isDisabled={!estado} // evita guardar sin estado
                        >
                            Guardar cambios
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
}
