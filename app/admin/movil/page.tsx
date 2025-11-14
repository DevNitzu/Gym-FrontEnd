"use client";

import React from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Input,
    Textarea,
    Switch,
    Chip,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";

type MobileModules = {
    rutinas: boolean;
    medidas: boolean;
    reservas: boolean;
    chat: boolean;
    tienda: boolean;
};

type Notifications = {
    enabled: boolean;
    recordatorioPago: boolean;
    inactividad: boolean;
    cumpleanios: boolean;
};

type Branding = {
    nombreApp: string;
    mensajeBienvenida: string;
    colorPrimario: string;
    colorSecundario: string;
    urlLogo: string;
    urlPortada: string;
};

type AccessControl = {
    soloClientesActivos: boolean;
    multiDispositivo: boolean;
    biometria: boolean;
};

export default function MobileAppManagementPage(): React.JSX.Element {
    const [branding, setBranding] = React.useState<Branding>({
        nombreApp: "App del Gimnasio",
        mensajeBienvenida: "¡Bienvenido a tu gimnasio! Revisa tus rutinas y tu progreso.",
        colorPrimario: "#2563EB",
        colorSecundario: "#10B981",
        urlLogo: "",
        urlPortada: "",
    });

    const [modules, setModules] = React.useState<MobileModules>({
        rutinas: true,
        medidas: true,
        reservas: true,
        chat: false,
        tienda: false,
    });

    const [access, setAccess] = React.useState<AccessControl>({
        soloClientesActivos: true,
        multiDispositivo: true,
        biometria: false,
    });

    const [notifications, setNotifications] = React.useState<Notifications>({
        enabled: true,
        recordatorioPago: true,
        inactividad: true,
        cumpleanios: true,
    });

    const [saving, setSaving] = React.useState(false);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    async function handleSave() {
        try {
            setSaving(true);
            // TODO: Aquí conectas con tu API
            console.log("Guardando configuración móvil:", {
                branding,
                modules,
                access,
                notifications,
            });
        } catch (error) {
            console.error("Error guardando configuración:", error);
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4 p-4 md:p-6 max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold flex items-center gap-2">
                            <Icon icon="solar:smartphone-2-bold-duotone" className="w-7 h-7" />
                            Gestión de la App Móvil
                        </h1>
                        <p className="text-sm text-default-500">
                            Configura qué ve el cliente en la app, sin tocar el código de la app móvil.
                        </p>
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                        <Button
                            variant="flat"
                            startContent={<Icon icon="solar:refresh-line-duotone" />}
                            onPress={() => {
                                console.log("Restaurar desde API (pendiente)");
                            }}
                        >
                            Recargar
                        </Button>
                        <Button
                            color="primary"
                            startContent={<Icon icon="solar:check-circle-bold-duotone" />}
                            isLoading={saving}
                            onPress={handleSave}
                        >
                            Guardar cambios
                        </Button>
                    </div>
                </header>

                {/* Contenido */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Branding */}
                    <Card shadow="sm">
                        <CardHeader className="flex items-center gap-2">
                            <Icon icon="solar:palette-bold-duotone" className="w-5 h-5" />
                            <div className="flex flex-col">
                                <p className="font-medium">Branding de la app</p>
                                <p className="text-xs text-default-500">
                                    Nombre, colores e imágenes que verá el cliente en su celular.
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="flex flex-col gap-3">
                            <Input
                                label="Nombre de la app"
                                placeholder="Ej: Gimnasio Titanes"
                                value={branding.nombreApp}
                                onChange={(e) =>
                                    setBranding((prev) => ({ ...prev, nombreApp: e.target.value }))
                                }
                            />
                            <Textarea
                                label="Mensaje de bienvenida"
                                minRows={3}
                                value={branding.mensajeBienvenida}
                                onChange={(e) =>
                                    setBranding((prev) => ({ ...prev, mensajeBienvenida: e.target.value }))
                                }
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                    label="Color primario"
                                    placeholder="#2563EB"
                                    value={branding.colorPrimario}
                                    onChange={(e) =>
                                        setBranding((prev) => ({ ...prev, colorPrimario: e.target.value }))
                                    }
                                />
                                <Input
                                    label="Color secundario"
                                    placeholder="#10B981"
                                    value={branding.colorSecundario}
                                    onChange={(e) =>
                                        setBranding((prev) => ({ ...prev, colorSecundario: e.target.value }))
                                    }
                                />
                            </div>
                            <Input
                                label="URL del logo (app / splash)"
                                placeholder="https://..."
                                value={branding.urlLogo}
                                onChange={(e) =>
                                    setBranding((prev) => ({ ...prev, urlLogo: e.target.value }))
                                }
                            />
                            <Input
                                label="URL de portada / imagen principal"
                                placeholder="https://..."
                                value={branding.urlPortada}
                                onChange={(e) =>
                                    setBranding((prev) => ({ ...prev, urlPortada: e.target.value }))
                                }
                            />

                            {/* Botón para abrir el modal de vista rápida */}
                            <div className="mt-3 flex items-center justify-between gap-2">
                                <p className="text-xs text-default-500">
                                    Vista rápida (referencial) de la pantalla principal de la app.
                                </p>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    startContent={<Icon icon="solar:eye-bold-duotone" />}
                                    onPress={onOpen}
                                >
                                    Ver vista rápida
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Acceso y login */}
                    <Card shadow="sm">
                        <CardHeader className="flex items-center gap-2">
                            <Icon icon="solar:shield-check-bold-duotone" className="w-5 h-5" />
                            <div className="flex flex-col">
                                <p className="font-medium">Acceso a la app</p>
                                <p className="text-xs text-default-500">
                                    Controla quién puede entrar y desde cuántos dispositivos.
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="flex flex-col gap-3">
                            <Switch
                                isSelected={access.soloClientesActivos}
                                onValueChange={(val) =>
                                    setAccess((prev) => ({ ...prev, soloClientesActivos: val }))
                                }
                            >
                                Solo clientes con membresía activa pueden usar la app
                            </Switch>
                            <Switch
                                isSelected={access.multiDispositivo}
                                onValueChange={(val) =>
                                    setAccess((prev) => ({ ...prev, multiDispositivo: val }))
                                }
                            >
                                Permitir varios dispositivos por cliente
                            </Switch>
                            <Switch
                                isSelected={access.biometria}
                                onValueChange={(val) =>
                                    setAccess((prev) => ({ ...prev, biometria: val }))
                                }
                            >
                                Permitir inicio de sesión con biometría (huella / rostro)
                            </Switch>

                            <Divider className="my-2" />

                            <p className="text-xs text-default-500">
                                Nota: aquí solo se define la política. La lógica real debe aplicarse en el
                                backend y en la app móvil.
                            </p>
                        </CardBody>
                    </Card>

                    {/* Módulos visibles */}
                    <Card shadow="sm">
                        <CardHeader className="flex items-center gap-2">
                            <Icon icon="solar:widget-6-bold-duotone" className="w-5 h-5" />
                            <div className="flex flex-col">
                                <p className="font-medium">Módulos visibles en la app</p>
                                <p className="text-xs text-default-500">
                                    Activa o desactiva secciones completas de la app del cliente.
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="flex flex-col gap-3">
                            <Switch
                                isSelected={modules.rutinas}
                                onValueChange={(val) =>
                                    setModules((prev) => ({ ...prev, rutinas: val }))
                                }
                            >
                                Rutinas de entrenamiento
                            </Switch>
                            <Switch
                                isSelected={modules.medidas}
                                onValueChange={(val) =>
                                    setModules((prev) => ({ ...prev, medidas: val }))
                                }
                            >
                                Medidas corporales y progreso
                            </Switch>
                            <Switch
                                isSelected={modules.reservas}
                                onValueChange={(val) =>
                                    setModules((prev) => ({ ...prev, reservas: val }))
                                }
                            >
                                Reservas de clases / horarios
                            </Switch>
                            <Switch
                                isSelected={modules.chat}
                                onValueChange={(val) =>
                                    setModules((prev) => ({ ...prev, chat: val }))
                                }
                            >
                                Chat con el gimnasio
                            </Switch>
                            <Switch
                                isSelected={modules.tienda}
                                onValueChange={(val) =>
                                    setModules((prev) => ({ ...prev, tienda: val }))
                                }
                            >
                                Tienda / venta de productos
                            </Switch>
                        </CardBody>
                    </Card>

                    {/* Notificaciones */}
                    <Card shadow="sm">
                        <CardHeader className="flex items-center gap-2">
                            <Icon icon="solar:bell-bing-bold-duotone" className="w-5 h-5" />
                            <div className="flex flex-col">
                                <p className="font-medium">Notificaciones push</p>
                                <p className="text-xs text-default-500">
                                    Define qué recordatorios puede recibir el cliente en su celular.
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="flex flex-col gap-3">
                            <Switch
                                isSelected={notifications.enabled}
                                onValueChange={(val) =>
                                    setNotifications((prev) => ({ ...prev, enabled: val }))
                                }
                            >
                                Activar notificaciones push
                            </Switch>

                            <div
                                className={`mt-1 flex flex-col gap-2 ${notifications.enabled ? "" : "opacity-50 pointer-events-none"
                                    }`}
                            >
                                <Switch
                                    isSelected={notifications.recordatorioPago}
                                    onValueChange={(val) =>
                                        setNotifications((prev) => ({
                                            ...prev,
                                            recordatorioPago: val,
                                        }))
                                    }
                                >
                                    Recordatorio de pago / renovación
                                </Switch>
                                <Switch
                                    isSelected={notifications.inactividad}
                                    onValueChange={(val) =>
                                        setNotifications((prev) => ({
                                            ...prev,
                                            inactividad: val,
                                        }))
                                    }
                                >
                                    Recordatorio por inactividad (si lleva días sin asistir)
                                </Switch>
                                <Switch
                                    isSelected={notifications.cumpleanios}
                                    onValueChange={(val) =>
                                        setNotifications((prev) => ({
                                            ...prev,
                                            cumpleanios: val,
                                        }))
                                    }
                                >
                                    Mensajes de cumpleaños
                                </Switch>
                            </div>

                            <Divider className="my-2" />

                            <p className="text-xs text-default-500">
                                La lógica de envío (cron jobs, triggers, etc.) debe implementarse en el
                                backend. Aquí solo se administran las preferencias.
                            </p>
                        </CardBody>
                        <CardFooter className="flex justify-end">
                            <Chip
                                size="sm"
                                startContent={
                                    <Icon icon="solar:info-circle-bold-duotone" className="w-3 h-3" />
                                }
                                variant="flat"
                            >
                                Módulo solo de configuración, no de envío directo.
                            </Chip>
                        </CardFooter>
                    </Card>
                </div>

                {/* Resumen rápido */}
                <Card shadow="sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:graph-up-bold-duotone" className="w-5 h-5" />
                            <div className="flex flex-col">
                                <p className="font-medium">Resumen rápido</p>
                                <p className="text-xs text-default-500">
                                    Idea de cómo podrías mostrar métricas de uso de la app móvil.
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="grid gap-3 md:grid-cols-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-default-500">Estado general</span>
                            <Chip
                                color={notifications.enabled ? "success" : "default"}
                                variant="flat"
                                startContent={
                                    <Icon
                                        icon={
                                            notifications.enabled
                                                ? "solar:check-circle-bold-duotone"
                                                : "solar:minus-circle-bold-duotone"
                                        }
                                        className="w-4 h-4"
                                    />
                                }
                            >
                                {notifications.enabled
                                    ? "Notificaciones activas"
                                    : "Notificaciones apagadas"}
                            </Chip>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-default-500">Módulos activos</span>
                            <p className="text-sm font-semibold">
                                {Object.values(modules).filter(Boolean).length} módulos
                            </p>
                            <p className="text-[11px] text-default-500">
                                Rutinas, medidas, reservas, chat, tienda
                            </p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-default-500">Acceso</span>
                            <p className="text-sm font-semibold">
                                {access.soloClientesActivos
                                    ? "Solo clientes activos"
                                    : "Todos los registrados"}
                            </p>
                            <p className="text-[11px] text-default-500">
                                Multi-dispositivo: {access.multiDispositivo ? "Sí" : "No"}
                            </p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-default-500">Colores actuales</span>
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-5 h-5 rounded-full border"
                                    style={{ backgroundColor: branding.colorPrimario }}
                                />
                                <span
                                    className="w-5 h-5 rounded-full border"
                                    style={{ backgroundColor: branding.colorSecundario }}
                                />
                            </div>
                            <p className="text-[11px] text-default-500 line-clamp-1">
                                {branding.colorPrimario} / {branding.colorSecundario}
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* MODAL: Vista rápida (referencial) */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" scrollBehavior="outside">
                <ModalContent>
                    {(close) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <span className="flex items-center gap-2">
                                    <Icon icon="solar:eye-bold-duotone" className="w-5 h-5" />
                                    Vista rápida de la app móvil
                                </span>
                                <span className="text-xs text-default-500">
                                    Esta es solo una referencia visual. No es la app real.
                                </span>
                            </ModalHeader>
                            <ModalBody className="flex justify-center">
                                <div className="flex justify-center w-full">
                                    <div className="relative">
                                        {/* Marco del “teléfono” */}
                                        <div className="w-72 h-[480px] rounded-[2.5rem] border border-default-200 shadow-lg bg-black/90 p-3 flex flex-col items-center">
                                            {/* Notch superior */}
                                            <div className="w-24 h-4 rounded-b-3xl bg-black mb-3" />

                                            {/* Pantalla */}
                                            <div className="w-full flex-1 rounded-3xl bg-default-50 overflow-hidden flex flex-col">
                                                {/* Header de la app */}
                                                <div
                                                    className="px-4 py-3 flex items-center gap-2"
                                                    style={{
                                                        background: branding.colorPrimario || "#2563EB",
                                                    }}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                                        {branding.urlLogo ? (
                                                            <div
                                                                className="w-full h-full bg-center bg-cover"
                                                                style={{
                                                                    backgroundImage: `url(${branding.urlLogo})`,
                                                                }}
                                                            />
                                                        ) : (
                                                            <Icon
                                                                icon="solar:dumbbell-large-bold-duotone"
                                                                className="w-5 h-5 text-white"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-white/80">
                                                            Tu gimnasio
                                                        </span>
                                                        <span className="text-sm font-semibold text-white">
                                                            {branding.nombreApp || "Nombre app"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Contenido principal */}
                                                <div className="flex-1 px-4 py-3 flex flex-col gap-3">
                                                    {/* Bloque de bienvenida */}
                                                    <div className="rounded-xl p-3 bg-white shadow-sm flex gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center">
                                                            <Icon
                                                                icon="solar:user-heart-bold-duotone"
                                                                className="w-5 h-5 text-default-700"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-default-700">
                                                                ¡Hola, atleta!
                                                            </p>
                                                            <p className="text-[11px] text-default-500 leading-tight line-clamp-3">
                                                                {branding.mensajeBienvenida ||
                                                                    "Mensaje de bienvenida..."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Accesos rápidos */}
                                                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div
                                                                className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                                                                style={{
                                                                    backgroundColor:
                                                                        branding.colorPrimario || "#2563EB",
                                                                }}
                                                            >
                                                                <Icon
                                                                    icon="solar:clipboard-list-bold-duotone"
                                                                    className="w-4 h-4"
                                                                />
                                                            </div>
                                                            <span className="text-default-600">Rutinas</span>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div
                                                                className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                                                                style={{
                                                                    backgroundColor:
                                                                        branding.colorSecundario || "#10B981",
                                                                }}
                                                            >
                                                                <Icon
                                                                    icon="solar:graph-up-bold-duotone"
                                                                    className="w-4 h-4"
                                                                />
                                                            </div>
                                                            <span className="text-default-600">Progreso</span>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-default-900 text-white">
                                                                <Icon
                                                                    icon="solar:calendar-bold-duotone"
                                                                    className="w-4 h-4"
                                                                />
                                                            </div>
                                                            <span className="text-default-600">Reservas</span>
                                                        </div>
                                                    </div>

                                                    {/* Tarjeta inferior de ejemplo */}
                                                    <Card shadow="sm" className="!p-0 border-none bg-default-100">
                                                        <CardBody className="px-3 py-2 flex flex-col gap-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] text-default-500">
                                                                    Próxima clase
                                                                </span>
                                                                <Chip size="sm" variant="flat" color="success">
                                                                    Hoy
                                                                </Chip>
                                                            </div>
                                                            <p className="text-xs font-semibold text-default-700">
                                                                Full Body – Nivel intermedio
                                                            </p>
                                                            <p className="text-[11px] text-default-500">
                                                                18:00 · Sala principal
                                                            </p>
                                                        </CardBody>
                                                    </Card>
                                                </div>

                                                {/* Barra inferior de navegación */}
                                                <div className="px-10 py-2 border-t border-default-200 bg-white flex items-center justify-between">
                                                    <Icon
                                                        icon="solar:home-angle-bold-duotone"
                                                        className="w-5 h-5 text-default-900"
                                                    />
                                                    <Icon
                                                        icon="solar:dumbbell-large-bold-duotone"
                                                        className="w-5 h-5 text-default-400"
                                                    />
                                                    <Icon
                                                        icon="solar:graph-up-bold-duotone"
                                                        className="w-5 h-5 text-default-400"
                                                    />
                                                    <Icon
                                                        icon="solar:user-circle-bold-duotone"
                                                        className="w-5 h-5 text-default-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button size="sm" variant="light" onPress={close}>
                                    Cerrar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
