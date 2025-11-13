"use client";
import React from "react";
import { Divider, Badge, Card, CardBody, CardFooter, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import TimerUX from "./TimerUX";
import type { Screen, VisibleModules } from "./types";

export default function PhonePreview({
    screen, visible, height, width,
}: { screen: Screen; visible: VisibleModules; height: number; width: number; }) {
    return (
        <div className="relative rounded-[2rem] border bg-background shadow-2xl overflow-hidden"
            style={{ height, width }}>
            <div className="h-6 bg-default-100 flex items-center justify-center text-[10px]">
                FitnessClub App — Vista previa
            </div>

            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                        <Icon icon="solar:dumbbell-bold" />
                    </span>
                    <div className="text-sm font-semibold">FitnessClub</div>
                </div>
                {visible.notifications && <Icon icon="solar:bell-bing-bold-duotone" className="opacity-70" />}
            </div>

            <Divider />
            <div className="p-4 space-y-3 text-sm">
                {screen === "home" && (
                    <>
                        {visible.feed && (
                            <Card className="border">
                                <CardBody className="space-y-2">
                                    <div className="font-semibold">Tu próxima clase</div>
                                    <div className="text-foreground-500 text-xs">Hoy 18:00 · HIIT con Daniel</div>
                                    <Button size="sm" variant="flat" color="primary" className="w-full">Ver detalles</Button>
                                </CardBody>
                            </Card>
                        )}
                        {visible.routines && (
                            <Card className="border">
                                <CardBody>
                                    <div className="font-semibold mb-1">Recomendado</div>
                                    <div className="text-xs text-foreground-500">“Full Body” · 30 min</div>
                                </CardBody>
                                <CardFooter className="justify-end">
                                    <Button size="sm" variant="flat" startContent={<Icon icon="solar:play-bold" />}>Iniciar</Button>
                                </CardFooter>
                            </Card>
                        )}
                        {visible.messages && (
                            <Card className="border">
                                <CardBody className="space-y-2">
                                    <Badge color="secondary" variant="flat">Mensaje</Badge>
                                    <div className="font-semibold">Bienvenida a FitnessClub</div>
                                    <p className="text-xs text-foreground-500">Explora rutinas y recibe recordatorios.</p>
                                </CardBody>
                            </Card>
                        )}
                    </>
                )}

                {screen === "message" && visible.messages && (
                    <Card className="border">
                        <CardBody className="space-y-2">
                            <Badge color="secondary" variant="flat">Mensaje</Badge>
                            <div className="font-semibold">Bienvenida a FitnessClub</div>
                            <p className="text-xs text-foreground-500">Gracias por unirte.</p>
                            <Button size="sm" color="primary" className="w-full">Ver rutinas</Button>
                        </CardBody>
                    </Card>
                )}

                {screen === "routine" && visible.routines && (
                    <Card className="border">
                        <CardBody className="space-y-2">
                            <div className="font-semibold">Full Body</div>
                            <div className="text-xs text-foreground-500">8 sesiones · 30 min · Básico</div>
                            <ul className="text-xs list-disc pl-4 space-y-1">
                                <li>Calentamiento 5 min</li>
                                <li>Sentadillas · Flexiones · Remo</li>
                                <li>Estiramiento 5 min</li>
                            </ul>
                            <Button size="sm" color="primary" className="w-full" startContent={<Icon icon="solar:play-bold" />}>
                                Comenzar sesión 1
                            </Button>
                        </CardBody>
                    </Card>
                )}

                {screen === "timer" && visible.timer && <TimerUX />}
            </div>
        </div>
    );
}
