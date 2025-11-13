"use client";

import React from "react";
import { Card, CardBody, CardHeader, Button, Chip, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";

/** ---------- Helpers ---------- */
function formatMs(ms: number) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10); // centésimas (00–99) para lectura clara
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(cs).padStart(2, "0")}`;
}

/** Hook de cronómetro con alta precisión (RAF) */
function useStopwatch() {
    const [running, setRunning] = React.useState(false);
    const [elapsed, setElapsed] = React.useState(0); // ms totales
    const startRef = React.useRef(0);   // timestamp base (performance.now())
    const rafRef = React.useRef<number | null>(null);

    const tick = React.useCallback(() => {
        const now = performance.now();
        setElapsed(now - startRef.current);
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    const start = React.useCallback(() => {
        if (running) return;
        startRef.current = performance.now() - elapsed; // reanudar conservando tiempo
        setRunning(true);
        rafRef.current = requestAnimationFrame(tick);
    }, [elapsed, running, tick]);

    const pause = React.useCallback(() => {
        if (!running) return;
        setRunning(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        // setElapsed ya quedó actualizado en el último frame
    }, [running]);

    const reset = React.useCallback(() => {
        setRunning(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setElapsed(0);
    }, []);

    React.useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return { running, elapsed, start, pause, reset, setElapsed };
}

/** ---------- Reloj analógico (SVG) ---------- */
function AnalogFace({ ms }: { ms: number }) {
    // Ángulos (grados)
    const seconds = (ms / 1000) % 60;
    const minutes = (ms / 60000) % 60;
    const aSec = seconds * 6;              // 360 / 60
    const aMin = minutes * 6;              // 360 / 60
    const aMs = ((ms % 1000) / 1000) * 360; // barrido dentro del segundo

    const size = 220;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;

    // Marca de minutos/segundos
    const ticks = Array.from({ length: 60 }, (_, i) => i);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
            {/* Bisel / cara */}
            <defs>
                <radialGradient id="face" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="rgba(255,255,255,.95)" />
                    <stop offset="100%" stopColor="rgba(230,230,235,.95)" />
                </radialGradient>
            </defs>

            <circle cx={cx} cy={cy} r={r + 6} fill="url(#face)" stroke="rgba(0,0,0,.08)" />
            <circle cx={cx} cy={cy} r={r} fill="white" stroke="rgba(0,0,0,.08)" />

            {/* Ticks */}
            {ticks.map((i) => {
                const angle = (i * Math.PI) / 30; // i*6°
                const outer = r - 6;
                const inner = i % 5 === 0 ? outer - 10 : outer - 5;
                const x1 = cx + outer * Math.sin(angle);
                const y1 = cy - outer * Math.cos(angle);
                const x2 = cx + inner * Math.sin(angle);
                const y2 = cy - inner * Math.cos(angle);
                return (
                    <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="currentColor"
                        strokeWidth={i % 5 === 0 ? 2.2 : 1}
                        opacity={0.6}
                    />
                );
            })}

            {/* Aguja de minutos */}
            <g transform={`rotate(${aMin} ${cx} ${cy})`}>
                <rect
                    x={cx - 3}
                    y={cy - (r - 40)}
                    width={6}
                    height={r - 60}
                    rx={3}
                    fill="#2b2b2f"
                    opacity={0.85}
                />
            </g>

            {/* Aguja de segundos (barrido continuo) */}
            <g transform={`rotate(${aSec} ${cx} ${cy})`}>
                <rect x={cx - 1} y={cy - (r - 18)} width={2} height={r - 30} fill="#6c4dd7" />
                {/* contrapeso */}
                <circle cx={cx} cy={cy + 18} r={3.8} fill="#6c4dd7" opacity={0.9} />
            </g>

            {/* Aguja de milisegundos (fina, brillante) */}
            <g transform={`rotate(${aMs} ${cx} ${cy})`}>
                <rect x={cx - 0.7} y={cy - (r - 10)} width={1.4} height={r - 20} fill="#d74d6c" />
            </g>

            {/* Centro */}
            <circle cx={cx} cy={cy} r={4.5} fill="#1f1f22" />
            <circle cx={cx} cy={cy} r={2} fill="#ffffff" />
        </svg>
    );
}

/** ---------- Componente principal ---------- */
type Lap = { id: number; splitMs: number; totalMs: number };

export default function TimerUX() {
    const { running, elapsed, start, pause, reset } = useStopwatch();
    const [laps, setLaps] = React.useState<Lap[]>([]);

    // Agregar bandera (vuelta)
    const addLap = React.useCallback(() => {
        const prevTotal = laps.length ? laps[laps.length - 1].totalMs : 0;
        const split = elapsed - prevTotal;
        setLaps((ls) => [...ls, { id: ls.length + 1, splitMs: split, totalMs: elapsed }]);
    }, [elapsed, laps]);

    const clearLaps = () => setLaps([]);

    // Digital (mm:ss:cc)
    const digital = formatMs(elapsed);

    // Info de mejores/peores vueltas (si ≥2)
    const splitValues = laps.map((l) => l.splitMs);
    const best = splitValues.length ? Math.min(...splitValues) : null;
    const worst = splitValues.length ? Math.max(...splitValues) : null;

    return (
        <Card className="border bg-default-50">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:timer-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Cronómetro mecánico</span>
                    <Chip size="sm" variant="flat" className="ml-2">ms</Chip>
                </div>
                <div className="text-xs text-foreground-500">Lap/Flag con centésimas</div>
            </CardHeader>

            <CardBody className="flex flex-col items-center gap-4">
                {/* Analógico */}
                <AnalogFace ms={elapsed} />

                {/* Digital */}
                <div className="text-4xl md:text-5xl font-bold tabular-nums tracking-widest">
                    {digital}
                </div>

                {/* Controles */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {running ? (
                        <Button color="default" startContent={<Icon icon="solar:pause-bold" />} onPress={pause}>
                            Pausar
                        </Button>
                    ) : (
                        <Button color="primary" startContent={<Icon icon="solar:play-bold" />} onPress={start}>
                            Iniciar
                        </Button>
                    )}

                    <Button
                        variant="flat"
                        startContent={<Icon icon="solar:flag-2-bold-duotone" />}
                        onPress={addLap}
                        isDisabled={!running}
                    >
                        Bandera
                    </Button>

                    <Button
                        variant="flat"
                        startContent={<Icon icon="solar:restart-bold-duotone" />}
                        onPress={() => {
                            reset();
                            clearLaps();
                        }}
                    >
                        Reiniciar
                    </Button>
                </div>

                {/* Laps */}
                {!!laps.length && (
                    <>
                        <Divider className="my-2 w-full" />
                        <div className="w-full max-w-md">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="text-sm font-semibold">Vueltas</div>
                                <div className="flex items-center gap-2 text-xs">
                                    {best !== null && <Chip size="sm" color="success" variant="flat">Mejor {formatMs(best)}</Chip>}
                                    {worst !== null && <Chip size="sm" color="danger" variant="flat">Peor {formatMs(worst)}</Chip>}
                                </div>
                            </div>

                            <div className="rounded-xl border divide-y">
                                {[...laps].reverse().map((lap) => {
                                    const isBest = best !== null && lap.splitMs === best && laps.length > 1;
                                    const isWorst = worst !== null && lap.splitMs === worst && laps.length > 1;
                                    return (
                                        <div
                                            key={lap.id}
                                            className="flex items-center justify-between px-3 py-2 text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Chip size="sm" variant="flat">#{lap.id}</Chip>
                                                <span className="tabular-nums">{formatMs(lap.totalMs)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isBest && <Icon icon="solar:star-bold-duotone" className="text-success" />}
                                                {isWorst && <Icon icon="solar:danger-triangle-bold-duotone" className="text-danger" />}
                                                <span className="tabular-nums text-foreground-500">(+{formatMs(lap.splitMs)})</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-2 flex justify-end">
                                <Button size="sm" variant="light" onPress={clearLaps} startContent={<Icon icon="solar:trash-bin-2-bold" />}>
                                    Borrar vueltas
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
}
