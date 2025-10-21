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
    Textarea,
    Avatar,
    useDisclosure,
    Link,
} from "@heroui/react";
import { Icon } from "@iconify/react";

// ---- Tipos ----
type Cliente = {
    id: string;
    nombres: string;
    email: string;
    telefono?: string;      // formato +593 99...
    ciudad?: string;
    tipo: "mayorista" | "minorista";
    activo: boolean;
    notas?: string;
    avatarUrl?: string;
    saldo?: number;         // opcional: saldo a favor/deuda
};

// ---- Datos demo (reemplace por fetch a tu API/DB) ----
const SEED: Cliente[] = [
    {
        id: "CLI-0001",
        nombres: "Distribuidora Andes",
        email: "compras@andes.ec",
        telefono: "+593 99 444 1111",
        ciudad: "Quito",
        tipo: "mayorista",
        activo: true,
        notas: "Prefiere combos de jeans. Envíos los lunes.",
        saldo: -120, // negativo: deuda
    },
    {
        id: "CLI-0002",
        nombres: "María Suárez",
        email: "maria@gmail.com",
        telefono: "+593 98 222 2222",
        ciudad: "Ambato",
        tipo: "minorista",
        activo: true,
        saldo: 0,
    },
    {
        id: "CLI-0003",
        nombres: "Boutique Centro",
        email: "ventas@boutiquecentro.ec",
        telefono: "+593 97 333 3333",
        ciudad: "Cuenca",
        tipo: "mayorista",
        activo: false,
        notas: "Reactivar en noviembre.",
        saldo: 60,
    },
];

