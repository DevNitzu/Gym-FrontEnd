"use client";

import React from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Switch,
    Tabs,
    Tab,
    Avatar,
    Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";

type Theme = {
    name: string;
    primary: string;
    secondary: string;
    bg: string;
    surface: string;
    text: string;
    radius: number;
    fontFamily: string;
    logoUrl: string;
    iconUrl: string;
    gradient: boolean;
};

const PRESETS: Theme[] = [
    {
        name: "Minimal",
        primary: "#6A5ACD",
        secondary: "#0EA5E9",
        bg: "#F6F7FB",
        surface: "#FFFFFF",
        text: "#0F172A",
        radius: 14,
        fontFamily: "Inter, system-ui, sans-serif",
        logoUrl:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'><rect width='256' height='256' rx='48' fill='#6A5ACD'/><circle cx='128' cy='128' r='64' fill='white'/></svg>`
            ),
        iconUrl:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 256 256'><rect width='256' height='256' rx='64' fill='#6A5ACD'/><path d='M64 128h128' stroke='white' stroke-width='24' stroke-linecap='round'/></svg>`
            ),
        gradient: false,
    },
    {
        name: "Fitness Pro",
        primary: "#FF5A1F",
        secondary: "#111827",
        bg: "#0B0F19",
        surface: "#111827",
        text: "#F9FAFB",
        radius: 16,
        fontFamily: "Inter, system-ui, sans-serif",
        logoUrl:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'><rect width='256' height='256' rx='40' fill='#111827'/><g fill='#FF5A1F'><rect x='36' y='112' width='184' height='32' rx='8'/><rect x='76' y='72' width='32' height='112' rx='6'/><rect x='148' y='72' width='32' height='112' rx='6'/></g></svg>`
            ),
        iconUrl:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 256 256'><rect width='256' height='256' rx='64' fill='#111827'/><circle cx='128' cy='128' r='56' fill='#FF5A1F'/></svg>`
            ),
        gradient: true,
    },
];

function useThemeVars(theme: Theme) {
    React.useEffect(() => {
        const r = document.documentElement;
        r.style.setProperty("--app-primary", theme.primary);
        r.style.setProperty("--app-secondary", theme.secondary);
        r.style.setProperty("--app-bg", theme.bg);
        r.style.setProperty("--app-surface", theme.surface);
        r.style.setProperty("--app-text", theme.text);
        r.style.setProperty("--app-radius", `${theme.radius}px`);
        r.style.setProperty("--app-font", theme.fontFamily);
    }, [theme]);
}

