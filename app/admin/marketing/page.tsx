"use client";

import React from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Chip,
    Input,
    Textarea,
    Select,
    SelectItem,
    Switch,
} from "@heroui/react";
import { Icon } from "@iconify/react";

type Channel = "meta" | "tiktok" | "whatsapp" | "email" | "otros";

interface MobileBlock {
    id: string;
    titulo: string;
    descripcion: string;
    canal: Channel;
    etiqueta: string;
    cta: string;
    activo: boolean;
    color: "emerald" | "sky" | "violet" | "amber";
}

// Contenido demo inicial (para que el preview no esté vacío)
const INITIAL_CONTENT: MobileBlock[] = [
    {
        id: "1",
        titulo: "Prueba gratis de 7 días",
        descripcion: "Activa tu prueba y reserva tu primera clase hoy mismo.",
        canal: "meta",
        etiqueta: "Promo",
        cta: "Quiero probar",
        activo: true,
        color: "emerald",
    },
    {
        id: "2",
        titulo: "Nueva clase funcional",
        descripcion: "Entrenamiento de alta intensidad para cerrar el día con energía.",
        canal: "tiktok",
        etiqueta: "Clase",
        cta: "Ver horarios",
        activo: true,
        color: "sky",
    },
];

export default function MarketingPage() {
    const [items, setItems] = React.useState<MobileBlock[]>(INITIAL_CONTENT);

    const [titulo, setTitulo] = React.useState("");
    const [descripcion, setDescripcion] = React.useState("");
    const [canal, setCanal] = React.useState<Channel>("meta");
    const [etiqueta, setEtiqueta] = React.useState("Promo");
    const [cta, setCta] = React.useState("Más información");
    const [color, setColor] = React.useState<MobileBlock["color"]>("emerald");
    const [activo, setActivo] = React.useState(true);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!titulo.trim() || !descripcion.trim()) return;

        const nuevo: MobileBlock = {
            id: crypto.randomUUID(),
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            canal,
            etiqueta: etiqueta.trim() || "Promo",
            cta: cta.trim() || "Más información",
            activo,
            color,
        };

        // Se agrega arriba del feed
        setItems((prev) => [nuevo, ...prev]);

        // Limpiar formulario
        setTitulo("");
        setDescripcion("");
        setEtiqueta("Promo");
        setCta("Más información");
        setColor("emerald");
        setCanal("meta");
        setActivo(true);
    }

    const canalLabel = (c: Channel) => {
        switch (c) {
            case "meta":
                return "Meta (Facebook / IG)";
            case "tiktok":
                return "TikTok";
            case "whatsapp":
                return "WhatsApp";
            case "email":
                return "Email";
            default:
                return "Otros";
        }
    };

    const chipColorClass = (c: MobileBlock["color"]) => {
        switch (c) {
            case "emerald":
                return "bg-emerald-500/15 text-emerald-300";
            case "sky":
                return "bg-sky-500/15 text-sky-300";
            case "violet":
                return "bg-violet-500/15 text-violet-300";
            case "amber":
                return "bg-amber-500/15 text-amber-300";
            default:
                return "bg-neutral-700 text-neutral-200";
        }
    };

    return (
        <main className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Marketing para app móvil
                    </h1>
                    <p className="text-sm text-default-500">
                        Crea bloques de contenido que luego se mostrarán en la vista móvil
                        de tus usuarios.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="bordered"
                        startContent={
                            <Icon icon="mdi:download-outline" width={18} height={18} />
                        }
                    >
                        Exportar configuración
                    </Button>
                </div>
            </div>

            {/* Layout principal: editor izquierda, preview derecha */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
                {/* Editor */}
                <div className="space-y-4">
                    <Card className="border shadow-sm">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold">
                                    Nuevo bloque de contenido
                                </p>
                                <p className="text-xs text-default-500">
                                    Llena los campos y agrega el bloque al feed de la app.
                                </p>
                            </div>
                            <Chip
                                size="sm"
                                variant="flat"
                                className="bg-emerald-100 text-emerald-700 border-0"
                            >
                                Solo frontend (demo)
                            </Chip>
                        </CardHeader>

                        <CardBody as="form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Input
                                    label="Título"
                                    placeholder="Ej: Prueba gratis de 7 días"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    labelPlacement="outside"
                                    isRequired
                                />
                                <Select
                                    label="Canal principal"
                                    selectedKeys={[canal]}
                                    onChange={(e) => setCanal(e.target.value as Channel)}
                                    labelPlacement="outside"
                                >
                                    <SelectItem key="meta">Meta (Facebook / IG)</SelectItem>
                                    <SelectItem key="tiktok">TikTok</SelectItem>
                                    <SelectItem key="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem key="email">Email</SelectItem>
                                    <SelectItem key="otros">Otros</SelectItem>
                                </Select>
                            </div>

                            <Textarea
                                label="Descripción"
                                placeholder="Texto corto que verán en el dispositivo móvil."
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                minRows={3}
                                labelPlacement="outside"
                                isRequired
                            />

                            <div className="grid gap-3 sm:grid-cols-3">
                                <Input
                                    label="Etiqueta"
                                    placeholder="Promo, Clase, Nutrición..."
                                    value={etiqueta}
                                    onChange={(e) => setEtiqueta(e.target.value)}
                                    labelPlacement="outside"
                                />
                                <Input
                                    label="Texto del botón (CTA)"
                                    placeholder="Ej: Reservar ahora"
                                    value={cta}
                                    onChange={(e) => setCta(e.target.value)}
                                    labelPlacement="outside"
                                />
                                <Select
                                    label="Color del bloque"
                                    selectedKeys={[color]}
                                    onChange={(e) =>
                                        setColor(e.target.value as MobileBlock["color"])
                                    }
                                    labelPlacement="outside"
                                >
                                    <SelectItem key="emerald">Verde (promo)</SelectItem>
                                    <SelectItem key="sky">Celeste (clases)</SelectItem>
                                    <SelectItem key="violet">Morado (planes)</SelectItem>
                                    <SelectItem key="amber">Amarillo (avisos)</SelectItem>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <Switch
                                    isSelected={activo}
                                    onValueChange={setActivo}
                                    size="sm"
                                >
                                    Mostrar este bloque en la app
                                </Switch>
                                <p className="text-[11px] text-default-400">
                                    Más adelante se puede guardar en base de datos y asociar por
                                    sucursal.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="light"
                                    size="sm"
                                    startContent={
                                        <Icon icon="mdi:refresh" width={18} height={18} />
                                    }
                                    onClick={() => {
                                        setTitulo("");
                                        setDescripcion("");
                                        setEtiqueta("Promo");
                                        setCta("Más información");
                                        setColor("emerald");
                                        setCanal("meta");
                                        setActivo(true);
                                    }}
                                >
                                    Limpiar
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    size="sm"
                                    startContent={
                                        <Icon icon="mdi:plus" width={18} height={18} />
                                    }
                                >
                                    Agregar al feed
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Lista simple de bloques creados */}
                    <Card className="border shadow-sm">
                        <CardHeader className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Bloques configurados</p>
                            <span className="text-xs text-default-500">
                                {items.length} en total
                            </span>
                        </CardHeader>
                        <CardBody className="space-y-2 max-h-72 overflow-auto text-xs">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 rounded-lg bg-content2 px-3 py-2"
                                >
                                    <div className="truncate">
                                        <p className="font-medium truncate">{item.titulo}</p>
                                        <p className="text-[11px] text-default-500 truncate">
                                            {canalLabel(item.canal)} · {item.etiqueta}
                                        </p>
                                    </div>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={item.activo ? "success" : "default"}
                                        className="text-[10px]"
                                    >
                                        {item.activo ? "Activo" : "Oculto"}
                                    </Chip>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </div>

                {/* Preview móvil */}
                <div className="space-y-4">
                    <Card className="border shadow-sm">
                        <CardHeader className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold">Preview dispositivo móvil</p>
                                <p className="text-xs text-default-500">
                                    Así se vería el contenido dentro de la app del cliente.
                                </p>
                            </div>
                            <Chip
                                size="sm"
                                variant="flat"
                                className="bg-sky-100 text-sky-700 border-0"
                            >
                                Modo demo
                            </Chip>
                        </CardHeader>
                        <CardBody>
                            <div className="mx-auto w-full max-w-xs">
                                <div className="rounded-3xl border bg-black text-white overflow-hidden shadow-lg">
                                    {/* Top bar */}
                                    <div className="flex items-center justify-between px-3 py-2 text-[11px] bg-black">
                                        <span className="font-medium">Inicio</span>
                                        <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                                            <Icon
                                                icon="mdi:cellphone-information"
                                                width={14}
                                                height={14}
                                            />
                                            UNITI
                                        </span>
                                    </div>

                                    {/* Contenido scrollable */}
                                    <div className="bg-neutral-950 px-3 py-3 space-y-2 max-h-80 overflow-y-auto">
                                        {items
                                            .filter((i) => i.activo)
                                            .map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex flex-col gap-2 rounded-2xl bg-neutral-900 px-3 py-2.5"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-semibold">
                                                            {item.titulo}
                                                        </span>
                                                        <Chip
                                                            size="sm"
                                                            variant="flat"
                                                            className={`border-0 text-[9px] px-2 ${chipColorClass(
                                                                item.color
                                                            )}`}
                                                        >
                                                            {item.etiqueta}
                                                        </Chip>
                                                    </div>
                                                    <p className="text-[11px] text-neutral-300">
                                                        {item.descripcion}
                                                    </p>
                                                    <div className="flex items-center justify-between gap-2 text-[10px] text-neutral-400">
                                                        <span className="flex items-center gap-1">
                                                            <Icon
                                                                icon="mdi:bullhorn-outline"
                                                                width={12}
                                                                height={12}
                                                            />
                                                            {canalLabel(item.canal)}
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            radius="full"
                                                            className="h-6 text-[10px] px-3"
                                                            color="primary"
                                                        >
                                                            {item.cta}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                        {items.filter((i) => i.activo).length === 0 && (
                                            <div className="rounded-2xl bg-neutral-900 px-3 py-4 text-center text-[11px] text-neutral-400">
                                                No hay bloques activos todavía. Crea uno en el panel de
                                                la izquierda y márcalo como activo para verlo aquí.
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom nav */}
                                    <div className="flex items-center justify-around px-3 py-2 bg-black text-[10px] text-neutral-400">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <Icon
                                                icon="mdi:home-variant-outline"
                                                width={16}
                                                height={16}
                                            />
                                            <span className="text-emerald-400">Inicio</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <Icon
                                                icon="mdi:calendar-month-outline"
                                                width={16}
                                                height={16}
                                            />
                                            <span>Agenda</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <Icon
                                                icon="mdi:account-outline"
                                                width={16}
                                                height={16}
                                            />
                                            <span>Perfil</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </main>
    );
}
