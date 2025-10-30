"use client";
import React from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function InfoModal({
    open, type = "success", title, message, onClose,
}: { open: boolean; type?: "success" | "error"; title: string; message: string; onClose: () => void; }) {
    const icon = type === "success" ? "solar:check-read-line-duotone" : "solar:danger-triangle-bold-duotone";
    const color = type === "success" ? "primary" : "danger";
    return (
        <Modal isOpen={open} onOpenChange={(o) => !o && onClose()} backdrop="blur" placement="center">
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon={icon} className={color === "primary" ? "text-primary" : "text-danger"} />
                            {title}
                        </ModalHeader>
                        <ModalBody>{message}</ModalBody>
                        <ModalFooter>
                            <Button color={color} onPress={onClose}>Entendido</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