// ---- Página ----
export default function ClientesPage() {
    const [rows, setRows] = useState<Cliente[]>(SEED);
    const [q, setQ] = useState("");
    const [filterTipo, setFilterTipo] = useState<Set<string>>(new Set([]));
    const [editing, setEditing] = useState<Cliente | null>(null);
    const modal = useDisclosure();

    const filtrados = useMemo(() => {
        let r = rows;
        if (q.trim()) {
            const s = q.toLowerCase();
            r = r.filter(
                (c) =>
                    c.nombres.toLowerCase().includes(s) ||
                    c.email.toLowerCase().includes(s) ||
                    (c.telefono || "").toLowerCase().includes(s) ||
                    (c.ciudad || "").toLowerCase().includes(s) ||
                    c.id.toLowerCase().includes(s)
            );
        }
        if (filterTipo.size) {
            r = r.filter((c) => filterTipo.has(c.tipo));
        }
        return r;
    }, [q, rows, filterTipo]);

    function onNew() {
        setEditing({
            id: "",
            nombres: "",
            email: "",
            telefono: "",
            ciudad: "",
            tipo: "minorista",
            activo: true,
            notas: "",
            saldo: 0,
        });
        modal.onOpen();
    }

    function onEdit(cli: Cliente) {
        setEditing({ ...cli });
        modal.onOpen();
    }

    function onDelete(id: string) {
        // TODO: Confirm + llamada a API
        setRows((prev) => prev.filter((c) => c.id !== id));
    }

    function onToggleActivo(id: string, val: boolean) {
        setRows((prev) => prev.map((c) => (c.id === id ? { ...c, activo: val } : c)));
    }

    function onSave() {
        if (!editing) return;
        // Validación mínima
        if (!editing.nombres.trim() || !editing.email.trim()) return;

        if (editing.id) {
            // update
            setRows((prev) => prev.map((c) => (c.id === editing.id ? editing : c)));
        } else {
            // create
            const nuevo: Cliente = {
                ...editing,
                id: `CLI-${Date.now().toString().slice(-6)}`,
            };
            setRows((prev) => [nuevo, ...prev]);
        }
        modal.onClose();
    }

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Clientes</h1>
                <div className="flex flex-wrap gap-2">
                    <Input
                        aria-label="Buscar clientes"
                        placeholder="Buscar por nombre, correo, ciudad…"
                        variant="bordered"
                        value={q}
                        onValueChange={setQ}
                        startContent={<Icon icon="mdi:magnify" width={18} height={18} />}
                        className="w-64"
                    />
                    <Select
                        aria-label="Filtrar por tipo"
                        selectionMode="multiple"
                        variant="bordered"
                        placeholder="Tipo"
                        selectedKeys={filterTipo}
                        onSelectionChange={(keys) => setFilterTipo(new Set(keys as Set<string>))}
                        className="w-40"
                    >
                        <SelectItem key="mayorista">Mayorista</SelectItem>
                        <SelectItem key="minorista">Minorista</SelectItem>
                    </Select>
                    <Button
                        color="primary"
                        startContent={<Icon icon="mdi:account-plus" width={18} height={18} />}
                        onPress={onNew}
                    >
                        Nuevo
                    </Button>
                </div>
            </div>

            {/* Tabla */}
            <Card className="border">
                <CardHeader className="font-semibold">Listado</CardHeader>
                <CardBody>
                    <Table aria-label="Tabla de clientes" removeWrapper>
                        <TableHeader>
                            <TableColumn>CLIENTE</TableColumn>
                            <TableColumn>CONTACTO</TableColumn>
                            <TableColumn>TIPO</TableColumn>
                            <TableColumn>ESTADO</TableColumn>
                            <TableColumn>SALDO</TableColumn>
                            <TableColumn className="text-right">ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="Sin resultados">
                            {filtrados.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar isBordered radius="full" size="sm" src={c.avatarUrl} name={c.nombres} />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{c.nombres}</span>
                                                <span className="text-xs text-default-500">{c.id}</span>
                                                {c.ciudad ? (
                                                    <span className="text-xs text-default-500">{c.ciudad}</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{c.email}</span>
                                            {c.telefono ? (
                                                <Link
                                                    isExternal
                                                    href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`}
                                                    className="text-xs text-success flex items-center gap-1"
                                                >
                                                    <Icon icon="mdi:whatsapp" width={14} height={14} />
                                                    {c.telefono}
                                                </Link>
                                            ) : null}
                                        </div>
                                    </TableCell>

                                    <TableCell className="capitalize">
                                        <Chip size="sm" variant="flat">
                                            {c.tipo}
                                        </Chip>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Chip color={c.activo ? "success" : "default"} size="sm" variant="flat">
                                                {c.activo ? "Activo" : "Inactivo"}
                                            </Chip>
                                            <Switch
                                                aria-label={`Cambiar estado de ${c.nombres}`}
                                                isSelected={c.activo}
                                                onValueChange={(v) => onToggleActivo(c.id, v)}
                                            />
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        {typeof c.saldo === "number" ? (
                                            <span className={c.saldo < 0 ? "text-danger" : c.saldo > 0 ? "text-success" : "text-default-600"}>
                                                {c.saldo < 0 ? `-$${Math.abs(c.saldo)}` : `$${c.saldo}`}
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="light" onPress={() => onEdit(c)}>
                                                <Icon icon="mdi:pencil" width={18} height={18} />
                                            </Button>
                                            <Button size="sm" color="danger" variant="light" onPress={() => onDelete(c.id)}>
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

            {/* Modal Crear/Editar */}
            <ClienteModal
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
function ClienteModal({
    isOpen,
    onOpenChange,
    data,
    setData,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (v: boolean) => void;
    data: Cliente | null;
    setData: React.Dispatch<React.SetStateAction<Cliente | null>>;
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
                            {data.id ? "Editar cliente" : "Nuevo cliente"}
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombres/Razón social"
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
                                    label="Teléfono (WhatsApp)"
                                    variant="bordered"
                                    value={data.telefono || ""}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, telefono: v } : p))}
                                    description="Ej: +593 99 123 4567"
                                />
                                <Input
                                    label="Ciudad"
                                    variant="bordered"
                                    value={data.ciudad || ""}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, ciudad: v } : p))}
                                />
                                <Select
                                    label="Tipo"
                                    variant="bordered"
                                    selectedKeys={[data.tipo]}
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0] as Cliente["tipo"];
                                        setData((p) => (p ? { ...p, tipo: key } : p));
                                    }}
                                >
                                    <SelectItem key="mayorista">Mayorista</SelectItem>
                                    <SelectItem key="minorista">Minorista</SelectItem>
                                </Select>
                                <Input
                                    label="Saldo"
                                    type="number"
                                    variant="bordered"
                                    value={String(data.saldo ?? 0)}
                                    onValueChange={(v) => {
                                        const n = Number(v);
                                        setData((p) => (p ? { ...p, saldo: isNaN(n) ? 0 : n } : p));
                                    }}
                                    description="Negativo = deuda; Positivo = a favor"
                                />
                            </div>

                            <Switch
                                isSelected={data.activo}
                                onValueChange={(v) => setData((p) => (p ? { ...p, activo: v } : p))}
                            >
                                Activo
                            </Switch>

                            <Textarea
                                label="Notas"
                                placeholder="Preferencias, condiciones de pago, horarios…"
                                variant="bordered"
                                minRows={3}
                                value={data.notas || ""}
                                onValueChange={(v) => setData((p) => (p ? { ...p, notas: v } : p))}
                            />
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
