"use client";

import React from "react";
import { Input, Textarea, Switch, Button, Card, CardHeader, CardBody, Divider, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { MobileProvider, useMobile } from "./_ui/useMobilePreviewStore";
import PhonePreview from "./_ui/PhonePreview";
import SideSheet from "./_ui/SideSheet";
import ToolsPanel from "./_ui/ToolsPanel";
import TopToolbar from "./_ui/TopToolbar";
import { RUTINAS, USERS } from "./_ui/mocks";

function Sheets() {
    const { state, close, setVisible } = useMobile();
    const { messages, push, routines, users, branding, modules } = state.sheets;

    return (
        <>
            {/* Mensajes */}
            <SideSheet open={messages} onClose={() => close("messages")} title="Mensajes" icon="solar:chat-round-bold-duotone">
                <div className="space-y-3">
                    <Input label="Título" placeholder="Bienvenida a FitnessClub" />
                    <Textarea label="Contenido" minRows={5} placeholder="Texto del mensaje…" />
                    <Input label="Audiencia" placeholder="Todos / Premium / Con reserva hoy…" />
                    <div className="flex items-center gap-3">
                        <Switch defaultSelected>Programar</Switch>
                        <Input labelPlacement="outside-left" label="Fecha" placeholder="2025-11-20 09:00" />
                    </div>
                    <Button color="primary" startContent={<Icon icon="solar:paperplane-bold-duotone" />}>Enviar</Button>
                </div>
            </SideSheet>

            {/* Push */}
            <SideSheet open={push} onClose={() => close("push")} title="Notificaciones push" icon="solar:bell-bing-bold-duotone">
                <div className="space-y-3">
                    <Input label="Título" placeholder="Tu clase inicia en 1 hora" />
                    <Textarea label="Mensaje" minRows={4} placeholder="Texto de la notificación…" />
                    <Input label="Audiencia" placeholder="Reservas de hoy" />
                    <div className="flex items-center gap-3">
                        <Switch defaultSelected>Programar</Switch>
                        <Input labelPlacement="outside-left" label="Fecha" placeholder="2025-11-06 17:00" />
                    </div>
                    <Button color="primary" startContent={<Icon icon="solar:bell-bing-bold-duotone" />}>Enviar push</Button>
                </div>
            </SideSheet>

            {/* Rutinas */}
            <SideSheet open={routines} onClose={() => close("routines")} title="Rutinas" icon="solar:dumbbell-bold-duotone" width={560}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border">
                        <CardHeader className="font-semibold">Nueva rutina</CardHeader>
                        <CardBody className="space-y-3">
                            <Input label="Nombre" placeholder="Fuerza básica 3×/sem" />
                            <Input label="Nivel" placeholder="Básico / Intermedio / Avanzado" />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Sesiones" placeholder="8" />
                                <Input label="Duración" placeholder="30 min" />
                            </div>
                            <Textarea label="Descripción" minRows={4} placeholder="Resumen y objetivos…" />
                            <Button color="primary" startContent={<Icon icon="solar:save-2-bold-duotone" />}>Guardar</Button>
                        </CardBody>
                    </Card>
                    <Card className="border">
                        <CardHeader className="justify-between">
                            <div className="font-semibold">Biblioteca</div>
                            <Input size="sm" placeholder="Buscar…" startContent={<Icon icon="solar:magnifier-linear" />} />
                        </CardHeader>
                        <CardBody className="grid gap-3">
                            {RUTINAS.map(r => (
                                <div key={r.id} className="rounded-xl border p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="font-semibold">{r.nombre}</div>
                                            <div className="text-xs text-foreground-500">{r.nivel} · {r.duracion} · {r.sesiones} sesiones</div>
                                        </div>
                                        <Chip size="sm" variant="flat">{r.nivel}</Chip>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button size="sm" variant="flat" startContent={<Icon icon="solar:eye-bold-duotone" />}>Ver</Button>
                                        <Button size="sm" variant="light" startContent={<Icon icon="solar:upload-minimalistic-bold-duotone" />}>Publicar</Button>
                                    </div>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </div>
            </SideSheet>

            {/* Usuarios */}
            <SideSheet open={users} onClose={() => close("users")} title="Usuarios" icon="solar:user-rounded-bold-duotone">
                <div className="space-y-2">
                    {USERS.map(u => (
                        <div key={u.id} className="py-2 px-3 rounded-xl border flex items-center justify-between">
                            <div>
                                <div className="font-medium">{u.nombre}</div>
                                <div className="text-xs text-foreground-500">Última actividad: {u.last}</div>
                            </div>
                            <Chip size="sm" variant="flat" color={u.plan === "Premium" ? "success" : "default"}>{u.plan}</Chip>
                        </div>
                    ))}
                    <div className="pt-2">
                        <Button startContent={<Icon icon="solar:download-minimalistic-bold-duotone" />}>Exportar</Button>
                    </div>
                </div>
            </SideSheet>

            {/* Marca */}
            <SideSheet open={branding} onClose={() => close("branding")} title="Marca y ajustes" icon="solar:settings-bold-duotone">
                <div className="space-y-3">
                    <Input label="Nombre de la app" placeholder="FitnessClub" />
                    <Input label="Color primario" placeholder="#6A5ACD" />
                    <Input label="Dominio" placeholder="app.fitnessclub.ec" />
                    <div className="grid grid-cols-2 gap-3">
                        <Switch defaultSelected>Push habilitado</Switch>
                        <Switch defaultSelected>In-app messages</Switch>
                    </div>
                    <Button variant="flat" startContent={<Icon icon="solar:brush-bold-duotone" />}>Previsualizar tema</Button>
                </div>
            </SideSheet>

            {/* Visibilidad módulos */}
            <SideSheet open={modules} onClose={() => close("modules")} title="Módulos visibles" icon="solar:widgets-bold-duotone">
                <div className="grid gap-2">
                    {[
                        { k: "feed", label: "Feed / Próxima clase" },
                        { k: "messages", label: "Mensajes" },
                        { k: "notifications", label: "Notificaciones" },
                        { k: "routines", label: "Rutinas" },
                        { k: "users", label: "Usuarios" },
                        { k: "timer", label: "Cronómetro" },
                    ].map(m => (
                        <div key={m.k} className="flex items-center justify-between rounded-lg border px-3 py-2">
                            <div className="font-medium text-sm">{m.label}</div>
                            <Switch defaultSelected onValueChange={(v) => setVisible({ [m.k]: v } as any)} />
                        </div>
                    ))}
                </div>
            </SideSheet>
        </>
    );
}

function Content() {
    const { state, anyOpen } = useMobile();
    const previewW = Math.round((state.phone.w * state.phone.zoom) / 100);
    const previewH = Math.round((state.phone.h * state.phone.zoom) / 100);

    return (
        <>
            <TopToolbar />
            <div className={`mx-auto max-w-[1200px] px-4 ${anyOpen() ? "lg:pr-[440px]" : ""}`}>
                <div className="grid place-items-center py-6">
                    <PhonePreview screen={state.screen} visible={state.visible} height={previewH} width={previewW} />
                </div>
            </div>
            <ToolsPanel />
            <Sheets />
        </>
    );
}

export default function Page() {
    return (
        <MobileProvider>
            <Content />
        </MobileProvider>
    );
}
