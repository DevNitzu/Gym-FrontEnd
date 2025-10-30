"use client";
import React from "react";
import { Button, Card, CardBody, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiHorarioGimnasio } from "../../../../lib/types";
import { SHORT_DAY_LABELS, groupByDay, toHHMM } from "../../../../lib/utils";

export default function ListView({
    data, onEditHorario, onCreateForDay,
}: {
    data: ApiHorarioGimnasio[];
    onEditHorario: (h: ApiHorarioGimnasio) => void;
    onCreateForDay: (uiDay: number) => void;
}) {
    const grouped = groupByDay(data);

    return (
        <div className="space-y-2">
            {SHORT_DAY_LABELS.map((name, idx) => {
                const uiDay = idx + 1;
                const ranges = grouped.get(uiDay) || [];
                const hasOne = ranges.length >= 1;
                const main = ranges[0];

                return (
                    <Card key={uiDay} className="border-sm">
                        <CardBody className="py-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="font-semibold min-w-[72px]">{name}</div>
                                    {!hasOne ? (
                                        <Chip size="sm" color="danger" variant="flat">Sin horario</Chip>
                                    ) : (
                                        <div className="flex gap-2 flex-wrap">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                startContent={<Icon icon="solar:clock-circle-line-duotone" />}
                                                onPress={() => onEditHorario(main.raw)}
                                            >
                                                {toHHMM(main.open)}–{toHHMM(main.close)}
                                            </Button>
                                            {ranges.slice(1).map((r, i) => (
                                                <Button key={i} size="sm" variant="light"
                                                    startContent={<Icon icon="solar:warning-triangle-line-duotone" />}
                                                    onPress={() => onEditHorario(r.raw)}
                                                >
                                                    {toHHMM(r.open)}–{toHHMM(r.close)} (extra)
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {!hasOne ? (
                                    <Button size="sm" color="primary" variant="flat"
                                        startContent={<Icon icon="solar:add-circle-bold-duotone" />}
                                        onPress={() => onCreateForDay(uiDay)}>
                                        Definir horario
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="flat"
                                        startContent={<Icon icon="solar:pen-bold-duotone" />}
                                        onPress={() => onEditHorario(main.raw)}
                                    >
                                        Editar
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                );
            })}
        </div>
    );
}
