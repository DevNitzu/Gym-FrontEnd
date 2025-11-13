"use client";

import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@heroui/react";
import { Icon } from "@iconify/react";


const summaryCards = [
    {
        label: "Total Ingresos 2025",
        value: "$ 13.261.885",
        helper: "Incluye membresías y productos",
        color: "from-emerald-500 to-emerald-600",
        icon: "mdi:cash-multiple",
    },
    {
        label: "Total Egresos 2025",
        value: "$ 58.331",
        helper: "Gastos operativos y marketing",
        color: "from-rose-500 to-rose-600",
        icon: "mdi:credit-card-outline",
    },
    {
        label: "Balance Neto 2025",
        value: "$ 13.203.554",
        helper: "Resultado financiero del año",
        color: "from-sky-500 to-sky-600",
        icon: "mdi:chart-line-variant",
    },
];

const movimientos = [
    {
        id: "MV-1021",
        tipo: "Membresía mensual",
        cliente: "María Quishpe",
        total: 45,
        fecha: "12/11/2025",
        estado: "Pagado",
    },
    {
        id: "MV-1020",
        tipo: "Plan KETO",
        cliente: "Carlos Reyes",
        total: 89,
        fecha: "12/11/2025",
        estado: "Pendiente",
    },
    {
        id: "MV-1019",
        tipo: "Day pass",
        cliente: "Lucía Sánchez",
        total: 10,
        fecha: "11/11/2025",
        estado: "Pagado",
    },
    {
        id: "MV-1018",
        tipo: "Membresía anual",
        cliente: "Pedro Torres",
        total: 350,
        fecha: "11/11/2025",
        estado: "Pagado",
    },
];

const mobileItems = [
    {
        title: "Entrenamientos activos",
        subtitle: "Sesión funcional 18:00",
        tag: "Hoy",
    },
    {
        title: "EMOM",
        subtitle: "2025-07-01",
        tag: "Rutina",
    },
    {
        title: "Plan KETO (DEMO)",
        subtitle: "2025-09-01",
        tag: "Nutrición",
    },
    {
        title: "Nueva reserva",
        subtitle: "Spinning 19:30",
        tag: "Reserva",
    },
];

