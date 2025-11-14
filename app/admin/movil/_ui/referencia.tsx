"use client";

import React from "react";
import { Card, CardHeader, CardBody, Divider, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function VistaRapidaAppMovilPage(): React.JSX.Element {
    const nombreApp = "Gimnasio Titanes";
    const mensajeBienvenida =
        "¡Bienvenido a tu gimnasio! Revisa tus rutinas, tu progreso y reserva tus clases desde aquí.";
    const colorPrimario = "#2563EB";
    const colorSecundario = "#10B981";
    const logoUrl = ""; // si quieres, luego lo cambias por una URL real

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-default-50">
            <div className="w-full max-w-4xl flex flex-col gap-4">
                {/* Título */}
                <header className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
                        <Icon icon="solar:smartphone-2-bold-duotone" className="w-7 h-7" />
                        Vista rápida (referencial)
                    </h1>
                    <p className="text-sm text-default-500">
                        Esto solo es una vista previa de cómo se vería la pantalla principal de la app móvil del gimnasio.
                        No es la app real, solo el diseño referencial.
                    </p>
                </header>

                {/* Contenedor principal */}
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start md:justify-center mt-2">
                    {/* Tarjeta de info/resumen */}
                    <Card shadow="sm" className="w-full md:max-w-sm">
                        <CardHeader className="flex items-center gap-2">
                            <Icon icon="solar:info-circle-bold-duotone" className="w-5 h-5" />
                            <div className="flex flex-col">
                                <p className="font-medium">Detalles de esta vista previa</p>
                                <p className="text-xs text-default-500">
                                    Puedes usar este diseño como referencia para tu app móvil o para mostrar al cliente cómo se verá.
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="flex flex-col gap-3 text-sm">
                            <div>
                                <p className="text-xs text-default-500">Nombre de la app</p>
                                <p className="font-semibold">{nombreApp}</p>
                            </div>
                            <div>
                                <p className="text-xs text-default-500">Mensaje de bienvenida</p>
                                <p className="text-default-600">{mensajeBienvenida}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-xs text-default-500">Colores</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <span
                                            className="w-5 h-5 rounded-full border"
                                            style={{ backgroundColor: colorPrimario }}
                                        />
                                        <span className="text-[11px] text-default-500">
                                            Primario: {colorPrimario}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span
                                            className="w-5 h-5 rounded-full border"
                                            style={{ backgroundColor: colorSecundario }}
                                        />
                                        <span className="text-[11px] text-default-500">
                                            Secundario: {colorSecundario}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Divider className="my-2" />

                            <div className="flex flex-wrap gap-2">
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    startContent={
                                        <Icon icon="solar:eye-bold-duotone" className="w-4 h-4" />
                                    }
                                >
                                    Solo vista referencial
                                </Chip>
                                <Chip size="sm" variant="flat">
                                    No funcional
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Mock del teléfono / app */}
                    <div className="flex justify-center w-full md:w-auto">
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
                                        style={{ background: colorPrimario }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                            {logoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={logoUrl}
                                                    alt="Logo"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Icon
                                                    icon="solar:dumbbell-large-bold-duotone"
                                                    className="w-5 h-5 text-white"
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white/80">Tu gimnasio</span>
                                            <span className="text-sm font-semibold text-white">
                                                {nombreApp}
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
                                                    {mensajeBienvenida}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Accesos rápidos */}
                                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                                            <div className="flex flex-col items-center gap-1">
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                                                    style={{ backgroundColor: colorPrimario }}
                                                >
                                                    <Icon icon="solar:clipboard-list-bold-duotone" className="w-4 h-4" />
                                                </div>
                                                <span className="text-default-600">Rutinas</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                                                    style={{ backgroundColor: colorSecundario }}
                                                >
                                                    <Icon icon="solar:graph-up-bold-duotone" className="w-4 h-4" />
                                                </div>
                                                <span className="text-default-600">Progreso</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-default-900 text-white">
                                                    <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4" />
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
                </div>
            </div>
        </div>
    );
}
