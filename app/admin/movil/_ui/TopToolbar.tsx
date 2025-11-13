"use client";
import React from "react";
import { Button, Input, Slider } from "@heroui/react";
import { useMobile } from "./useMobilePreviewStore";
import type { Screen } from "./types";

export default function TopToolbar() {
    const { state, setScreen, setPhone } = useMobile();
    const screens: Screen[] = ["home", "message", "routine", "timer"];
    return (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
            <div className="mx-auto max-w-[1200px] px-4 py-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Pantalla</span>
                    <div className="flex flex-wrap gap-2">
                        {screens.map(s => (
                            <Button key={s} size="sm" variant={state.screen === s ? "solid" : "flat"} onPress={() => setScreen(s)}>
                                {s}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">Tamaño</span>
                    <Input size="sm" className="w-24" labelPlacement="outside-left" label="Ancho"
                        type="number" value={String(state.phone.w)}
                        onValueChange={(v) => setPhone({ w: Number(v || 0) })} />
                    <Input size="sm" className="w-24" labelPlacement="outside-left" label="Alto"
                        type="number" value={String(state.phone.h)}
                        onValueChange={(v) => setPhone({ h: Number(v || 0) })} />
                    <span className="font-medium text-sm hidden md:block">Zoom</span>
                    <Slider aria-label="Zoom" value={state.phone.zoom} minValue={70} maxValue={130}
                        onChange={(v) => setPhone({ zoom: v as number })} className="w-40 hidden md:block" />
                    <div className="tabular-nums text-sm hidden md:block">{state.phone.zoom}%</div>
                </div>
            </div>
        </div>
    );
}