export default function AdminDashboardPage() {
    return (
        <main className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6">
            {/* Top bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Panel financiero
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        isIconOnly
                        variant="light"
                        className="rounded-full"
                        aria-label="Notificaciones"
                    >
                        <Icon icon="mdi:bell-outline" width={20} height={20} />
                    </Button>
                    <Button
                        isIconOnly
                        variant="light"
                        className="rounded-full"
                        aria-label="Ayuda"
                    >
                        <Icon icon="mdi:help-circle-outline" width={20} height={20} />
                    </Button>
                </div>
            </div>


            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-default-500">
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                        variant="flat"
                        size="sm"
                        startContent={
                            <Icon icon="mdi:calendar-month-outline" width={18} height={18} />
                        }
                    >
                        2025
                    </Button>
                    <Button
                        variant="flat"
                        size="sm"
                        startContent={
                            <Icon
                                icon="mdi:map-marker-radius-outline"
                                width={18}
                                height={18}
                            />
                        }
                    >
                        Todas las sucursales
                    </Button>
                    <Button
                        variant="bordered"
                        size="sm"
                        startContent={
                            <Icon icon="mdi:download-outline" width={18} height={18} />
                        }
                    >
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
                {/* Left column */}
                <div className="space-y-5">
                    {/* Summary cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        {summaryCards.map((card) => (
                            <Card
                                key={card.label}
                                className={`border-0 shadow-md bg-gradient-to-br ${card.color} text-white`}
                            >
                                <CardHeader className="flex justify-between items-start gap-2 pb-1">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide opacity-80">
                                            {card.label}
                                        </p>
                                        <p className="text-2xl font-semibold">{card.value}</p>
                                    </div>
                                    <span className="inline-flex items-center justify-center rounded-full bg-white/15 p-1.5">
                                        <Icon icon={card.icon} width={20} height={20} />
                                    </span>
                                </CardHeader>
                                <CardBody className="pt-0">
                                    <p className="text-[11px] leading-snug opacity-85">
                                        {card.helper}
                                    </p>
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    {/* Chart card */}
                    <Card className="border shadow-sm">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold">Comportamiento anual</p>
                                <p className="text-xs text-default-500">
                                    Ingresos, egresos y balance por mes
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs">
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    className="bg-emerald-100 text-emerald-700 border-0"
                                >
                                    ■ Ingresos
                                </Chip>
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    className="bg-rose-100 text-rose-700 border-0"
                                >
                                    ■ Egresos
                                </Chip>
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    className="bg-sky-100 text-sky-700 border-0"
                                >
                                    ■ Balance
                                </Chip>
                            </div>
                        </CardHeader>

                        <CardBody>
                            {/* Chart placeholder (solo UI, sin librerías) */}
                            <div className="mt-2">
                                <div className="flex items-end gap-2 h-40 rounded-lg bg-content2 px-3 py-3">
                                    {[
                                        { month: "E", in: 90, out: 35 },
                                        { month: "F", in: 80, out: 40 },
                                        { month: "M", in: 95, out: 30 },
                                        { month: "A", in: 75, out: 45 },
                                        { month: "M", in: 100, out: 50 },
                                        { month: "J", in: 85, out: 38 },
                                        { month: "J", in: 92, out: 42 },
                                        { month: "A", in: 88, out: 36 },
                                        { month: "S", in: 97, out: 39 },
                                        { month: "O", in: 101, out: 48 },
                                        { month: "N", in: 99, out: 44 },
                                        { month: "D", in: 105, out: 52 },
                                    ].map((m) => (
                                        <div
                                            key={m.month + m.in}
                                            className="flex-1 flex flex-col items-center gap-1"
                                        >
                                            <div className="relative w-full flex-1 flex items-end gap-0.5">
                                                <div
                                                    className="w-2 rounded-t-full bg-emerald-500/80"
                                                    style={{ height: `${m.in}%` }}
                                                />
                                                <div
                                                    className="w-2 rounded-t-full bg-rose-500/80"
                                                    style={{ height: `${m.out}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-default-500">
                                                {m.month}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Movimientos recientes */}
                    <Card className="border shadow-sm">
                        <CardHeader className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold">Movimientos recientes</p>
                                <p className="text-xs text-default-500">
                                    Últimos pagos y renovaciones.
                                </p>
                            </div>
                            <Button
                                variant="light"
                                size="sm"
                                startContent={
                                    <Icon
                                        icon="mdi:open-in-new"
                                        width={16}
                                        height={16}
                                        className="opacity-80"
                                    />
                                }
                            >
                                Ver todo
                            </Button>
                        </CardHeader>
                        <CardBody className="pt-0">
                            <Table
                                aria-label="Movimientos recientes"
                                removeWrapper
                                classNames={{
                                    table: "text-xs",
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>ID</TableColumn>
                                    <TableColumn>CONCEPTO</TableColumn>
                                    <TableColumn>CLIENTE</TableColumn>
                                    <TableColumn>FECHA</TableColumn>
                                    <TableColumn className="text-right">TOTAL</TableColumn>
                                    <TableColumn>ESTADO</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {movimientos.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell>{m.id}</TableCell>
                                            <TableCell>{m.tipo}</TableCell>
                                            <TableCell>{m.cliente}</TableCell>
                                            <TableCell>{m.fecha}</TableCell>
                                            <TableCell className="text-right">
                                                ${m.total}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={m.estado === "Pagado" ? "success" : "warning"}
                                                >
                                                    {m.estado}
                                                </Chip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardBody>
                    </Card>
                </div>

                {/* Right column - mobile preview */}
                <div className="space-y-5">
                    <Card className="border shadow-sm">
                        <CardHeader className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold">Actividad en la app</p>
                                <p className="text-xs text-default-500">
                                    Vista previa de lo que ve tu cliente en el móvil.
                                </p>
                            </div>
                            <Chip
                                size="sm"
                                variant="flat"
                                className="bg-emerald-100 text-emerald-700 border-0"
                            >
                                En línea
                            </Chip>
                        </CardHeader>
                        <CardBody>
                            <div className="mx-auto w-full max-w-xs">
                                <div className="rounded-3xl border bg-black text-white overflow-hidden shadow-lg">
                                    {/* Top bar mobile */}
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

                                    {/* Content */}
                                    <div className="bg-neutral-950 px-3 py-3 space-y-2">
                                        {mobileItems.map((item, idx) => (
                                            <div
                                                key={item.title + idx}
                                                className="flex items-center justify-between gap-2 rounded-xl bg-neutral-900 px-3 py-2.5"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">
                                                        {item.title}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400">
                                                        {item.subtitle}
                                                    </span>
                                                </div>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-emerald-500/15 text-emerald-300 border-0 text-[10px]"
                                                >
                                                    {item.tag}
                                                </Chip>
                                            </div>
                                        ))}
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

                    <Card className="border shadow-sm">
                        <CardHeader>
                            <p className="text-sm font-semibold">
                                Conversiones de membresía
                            </p>
                        </CardHeader>
                        <CardBody className="space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                                <span>Prueba gratis → Mensual</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-default-500">54%</span>
                                    <div className="h-1.5 w-24 rounded-full bg-content2 overflow-hidden">
                                        <div className="h-full w-[54%] bg-emerald-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Mensual → Trimestral</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-default-500">32%</span>
                                    <div className="h-1.5 w-24 rounded-full bg-content2 overflow-hidden">
                                        <div className="h-full w-[32%] bg-sky-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Trimestral → Anual</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-default-500">18%</span>
                                    <div className="h-1.5 w-24 rounded-full bg-content2 overflow-hidden">
                                        <div className="h-full w-[18%] bg-violet-500" />
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
