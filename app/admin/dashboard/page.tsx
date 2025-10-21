"use client";

import {
    Card, CardHeader, CardBody, Button,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip
} from "@heroui/react";
import { Icon } from "@iconify/react";

export default function AdminDashboardPage() {
    const kpis = [
        { label: "Ventas hoy", value: "$320", icon: "mdi:cash-multiple" },
        { label: "Pedidos", value: "12", icon: "mdi:package-variant-closed" },
        { label: "Usuarios activos", value: "41", icon: "mdi:account-group" },
    ];

    const pedidos = [
        { id: "A-1021", cliente: "María Q.", total: 45, estado: "Pagado" },
        { id: "A-1020", cliente: "Carlos R.", total: 30, estado: "Pendiente" },
        { id: "A-1019", cliente: "Lucía S.", total: 90, estado: "Enviado" },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            {/* KPIs */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((k) => (
                    <Card key={k.label} className="border">
                        <CardHeader className="flex items-center gap-2">
                            <Icon icon={k.icon} width={20} height={20} />
                            <span className="font-medium">{k.label}</span>
                        </CardHeader>
                        <CardBody>
                            <p className="text-3xl font-semibold">{k.value}</p>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Acciones rápidas */}
            <Card className="border">
                <CardHeader className="font-semibold">Acciones rápidas</CardHeader>
                <CardBody className="flex flex-wrap gap-3">
                    <Button startContent={<Icon icon="mdi:plus" width={18} height={18} />}>Nuevo producto</Button>
                    <Button variant="bordered" startContent={<Icon icon="mdi:package-variant" width={18} height={18} />}>
                        Ver pedidos
                    </Button>
                    <Button variant="light" startContent={<Icon icon="mdi:chart-line" width={18} height={18} />}>
                        Reportes
                    </Button>
                </CardBody>
            </Card>

            {/* Tabla de pedidos recientes */}
            <Card className="border">
                <CardHeader className="font-semibold">Pedidos recientes</CardHeader>
                <CardBody>
                    <Table aria-label="Pedidos recientes">
                        <TableHeader>
                            <TableColumn>ORDEN</TableColumn>
                            <TableColumn>CLIENTE</TableColumn>
                            <TableColumn className="text-right">TOTAL</TableColumn>
                            <TableColumn>ESTADO</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {pedidos.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.id}</TableCell>
                                    <TableCell>{p.cliente}</TableCell>
                                    <TableCell className="text-right">${p.total}</TableCell>
                                    <TableCell>
                                        <Chip
                                            color={p.estado === "Pagado" ? "success" : p.estado === "Enviado" ? "primary" : "warning"}
                                            size="sm"
                                            variant="flat"
                                        >
                                            {p.estado}
                                        </Chip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
}
