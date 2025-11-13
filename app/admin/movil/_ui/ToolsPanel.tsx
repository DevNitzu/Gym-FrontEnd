"use client";
import React from "react";
import { Card, CardBody, CardHeader, Divider, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMobile } from "./useMobilePreviewStore";

function ToolBtn({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-default-100">
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-default-100"><Icon icon={icon} /></span>
            <span className="truncate">{label}</span>
        </button>
    );
}

export default function ToolsPanel() {
    const { open } = useMobile();
    return (
        <div className="hidden md:block fixed right-6 top-24 z-40 w-56">
            <Card className="border shadow-xl">
                <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:panel-right-bold-duotone" />
                        <span className="font-semibold">Herramientas</span>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="p-2">
                    <ToolBtn label="Mensajes" icon="solar:chat-round-bold-duotone" onClick={() => open("messages")} />
                    <ToolBtn label="Notificaciones" icon="solar:bell-bing-bold-duotone" onClick={() => open("push")} />
                    <ToolBtn label="Rutinas" icon="solar:dumbbell-bold-duotone" onClick={() => open("routines")} />
                    <ToolBtn label="Usuarios" icon="solar:user-rounded-bold-duotone" onClick={() => open("users")} />
                    <ToolBtn label="Módulos visibles" icon="solar:widgets-bold-duotone" onClick={() => open("modules")} />
                    <ToolBtn label="Marca / Ajustes" icon="solar:settings-bold-duotone" onClick={() => open("branding")} />
                    <Button className="mt-2" variant="flat" startContent={<Icon icon="solar:shop-bold-duotone" />}>Publicar</Button>
                </CardBody>
            </Card>
        </div>
    );
}
