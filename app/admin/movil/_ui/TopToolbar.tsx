"use client";

import React from "react";
import { Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMobile } from "./useMobilePreviewStore";

const SCREENS = [
    { key: "home", label: "Inicio" },
    { key: "message", label: "Mensajes" },
    { key: "routine", label: "Rutinas" },
    { key: "timer", label: "Cronómetro" },
];

export default function TopToolbar() {
    const { state, setScreen } = useMobile();
    const { screen, phone } = state;

    return (
        <div className="w-full border-b bg-background/80 backdrop-blur px-4 sm:px-6 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Pantalla actual */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-foreground-500">Pantalla</span>
                <div className="inline-flex rounded-full bg-default-100 p-1">
                    {SCREENS.map((s) => (
                        <Button
                            key={s.key}
                            size="sm"
                            radius="full"
                            variant={screen === s.key ? "solid" : "light"}
                            color={screen === s.key ? "primary" : "default"}
                            className="px-3 text-xs"
                            onPress={() => setScreen(s.key as any)}
                        >
                            {s.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Tamaño y zoom */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-foreground-500">
                    <Icon icon="solar:tablet-bold-duotone" className="text-base" />
                    Tamaño
                </span>
                <span>
                    Ancho{" "}
                    <Chip size="sm" variant="flat">
                        {phone.w}
                    </Chip>
                </span>
                <span>
                    Alto{" "}
                    <Chip size="sm" variant="flat">
                        {phone.h}
                    </Chip>
                </span>
            </div>
        </div>
    );
}
