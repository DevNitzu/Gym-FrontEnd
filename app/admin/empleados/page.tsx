"use client";

import React, { useMemo, useState } from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Avatar,
    useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";

// ---- Tipos ----
type Empleado = {
    id: string;
    nombres: string;
    email: string;
    rol: "operario" | "vendedor" | "administrador";
    telefono?: string;
    activo: boolean;
    avatarUrl?: string;
};

// ---- Datos demo (reemplaza por fetch a tu API/DB) ----
const SEED: Empleado[] = [
    {
        id: "EMP-0001",
        nombres: "María Quishpe",
        email: "maria@empresa.com",
        rol: "vendedor",
        telefono: "+593 99 111 1111",
        activo: true,
        avatarUrl: "/avatar.png",
    },
    {
        id: "EMP-0002",
        nombres: "Carlos Rojas",
        email: "carlos@empresa.com",
        rol: "operario",
        telefono: "+593 98 222 2222",
        activo: true,
    },
    {
        id: "EMP-0003",
        nombres: "Lucía Suárez",
        email: "lucia@empresa.com",
        rol: "administrador",
        telefono: "+593 97 333 3333",
        activo: false,
    },
];

// ---- Página ----
export default function EmpleadosPage() {
    const [rows, setRows] = useState<Empleado[]>(SEED);
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState<Empleado | null>(null);
    const modal = useDisclosure();

    const filtrados = useMemo(() => {
        if (!q.trim()) return rows;
        const s = q.toLowerCase();
        return rows.filter(
            (e) =>
                e.nombres.toLowerCase().includes(s) ||
                e.email.toLowerCase().includes(s) ||
                e.rol.toLowerCase().includes(s) ||
                (e.telefono || "").toLowerCase().includes(s) ||
                e.id.toLowerCase().includes(s)
        );
    }, [q, rows]);

    function onNew() {
        setEditing({
            id: "",
            nombres: "",
            email: "",
            rol: "operario",
            telefono: "",
            activo: true,
        });
        modal.onOpen();
    }

    function onEdit(emp: Empleado) {
        setEditing({ ...emp });
        modal.onOpen();
    }

    function onDelete(id: string) {
        // TODO: reemplazar por llamada a API + confirmación
        setRows((prev) => prev.filter((e) => e.id !== id));
    }

    function onToggleActivo(id: string, val: boolean) {
        setRows((prev) => prev.map((e) => (e.id === id ? { ...e, activo: val } : e)));
    }

    function onSave() {
        if (!editing) return;
        // Validación mínima
        if (!editing.nombres.trim() || !editing.email.trim()) return;

        if (editing.id) {
            // update
            setRows((prev) => prev.map((e) => (e.id === editing.id ? editing : e)));
        } else {
            // create
            const nuevo: Empleado = {
                ...editing,
                id: `EMP-${Date.now().toString().slice(-6)}`,
            };
            setRows((prev) => [nuevo, ...prev]);
        }
        modal.onClose();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Empleados</h1>
                <div className="flex gap-2">
                    <Input
                        aria-label="Buscar empleados"
                        placeholder="Buscar por nombre, correo, rol…"
                        variant="bordered"
                        value={q}
                        onValueChange={setQ}
                        startContent={<Icon icon="mdi:magnify" width={18} height={18} />}
                        className="w-64"
                    />
                    <Button color="primary" startContent={<Icon icon="mdi:account-plus" width={18} height={18} />} onPress={onNew}>
                        Nuevo
                    </Button>
                </div>
            </div>

            <Card className="border">
                <CardHeader className="font-semibold">Listado</CardHeader>
                <CardBody>
                    <Table aria-label="Tabla de empleados" removeWrapper>
                        <TableHeader>
                            <TableColumn>EMPLEADO</TableColumn>
                            <TableColumn>CORREO</TableColumn>
                            <TableColumn>ROL</TableColumn>
                            <TableColumn>ESTADO</TableColumn>
                            <TableColumn className="text-right">ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="Sin resultados">
                            {filtrados.map((e) => (
                                <TableRow key={e.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar isBordered radius="full" size="sm" src={e.avatarUrl} name={e.nombres} />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{e.nombres}</span>
                                                <span className="text-xs text-default-500">{e.id}</span>
                                                {e.telefono ? <span className="text-xs text-default-500">{e.telefono}</span> : null}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{e.email}</TableCell>
                                    <TableCell className="capitalize">
                                        <Chip size="sm" variant="flat">
                                            {e.rol}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Chip color={e.activo ? "success" : "default"} size="sm" variant="flat">
                                                {e.activo ? "Activo" : "Inactivo"}
                                            </Chip>
                                            <Switch
                                                aria-label={`Cambiar estado de ${e.nombres}`}
                                                isSelected={e.activo}
                                                onValueChange={(v) => onToggleActivo(e.id, v)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="light" onPress={() => onEdit(e)}>
                                                <Icon icon="mdi:pencil" width={18} height={18} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="light"
                                                onPress={() => onDelete(e.id)}
                                            >
                                                <Icon icon="mdi:trash-can" width={18} height={18} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            <EmpleadoModal
                isOpen={modal.isOpen}
                onOpenChange={modal.onOpenChange}
                data={editing}
                setData={setEditing}
                onSave={onSave}
            />
        </div>
    );
}

// ---- Modal de creación/edición ----
function EmpleadoModal({
    isOpen,
    onOpenChange,
    data,
    setData,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (v: boolean) => void;
    data: Empleado | null;
    setData: React.Dispatch<React.SetStateAction<Empleado | null>>;
    onSave: () => void;
}) {
    if (!data) return null;

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="lg">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="mdi:account" width={20} height={20} />
                            {data.id ? "Editar empleado" : "Nuevo empleado"}
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombres"
                                    variant="bordered"
                                    value={data.nombres}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, nombres: v } : p))}
                                    isRequired
                                />
                                <Input
                                    label="Correo"
                                    type="email"
                                    variant="bordered"
                                    value={data.email}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, email: v } : p))}
                                    isRequired
                                />
                                <Input
                                    label="Teléfono"
                                    variant="bordered"
                                    value={data.telefono || ""}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, telefono: v } : p))}
                                />
                                <Select
                                    label="Rol"
                                    variant="bordered"
                                    selectedKeys={[data.rol]}
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0] as Empleado["rol"];
                                        setData((p) => (p ? { ...p, rol: key } : p));
                                    }}
                                >
                                    <SelectItem key="operario">Operario</SelectItem>
                                    <SelectItem key="vendedor">Vendedor</SelectItem>
                                    <SelectItem key="administrador">Administrador</SelectItem>
                                </Select>
                            </div>

                            <div className="flex items-center gap-3">
                                <Switch
                                    isSelected={data.activo}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, activo: v } : p))}
                                >
                                    Activo
                                </Switch>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button color="primary" onPress={onSave}>
                                Guardar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
