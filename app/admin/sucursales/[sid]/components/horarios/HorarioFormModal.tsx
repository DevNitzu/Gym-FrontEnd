"use client";
import React from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiHorarioGimnasio } from "../../../../lib/types";
import { toHHMMSS } from "../../../../lib/utils";
import { apiCreateHorario, apiDeleteHorario, apiUpdateHorario } from "../../../../lib/api";

export type HorarioFormState = {
    id_horario_gimnasio?: number; id_gimnasio: number; dia_semana: number;
    hora_apertura: string; hora_cierre: string;
};

export default function HorarioFormModal({
    open, onClose, initial, onSaved, onDeleted, isCreate, dayLockedLabel,
}: {
    open: boolean; onClose: () => void; initial: HorarioFormState;
    onSaved: (saved: ApiHorarioGimnasio) => void; onDeleted?: () => void;
    isCreate: boolean; dayLockedLabel: string;
}) {
    const [form, setForm] = React.useState<HorarioFormState>(initial);
    const [saving, setSaving] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    React.useEffect(() => { setForm(initial); setErr(null); }, [initial, open]);

    const handleSave = async () => {
        try {
            setSaving(true); setErr(null);
            if (form.hora_apertura >= form.hora_cierre) { setErr("La hora de apertura debe ser menor que la de cierre."); setSaving(false); return; }
            const payload = {
                id_gimnasio: form.id_gimnasio, dia_semana: form.dia_semana,
                hora_apertura: toHHMMSS(form.hora_apertura), hora_cierre: toHHMMSS(form.hora_cierre),
            };
            const saved = form.id_horario_gimnasio
                ? await apiUpdateHorario(form.id_horario_gimnasio, payload)
                : await apiCreateHorario(payload);
            onSaved(saved); onClose();
        } catch (e: any) {
            setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión nuevamente." : e?.message || "No se pudo guardar el horario.");
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!form.id_horario_gimnasio) return;
        try {
            setSaving(true); setErr(null);
            await apiDeleteHorario(form.id_horario_gimnasio);
            onDeleted?.(); onClose();
        } catch (e: any) {
            setErr(e?.__is401 ? "Sesión expirada (401). Inicia sesión nuevamente." : e?.message || "No se pudo eliminar el horario.");
        } finally { setSaving(false); }
    };

    return (
        <Modal isOpen={open} onOpenChange={(o) => !o && onClose()} backdrop="blur" placement="center" isDismissable={!saving}>
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="solar:calendar-bold-duotone" />
                            {isCreate ? "Definir horario" : "Editar horario"}
                        </ModalHeader>
                        <ModalBody>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select label="Día de la semana" selectedKeys={new Set(["locked"])} isDisabled>
                                    <SelectItem key="locked">{dayLockedLabel}</SelectItem>
                                </Select>
                                <Input label="Hora de apertura" type="time" value={form.hora_apertura}
                                    onChange={(e) => setForm((f) => ({ ...f, hora_apertura: e.target.value }))} />
                                <Input label="Hora de cierre" type="time" value={form.hora_cierre}
                                    onChange={(e) => setForm((f) => ({ ...f, hora_cierre: e.target.value }))} />
                            </div>
                            {err && <div className="text-danger-500 text-sm mt-2 flex items-center gap-2"><Icon icon="solar:danger-triangle-bold-duotone" />{err}</div>}
                        </ModalBody>
                        <ModalFooter className="justify-between">
                            {form.id_horario_gimnasio ? (
                                <Button color="danger" variant="flat" startContent={<Icon icon="solar:trash-bin-minimalistic-bold-duotone" />}
                                    onPress={handleDelete} isDisabled={saving}>Eliminar</Button>
                            ) : <div />}
                            <div className="flex gap-2">
                                <Button variant="flat" onPress={onClose} isDisabled={saving}>Cancelar</Button>
                                <Button color="primary" onPress={handleSave} isLoading={saving} startContent={<Icon icon="solar:check-read-line-duotone" />}>
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
