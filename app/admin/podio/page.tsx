"use client";

import React from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Divider,
    Chip,
    Avatar,
    Progress,
} from "@heroui/react";
import { Icon } from "@iconify/react";

type LiftType = "peso_muerto" | "sentadilla" | "press_banca" | "total";

interface ParticipantRanking {
    id: string;
    nombre: string;
    avatarIniciales: string;
    posicion: number; // posición general
    levantadoKg: number;
    liftPrincipal: LiftType;
    completadoPorcentaje: number;
    retoNombre: string;
}

function getLiftLabel(lift: LiftType): string {
    switch (lift) {
        case "peso_muerto":
            return "Peso muerto";
        case "sentadilla":
            return "Sentadilla";
        case "press_banca":
            return "Press banca";
        case "total":
            return "Total (3 levantamientos)";
        default:
            return "Levantamiento";
    }
}

export default function PodioFuerzaPage(): React.JSX.Element {
    // MOCK: Podio de ranking, enfocado a pesas
    const [participants] = React.useState<ParticipantRanking[]>([
        {
            id: "u1",
            nombre: "Carlos Herrera",
            avatarIniciales: "CH",
            posicion: 1,
            levantadoKg: 420,
            liftPrincipal: "total",
            completadoPorcentaje: 100,
            retoNombre: "Total de levantamientos (3RM)",
        },
        {
            id: "u2",
            nombre: "María López",
            avatarIniciales: "ML",
            posicion: 2,
            levantadoKg: 380,
            liftPrincipal: "sentadilla",
            completadoPorcentaje: 92,
            retoNombre: "Reto Sentadilla Profunda",
        },
        {
            id: "u3",
            nombre: "José Ramírez",
            avatarIniciales: "JR",
            posicion: 3,
            levantadoKg: 350,
            liftPrincipal: "peso_muerto",
            completadoPorcentaje: 88,
            retoNombre: "Peso muerto pesado",
        },
        {
            id: "u4",
            nombre: "Ana Torres",
            avatarIniciales: "AT",
            posicion: 4,
            levantadoKg: 310,
            liftPrincipal: "press_banca",
            completadoPorcentaje: 80,
            retoNombre: "Press banca avanzado",
        },
        {
            id: "u5",
            nombre: "Luis Pérez",
            avatarIniciales: "LP",
            posicion: 5,
            levantadoKg: 295,
            liftPrincipal: "total",
            completadoPorcentaje: 75,
            retoNombre: "Fuerza total",
        },
    ]);

    const podiumTop3 = participants.slice(0, 3);

    // Dividir por categorías (ranking interno por kg)
    const categoryOrder: LiftType[] = ["total", "peso_muerto", "sentadilla", "press_banca"];

    const participantsByCategory: Record<LiftType, ParticipantRanking[]> = {
        total: [],
        peso_muerto: [],
        sentadilla: [],
        press_banca: [],
    };

    for (const p of participants) {
        participantsByCategory[p.liftPrincipal].push(p);
    }

    categoryOrder.forEach((cat) => {
        participantsByCategory[cat].sort((a, b) => b.levantadoKg - a.levantadoKg);
    });

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6 max-w-6xl mx-auto">
            {/* Header */}
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Icon icon="solar:trophy-star-bold-duotone" className="w-7 h-7" />
                        Podio de Fuerza
                    </h1>
                    <p className="text-sm text-default-500">
                        Ranking de los atletas con más kilos levantados en los retos de pesas
                        (peso muerto, sentadilla, press banca o total).
                    </p>
                </div>
                <Chip
                    size="sm"
                    variant="flat"
                    startContent={
                        <Icon icon="solar:dumbbell-large-bold-duotone" className="w-4 h-4" />
                    }
                >
                    Ranking de pesas
                </Chip>
            </header>

            {/* Card principal */}
            <Card shadow="sm" className="border border-default-200">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:ranking-bold-duotone" className="w-6 h-6" />
                        <div className="flex flex-col">
                            <p className="font-medium text-sm">Top levantadores (general)</p>
                            <p className="text-[11px] text-default-500">
                                El podio muestra a los 3 primeros lugares generales. Abajo verás el
                                ranking dividido por categorías de levantamiento.
                            </p>
                        </div>
                    </div>
                    <Chip size="sm" variant="flat">
                        Participantes: {participants.length}
                    </Chip>
                </CardHeader>
                <Divider />
                <CardBody className="flex flex-col gap-5">
                    {/* Podio visual mejorado */}
                    <div className="flex justify-center">
                        <div className="grid grid-cols-3 gap-4 items-end max-w-xl w-full">
                            {/* 2° lugar (izquierda) */}
                            {podiumTop3[1] && (
                                <PodiumColumn
                                    participant={podiumTop3[1]}
                                    size="md"
                                    variant="silver"
                                />
                            )}

                            {/* 1° lugar (centro) */}
                            {podiumTop3[0] && (
                                <PodiumColumn
                                    participant={podiumTop3[0]}
                                    size="lg"
                                    variant="gold"
                                    isChampion
                                />
                            )}

                            {/* 3° lugar (derecha) */}
                            {podiumTop3[2] && (
                                <PodiumColumn
                                    participant={podiumTop3[2]}
                                    size="sm"
                                    variant="bronze"
                                />
                            )}
                        </div>
                    </div>

                    <Divider className="my-1" />

                    {/* Ranking por categorías */}
                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-default-500 flex items-center gap-1">
                            <Icon
                                icon="solar:widget-6-bold-duotone"
                                className="w-4 h-4 text-default-500"
                            />
                            Ranking por categoría de levantamiento
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categoryOrder.map((cat) => {
                                const list = participantsByCategory[cat];
                                if (list.length === 0) return null;

                                const top3Cat = list.slice(0, 3);

                                return (
                                    <Card
                                        key={cat}
                                        shadow="none"
                                        className="border border-default-200 bg-default-50/70"
                                    >
                                        <CardHeader className="flex items-center justify-between gap-2 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center">
                                                    <Icon
                                                        icon="solar:dumbbell-large-bold-duotone"
                                                        className="w-4 h-4"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-xs font-semibold">
                                                        {getLiftLabel(cat)}
                                                    </p>
                                                    <p className="text-[11px] text-default-500">
                                                        Top por kilos levantados en esta categoría.
                                                    </p>
                                                </div>
                                            </div>
                                            <Chip size="sm" variant="flat">
                                                {list.length} atletas
                                            </Chip>
                                        </CardHeader>
                                        <Divider />
                                        <CardBody className="flex flex-col gap-2 py-3">
                                            {top3Cat.map((p, idx) => (
                                                <div
                                                    key={p.id}
                                                    className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm"
                                                >
                                                    <div className="flex flex-col items-center w-6">
                                                        <span className="text-[11px] font-semibold text-default-500">
                                                            #{idx + 1}
                                                        </span>
                                                    </div>
                                                    <Avatar name={p.avatarIniciales} size="sm" />
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-xs font-semibold line-clamp-1">
                                                                {p.nombre}
                                                            </span>
                                                            <span className="text-[11px] text-default-500 flex items-center gap-1">
                                                                <Icon
                                                                    icon="solar:dumbbell-large-bold-duotone"
                                                                    className="w-3 h-3"
                                                                />
                                                                {p.levantadoKg} kg
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-default-500 line-clamp-1">
                                                            {p.retoNombre}
                                                        </span>
                                                        <Progress
                                                            size="sm"
                                                            value={p.completadoPorcentaje}
                                                            aria-label="Progreso del reto"
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            {list.length > 3 && (
                                                <p className="mt-1 text-[11px] text-default-500">
                                                    + {list.length - 3} atletas más en esta
                                                    categoría.
                                                </p>
                                            )}
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

/* ---- Subcomponente: Columna del podio (top 3 general) ---- */

interface PodiumColumnProps {
    participant: ParticipantRanking;
    size: "lg" | "md" | "sm";
    variant: "gold" | "silver" | "bronze";
    isChampion?: boolean;
}

function PodiumColumn({
    participant,
    size,
    variant,
    isChampion,
}: PodiumColumnProps): React.JSX.Element {
    const heightMap: Record<typeof size, string> = {
        lg: "h-40",
        md: "h-32",
        sm: "h-28",
    };

    const gradientMap: Record<typeof variant, string> = {
        gold: "bg-gradient-to-t from-yellow-500 via-yellow-400 to-amber-200",
        silver: "bg-gradient-to-t from-slate-400 via-slate-300 to-slate-100",
        bronze: "bg-gradient-to-t from-amber-800 via-amber-600 to-amber-400",
    };

    const ringClass =
        variant === "gold"
            ? "ring-4 ring-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.7)]"
            : variant === "silver"
                ? "ring-2 ring-slate-300"
                : "ring-2 ring-amber-500";

    return (
        <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative">
                <Avatar
                    name={participant.avatarIniciales}
                    className={`w-14 h-14 ${ringClass}`}
                />
                {isChampion && (
                    <span className="absolute -top-4 -right-3">
                        <Icon
                            icon="solar:crown-bold-duotone"
                            className="w-7 h-7 text-yellow-400 drop-shadow-lg"
                        />
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold">{participant.nombre}</span>
                <span className="text-[11px] text-default-500">
                    {getLiftLabel(participant.liftPrincipal)}
                </span>
                <span className="text-[11px] font-semibold flex items-center justify-center gap-1">
                    <Icon
                        icon="solar:dumbbell-large-bold-duotone"
                        className="w-4 h-4"
                    />
                    {participant.levantadoKg} kg
                </span>
            </div>

            <div
                className={`w-full rounded-t-2xl ${gradientMap[variant]} flex items-end justify-center ${heightMap[size]} shadow-lg`}
            >
                <span className="mb-2 text-xs font-bold text-white drop-shadow-sm">
                    #{participant.posicion}
                </span>
            </div>
        </div>
    );
}