export default function Page() {
    const [theme, setTheme] = React.useState<Theme>(PRESETS[0]);
    const [jsonText, setJsonText] = React.useState("");

    useThemeVars(theme);

    const update = (key: keyof Theme, value: string | number | boolean) => {
        setTheme((prev) => ({ ...prev, [key]: value } as Theme));
    };

    const handleLogo = (key: "logoUrl" | "iconUrl", file?: File | null) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setTheme((prev) => ({ ...prev, [key]: url }));
    };

    const handleExport = () => {
        const json = JSON.stringify(theme, null, 2);
        setJsonText(json);
        navigator.clipboard.writeText(json).catch(() => { });
    };

    const handleImport = () => {
        try {
            const parsed = JSON.parse(jsonText) as Partial<Theme>;
            setTheme((prev) => ({ ...prev, ...parsed }));
        } catch (err) {
            console.error("JSON inválido", err);
        }
    };

    return (
        <div
            className="min-h-screen"
            style={{
                background: theme.bg,
                color: theme.text,
                fontFamily: theme.fontFamily,
            }}
        >
            <main className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-6">
                {/* HEADER */}
                <Card
                    className="border rounded-2xl"
                    style={{
                        background: theme.gradient
                            ? `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`
                            : theme.surface,
                    }}
                >
                    <CardBody className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar src={theme.iconUrl} className="h-10 w-10 rounded-xl" />
                            <div className="min-w-0">
                                <p className="text-lg font-semibold truncate">
                                    Configuración de sitio
                                </p>
                                <p className="text-xs opacity-80 truncate">
                                    Colores, logo y variables globales del tema.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                size="sm"
                                isSelected={theme.gradient}
                                onValueChange={(v) => update("gradient", v)}
                            >
                                Fondo con gradiente
                            </Switch>
                            <Button
                                size="sm"
                                color="primary"
                                startContent={<Icon icon="mdi:content-copy" />}
                                onClick={handleExport}
                            >
                                Copiar JSON
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {/* LAYOUT PRINCIPAL */}
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)]">
                    {/* PANEL DE CONFIGURACIÓN */}
                    <Card className="border rounded-2xl" style={{ background: theme.surface }}>
                        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold">Apariencia básica</p>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map((p) => (
                                    <Button
                                        key={p.name}
                                        size="sm"
                                        variant={p.name === theme.name ? "solid" : "flat"}
                                        onClick={() => setTheme(p)}
                                    >
                                        {p.name}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {/* Colores */}
                            <div className="grid grid-cols-2 gap-3">
                                {([
                                    ["primary", "Primario"],
                                    ["secondary", "Secundario"],
                                    ["bg", "Fondo"],
                                    ["surface", "Superficie"],
                                    ["text", "Texto"],
                                ] as const).map(([key, label]) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-7 w-7 rounded-lg border"
                                                style={{ background: (theme as any)[key] }}
                                            />
                                            <span className="text-xs font-medium">{label}</span>
                                        </div>
                                        <input
                                            type="color"
                                            className="h-8 w-14 rounded-md border cursor-pointer"
                                            value={(theme as any)[key]}
                                            onChange={(e) => update(key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Radio y fuente */}
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Radio bordes (px)"
                                    size="sm"
                                    type="number"
                                    value={String(theme.radius)}
                                    onValueChange={(v) =>
                                        update("radius", Number(v || 0))
                                    }
                                />
                                <Input
                                    label="Tipografía"
                                    size="sm"
                                    value={theme.fontFamily}
                                    onValueChange={(v) => update("fontFamily", v)}
                                />
                            </div>

                            {/* Logos */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-2">
                                    <p className="font-medium">Logo principal</p>
                                    <div className="aspect-[3/1] border rounded-xl bg-white flex items-center justify-center overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={theme.logoUrl}
                                            alt="Logo"
                                            className="h-full object-contain"
                                        />
                                    </div>
                                    <label className="inline-flex items-center gap-1 cursor-pointer">
                                        <Icon icon="mdi:upload" />
                                        <span>Subir</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                handleLogo("logoUrl", e.target.files?.[0] ?? null)
                                            }
                                        />
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Ícono</p>
                                    <div className="h-20 border rounded-xl bg-white flex items-center justify-center overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={theme.iconUrl}
                                            alt="Icon"
                                            className="h-full object-contain"
                                        />
                                    </div>
                                    <label className="inline-flex items-center gap-1 cursor-pointer">
                                        <Icon icon="mdi:upload" />
                                        <span>Subir</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                handleLogo("iconUrl", e.target.files?.[0] ?? null)
                                            }
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Importar JSON */}
                            <div className="space-y-1 text-xs">
                                <p className="font-medium">Importar JSON</p>
                                <textarea
                                    className="w-full rounded-xl border px-2 py-1 text-xs bg-white/70"
                                    rows={4}
                                    placeholder='Pega aquí el JSON del tema y pulsa "Aplicar JSON"'
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                />
                                <Button
                                    size="sm"
                                    variant="flat"
                                    startContent={<Icon icon="mdi:check" />}
                                    onClick={handleImport}
                                >
                                    Aplicar JSON
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* PREVIEW */}
                    <Card className="border rounded-2xl" style={{ background: theme.surface }}>
                        <CardBody>
                            <Tabs aria-label="Preview" variant="underlined">
                                <Tab
                                    key="dashboard"
                                    title={
                                        <span className="flex items-center gap-1 text-xs">
                                            <Icon icon="mdi:view-dashboard-outline" />
                                            Dashboard
                                        </span>
                                    }
                                >
                                    <div className="space-y-4">
                                        {/* Navbar */}
                                        <div
                                            className="flex items-center justify-between px-4 py-3 rounded-2xl"
                                            style={{
                                                background: theme.primary,
                                                color: "#fff",
                                                borderRadius: theme.radius,
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    src={theme.iconUrl}
                                                    className="h-7 w-7 rounded-lg"
                                                />
                                                <span className="text-sm font-semibold">
                                                    Tu marca
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="bordered"
                                                className="border-white/40 text-[11px] text-white"
                                            >
                                                Acción
                                            </Button>
                                        </div>

                                        {/* Tarjetas */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {["Ingresos", "Clientes", "Membresías"].map((t, i) => (
                                                <div
                                                    key={t}
                                                    className="p-3 border rounded-2xl text-xs space-y-1"
                                                    style={{ borderRadius: theme.radius }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">{t}</span>
                                                        <Chip size="sm" variant="flat" color="primary">
                                                            {i === 0 ? "$ 12k" : i === 1 ? "314" : "128"}
                                                        </Chip>
                                                    </div>
                                                    <p className="opacity-70">
                                                        Texto de ejemplo usando tus colores.
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Botones e inputs */}
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <Button color="primary" size="sm">
                                                Botón primario
                                            </Button>
                                            <Button variant="flat" color="primary" size="sm">
                                                Plano
                                            </Button>
                                            <Button variant="bordered" size="sm">
                                                Bordeado
                                            </Button>
                                            <Input
                                                size="sm"
                                                className="max-w-xs"
                                                label="Input ejemplo"
                                                placeholder="Escribe algo..."
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab
                                    key="info"
                                    title={
                                        <span className="flex items-center gap-1 text-xs">
                                            <Icon icon="mdi:code-tags" />
                                            Variables CSS
                                        </span>
                                    }
                                >
                                    <div className="space-y-3 text-xs">
                                        <p>
                                            Estas son las variables que se están aplicando en{" "}
                                            <code>:root</code>:
                                        </p>
                                        <div className="rounded-xl border bg-black text-emerald-200 p-3 font-mono text-[11px] overflow-x-auto">
                                            <pre>{`:root {
  --app-primary: ${theme.primary};
  --app-secondary: ${theme.secondary};
  --app-bg: ${theme.bg};
  --app-surface: ${theme.surface};
  --app-text: ${theme.text};
  --app-radius: ${theme.radius}px;
  --app-font: ${theme.fontFamily};
}`}</pre>
                                        </div>
                                        <p>
                                            Puedes copiar este bloque a tu{" "}
                                            <code>globals.css</code> para tener valores por defecto.
                                        </p>
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>
                </div>
            </main>
        </div>
    );
}
