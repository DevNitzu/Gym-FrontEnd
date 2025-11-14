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
    Select,
    SelectItem,
    Switch,
    Chip,
    Divider,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableColumn,
    TableCell,
    Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";

type ChallengeType = "asistencia" | "clases" | "rutina" | "medidas";
type RewardType = "puntos" | "dias_extra" | "cupon" | "otro";
type ChallengeStatus = "activo" | "programado" | "finalizado";

interface Challenge {
    id: string;
    nombre: string;
    tipo: ChallengeType;
    metaValor: number;
    unidad: string;
    fechaInicio: string;
    fechaFin: string;
    recompensaTipo: RewardType;
    recompensaValor: string;
    mostrarEnApp: boolean;
    enviarNotificacion: boolean;
    mensajeNotificacion: string;
    estado: ChallengeStatus;
    createdAt: string;
}

interface FormState {
    nombre: string;
    tipo: ChallengeType;
    metaValor: string;
    unidad: string;
    fechaInicio: string;
    fechaFin: string;
    recompensaTipo: RewardType;
    recompensaValor: string;
    mostrarEnApp: boolean;
    enviarNotificacion: boolean;
    mensajeNotificacion: string;
}

const initialForm: FormState = {
    nombre: "",
    tipo: "asistencia",
    metaValor: "3",
    unidad: "asistencias",
    fechaInicio: "",
    fechaFin: "",
    recompensaTipo: "puntos",
    recompensaValor: "50",
    mostrarEnApp: true,
    enviarNotificacion: true,
    mensajeNotificacion: "Esta semana, si cumples el reto, ganas una recompensa extra 💪",
};

function inferUnidad(tipo: ChallengeType): string {
    switch (tipo) {
        case "asistencia":
            return "asistencias";
        case "clases":
            return "clases";
        case "rutina":
            return "rutinas completadas";
        case "medidas":
            return "actualizaciones de medidas";
        default:
            return "acciones";
    }
}

function computeEstado(fechaInicio: string, fechaFin: string): ChallengeStatus {
    if (!fechaInicio || !fechaFin) return "activo";
    const today = new Date();
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);

    if (end < today) return "finalizado";
    if (start > today) return "programado";
    return "activo";
}

