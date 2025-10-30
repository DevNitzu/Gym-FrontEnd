"use client";
import React from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function ConfirmModal({
    open, title = "Confirmar", message, onCancel, onConfirm, confirmText = "Confirmar",
    cancelText = "Cancelar", loading = false, danger = false,
}: {
    open: boolean; title?: string; message: string; onCancel: () => void; onConfirm: () => void;
    confirmText?: string; cancelText?: string; loading?: boolean; danger?: boolean;
}) {
    return (
        <Modal isOpen={open} onOpenChange={(o) => !o && onCancel()} backdrop="blur" placement="center" isDismissable={!loading}>
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon={danger ? "solar:danger-triangle-bold-duotone" : "solar:question-circle-bold-duotone"} />
                            {title}
                        </ModalHeader>
                        <ModalBody>{message}</ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onCancel} isDisabled={loading}>{cancelText}</Button>
                            <Button color={danger ? "danger" : "primary"} onPress={onConfirm} isLoading={loading}>
                                {confirmText}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