export default function RetosPage(): React.JSX.Element {
    const [form, setForm] = React.useState<FormState>(initialForm);
    const [challenges, setChallenges] = React.useState<Challenge[]>([
        {
            id: "1",
            nombre: "Reto Asistencia Semanal",
            tipo: "asistencia",
            metaValor: 3,
            unidad: "asistencias",
            fechaInicio: "2025-11-10",
            fechaFin: "2025-11-17",
            recompensaTipo: "puntos",
            recompensaValor: "100",
            mostrarEnApp: true,
            enviarNotificacion: true,
            mensajeNotificacion:
                "Ven 3 veces esta semana y gana 100 puntos para canjear en el gym 🔥",
            estado: "activo",
            createdAt: "2025-11-10",
        },
        {
            id: "2",
            nombre: "10 clases de spinning",
            tipo: "clases",
            metaValor: 10,
            unidad: "clases",
            fechaInicio: "2025-11-01",
            fechaFin: "2025-11-30",
            recompensaTipo: "dias_extra",
            recompensaValor: "3 días extra de membresía",
            mostrarEnApp: true,
            enviarNotificacion: false,
            mensajeNotificacion: "",
            estado: "programado",
            createdAt: "2025-11-01",
        },
    ]);

    const [creating, setCreating] = React.useState(false);

    function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleTipoChange(tipo: ChallengeType) {
        const unidadInferida = inferUnidad(tipo);
        setForm((prev) => ({
            ...prev,
            tipo,
            unidad: unidadInferida,
        }));
    }

    function resetForm() {
        setForm({
            ...initialForm,
            tipo: form.tipo,
            unidad: inferUnidad(form.tipo),
        });
    }

    async function handleCreateChallenge(e: React.FormEvent) {
        e.preventDefault();
        if (!form.nombre.trim()) return;

        const meta = parseInt(form.metaValor || "0", 10);
        if (Number.isNaN(meta) || meta <= 0) return;

        try {
            setCreating(true);

            const now = new Date();
            const newChallenge: Challenge = {
                id: `${Date.now()}`,
                nombre: form.nombre.trim(),
                tipo: form.tipo,
                metaValor: meta,
                unidad: form.unidad || inferUnidad(form.tipo),
                fechaInicio: form.fechaInicio || now.toISOString().slice(0, 10),
                fechaFin:
                    form.fechaFin ||
                    new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .slice(0, 10),
                recompensaTipo: form.recompensaTipo,
                recompensaValor: form.recompensaValor.trim() || "Recompensa",
                mostrarEnApp: form.mostrarEnApp,
                enviarNotificacion: form.enviarNotificacion,
                mensajeNotificacion: form.enviarNotificacion
                    ? form.mensajeNotificacion.trim()
                    : "",
                estado: computeEstado(form.fechaInicio, form.fechaFin),
                createdAt: now.toISOString().slice(0, 10),
            };

            // TODO: enviar a tu API aquí
            setChallenges((prev) => [newChallenge, ...prev]);
            resetForm();
        } catch (error) {
            console.error("Error creando reto:", error);
        } finally {
            setCreating(false);
        }
    }

    function getEstadoChip(estado: ChallengeStatus) {
        const map: Record<
            ChallengeStatus,
            { color: "success" | "warning" | "default"; label: string }
        > = {
            activo: { color: "success", label: "Activo" },
            programado: { color: "warning", label: "Programado" },
            finalizado: { color: "default", label: "Finalizado" },
        };

        const data = map[estado];
        return (
            <Chip
                size="sm"
                variant="flat"
                color={data.color}
                startContent={
                    <Icon
                        icon={
                            estado === "activo"
                                ? "solar:lightning-bold-duotone"
                                : estado === "programado"
                                    ? "solar:calendar-bold-duotone"
                                    : "solar:archive-bold-duotone"
                        }
                        className="w-3 h-3"
                    />
                }
            >
                {data.label}
            </Chip>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6 max-w-6xl mx-auto">
            {/* Header */}
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Icon icon="solar:trophy-bold-duotone" className="w-7 h-7" />
                        Retos y Recompensas
                    </h1>
                    <p className="text-sm text-default-500">
                        Crea retos para incentivar el uso de la app y la asistencia al gimnasio.
                    </p>
                </div>
                <Chip
                    size="sm"
                    variant="flat"
                    startContent={
                        <Icon icon="solar:gamepad-minimalistic-bold-duotone" className="w-4 h-4" />
                    }
                >
                    Módulo de gamificación
                </Chip>
            </header>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Formulario de creación */}
                <Card shadow="sm" className="lg:col-span-1">
                    <CardHeader className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:add-circle-bold-duotone" className="w-5 h-5" />
                            <div className="flex flex-col">
                                <p className="font-medium text-sm">Nuevo reto</p>
                                <p className="text-[11px] text-default-500">
                                    Define el objetivo, fechas y recompensa.
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <form className="flex flex-col gap-3" onSubmit={handleCreateChallenge}>
                            <Input
                                label="Nombre del reto"
                                placeholder="Ej: Reto Asistencia Semanal"
                                value={form.nombre}
                                onChange={(e) => handleChange("nombre", e.target.value)}
                                isRequired
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Tipo de reto"
                                    selectedKeys={[form.tipo]}
                                    onChange={(e) =>
                                        handleTipoChange(e.target.value as ChallengeType)
                                    }
                                >
                                    <SelectItem key="asistencia">Asistencia al gym</SelectItem>
                                    <SelectItem key="clases">Número de clases</SelectItem>
                                    <SelectItem key="rutina">Rutinas completadas</SelectItem>
                                    <SelectItem key="medidas">Actualización de medidas</SelectItem>
                                </Select>
                                <Input
                                    type="number"
                                    label="Meta"
                                    placeholder="Ej: 3"
                                    value={form.metaValor}
                                    onChange={(e) => handleChange("metaValor", e.target.value)}
                                    min={1}
                                />
                            </div>

                            <Input
                                label="Unidad"
                                placeholder="Ej: asistencias, clases..."
                                value={form.unidad}
                                onChange={(e) => handleChange("unidad", e.target.value)}
                                description="Texto que se mostrará al usuario (ej: 3 asistencias)."
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    type="date"
                                    label="Fecha inicio"
                                    value={form.fechaInicio}
                                    onChange={(e) => handleChange("fechaInicio", e.target.value)}
                                />
                                <Input
                                    type="date"
                                    label="Fecha fin"
                                    value={form.fechaFin}
                                    onChange={(e) => handleChange("fechaFin", e.target.value)}
                                />
                            </div>

                            <Divider className="my-1" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Tipo de recompensa"
                                    selectedKeys={[form.recompensaTipo]}
                                    onChange={(e) =>
                                        handleChange(
                                            "recompensaTipo",
                                            e.target.value as RewardType,
                                        )
                                    }
                                >
                                    <SelectItem key="puntos">Puntos</SelectItem>
                                    <SelectItem key="dias_extra">Días extra de membresía</SelectItem>
                                    <SelectItem key="cupon">Cupón / descuento</SelectItem>
                                    <SelectItem key="otro">Otro</SelectItem>
                                </Select>
                                <Input
                                    label="Detalle de recompensa"
                                    placeholder="Ej: 100 puntos, 3 días extra, 10% off..."
                                    value={form.recompensaValor}
                                    onChange={(e) =>
                                        handleChange("recompensaValor", e.target.value)
                                    }
                                />
                            </div>

                            <Divider className="my-1" />

                            <div className="flex flex-col gap-2">
                                <Switch
                                    isSelected={form.mostrarEnApp}
                                    onValueChange={(val) => handleChange("mostrarEnApp", val)}
                                >
                                    Mostrar este reto en la app
                                </Switch>
                                <Switch
                                    isSelected={form.enviarNotificacion}
                                    onValueChange={(val) =>
                                        handleChange("enviarNotificacion", val)
                                    }
                                >
                                    Enviar notificación push al crear el reto
                                </Switch>
                            </div>

                            {form.enviarNotificacion && (
                                <Textarea
                                    label="Mensaje de notificación"
                                    minRows={2}
                                    maxRows={4}
                                    value={form.mensajeNotificacion}
                                    onChange={(e) =>
                                        handleChange("mensajeNotificacion", e.target.value)
                                    }
                                    placeholder="Ej: Esta semana, si vienes 3 veces, te damos 1 día extra de membresía 👀"
                                />
                            )}

                            <CardFooter className="flex flex-col gap-2 px-0 pt-3">
                                <Button
                                    type="submit"
                                    color="primary"
                                    fullWidth
                                    isLoading={creating}
                                    startContent={
                                        <Icon
                                            icon="solar:save-2-bold-duotone"
                                            className="w-4 h-4"
                                        />
                                    }
                                >
                                    Crear reto
                                </Button>
                                <p className="text-[11px] text-default-500 text-center">
                                    Luego puedes conectar este módulo con tu lógica de puntos, cupones
                                    o extensión de membresías.
                                </p>
                            </CardFooter>
                        </form>
                    </CardBody>
                </Card>

                {/* Listado de retos */}
                <Card shadow="sm" className="lg:col-span-2">
                    <CardHeader className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:list-check-bold-duotone" className="w-5 h-5" />
                            <div className="flex flex-col">
                                <p className="font-medium text-sm">Retos configurados</p>
                                <p className="text-[11px] text-default-500">
                                    Visualiza los retos activos, programados y finalizados.
                                </p>
                            </div>
                        </div>
                        <Chip size="sm" variant="flat">
                            Total: {challenges.length}
                        </Chip>
                    </CardHeader>
                    <Divider />
                    <CardBody className="overflow-x-auto">
                        {challenges.length === 0 ? (
                            <div className="py-10 flex flex-col items-center gap-2 text-center">
                                <Icon
                                    icon="solar:folder-question-bold-duotone"
                                    className="w-10 h-10 text-default-300"
                                />
                                <p className="text-sm font-medium text-default-500">
                                    Aún no hay retos configurados.
                                </p>
                                <p className="text-xs text-default-400 max-w-sm">
                                    Crea tu primer reto a la izquierda para empezar a gamificar el uso
                                    de la app y la asistencia al gimnasio.
                                </p>
                            </div>
                        ) : (
                            <Table
                                aria-label="Listado de retos"
                                removeWrapper
                                fullWidth
                                className="min-w-full"
                            >
                                <TableHeader>
                                    <TableColumn>Reto</TableColumn>
                                    <TableColumn>Meta</TableColumn>
                                    <TableColumn>Fechas</TableColumn>
                                    <TableColumn>Recompensa</TableColumn>
                                    <TableColumn className="text-right">Estado</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {challenges.map((reto) => (
                                        <TableRow key={reto.id}>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {reto.nombre}
                                                        </span>
                                                        {reto.mostrarEnApp && (
                                                            <Tooltip content="Visible en la app" size="sm">
                                                                <Icon
                                                                    icon="solar:smartphone-2-bold-duotone"
                                                                    className="w-4 h-4 text-primary"
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-default-500">
                                                        {reto.tipo === "asistencia"
                                                            ? "Asistencia"
                                                            : reto.tipo === "clases"
                                                                ? "Clases"
                                                                : reto.tipo === "rutina"
                                                                    ? "Rutinas"
                                                                    : "Medidas"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-medium">
                                                        {reto.metaValor} {reto.unidad}
                                                    </span>
                                                    {reto.enviarNotificacion && (
                                                        <span className="text-[11px] text-default-400 flex items-center gap-1">
                                                            <Icon
                                                                icon="solar:bell-bing-bold-duotone"
                                                                className="w-3 h-3"
                                                            />
                                                            Notificación al crear
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5 text-[11px]">
                                                    <span>
                                                        Del {reto.fechaInicio} al {reto.fechaFin}
                                                    </span>
                                                    <span className="text-default-400">
                                                        Creado el {reto.createdAt}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5 text-[11px]">
                                                    <span className="text-sm">
                                                        {reto.recompensaValor}
                                                    </span>
                                                    <span className="text-default-400">
                                                        {reto.recompensaTipo === "puntos"
                                                            ? "Puntos"
                                                            : reto.recompensaTipo === "dias_extra"
                                                                ? "Días extra"
                                                                : reto.recompensaTipo === "cupon"
                                                                    ? "Cupón/Descuento"
                                                                    : "Otro"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-end gap-1">
                                                    {getEstadoChip(reto.estado)}
                                                    <Button
                                                        size="sm"
                                                        variant="light"
                                                        className="h-6 text-[11px] px-2"
                                                        startContent={
                                                            <Icon
                                                                icon="solar:chart-line-bold-duotone"
                                                                className="w-3 h-3"
                                                            />
                                                        }
                                                    >
                                                        Ver progreso (futuro)
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
