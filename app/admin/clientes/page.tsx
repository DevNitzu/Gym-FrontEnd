"use client";
import React, { useMemo, useState, useEffect } from "react";
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
    Switch,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Avatar,
    useDisclosure,
    Link,
    Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Select, SelectItem } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/* ===== Modelo interno normalizado ===== */
export type ApiCliente = {
    id_cliente: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string;
    genero: string; // "masculino" | "femenino" | ""
    fecha_nacimiento: string; // "YYYY-MM-DD"
    estado: boolean;
};

/* ===== Tipo extendido para el modal (solo UI) ===== */
type EditingCliente = ApiCliente & { __contrasena?: string };

/* ===== Normalizador ===== */
function normalizeCliente(raw: any): ApiCliente {
    const nombres = raw?.nombres ?? raw?.nombre ?? "";
    const apellidos = raw?.apellidos ?? raw?.apellido ?? "";
    const email = raw?.email ?? raw?.correo ?? "";
    const telefono = raw?.telefono ?? "";
    const cedula = raw?.cedula ?? "";
    const id_cliente = Number(raw?.id_cliente ?? raw?.id ?? 0);

    // estado puede venir como bool, número o string
    let estado: boolean;
    const est = raw?.estado;
    if (typeof est === "boolean") estado = est;
    else if (typeof est === "number") estado = est === 1;
    else if (typeof est === "string")
        estado = est.toLowerCase() === "true" || est === "1";
    else estado = true;

    // genero puede venir como bool, número o string
    let genero: string = "";
    const g = raw?.genero;
    if (typeof g === "boolean") {
        // convención: true = masculino, false = femenino
        genero = g ? "masculino" : "femenino";
    } else if (typeof g === "number") {
        genero = g === 1 ? "masculino" : "femenino";
    } else if (typeof g === "string") {
        const s = g.toLowerCase();
        if (s.startsWith("m")) genero = "masculino";
        else if (s.startsWith("f")) genero = "femenino";
        else genero = "";
    }

    // fecha_nacimiento: quedarnos solo con YYYY-MM-DD
    const rawFecha = raw?.fecha_nacimiento ?? "";
    let fecha_nacimiento = "";
    if (typeof rawFecha === "string" && rawFecha.length > 0) {
        // si viene "2002-01-01T00:00:00" → "2002-01-01"
        fecha_nacimiento = rawFecha.split("T")[0];
    }

    return {
        id_cliente,
        cedula: String(cedula),
        nombres: String(nombres),
        apellidos: String(apellidos),
        email: String(email),
        telefono: String(telefono),
        genero,
        fecha_nacimiento,
        estado,
    };
}

/* ===== Helpers API ===== */
async function apiFetch(path: string, init?: RequestInit) {
    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("auth:token")
            : null;
    const headers = new Headers(init?.headers || {});
    headers.set("Accept", "application/json");
    if (init?.body && !headers.has("Content-Type"))
        headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        cache: "no-store",
        mode: "cors",
    });
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const j = await res.json();
            msg = (j?.message || j?.detail || j?.error || msg) as string;
        } catch { }
        throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
}

async function listClientes(): Promise<ApiCliente[]> {
    const data = await apiFetch(`/api/v1/clientes`);
    const arr = Array.isArray(data) ? data : [];
    return arr.map(normalizeCliente);
}

/** POST exige: { nombre, apellido, cedula, correo, contrasena, fecha_creacion }
 *  Le agregamos genero (bool) y fecha_nacimiento (ISO) si existen.
 */
async function createCliente(body: {
    nombre: string;
    apellido: string;
    cedula: string;
    correo: string;
    contrasena: string;
    genero?: boolean;
    fecha_nacimiento?: string;
    fecha_creacion?: string;
}): Promise<ApiCliente> {
    const payload = {
        ...body,
        fecha_creacion: body.fecha_creacion ?? new Date().toISOString(),
    };
    const created = await apiFetch(`/api/v1/clientes`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return normalizeCliente(created);
}

/** PUT usa el esquema del GET (nombres/apellidos/email/telefono/...)
 *  También mandamos genero (bool) y fecha_nacimiento (ISO) si se envían.
 */
async function updateCliente(id: number, c: any): Promise<ApiCliente> {
    const updated = await apiFetch(`/api/v1/clientes/${id}`, {
        method: "PUT",
        body: JSON.stringify(c),
    });
    return normalizeCliente(updated);
}

async function deleteCliente(id: number): Promise<void> {
    await apiFetch(`/api/v1/clientes/${id}`, { method: "DELETE" });
}

/* ===== Página ===== */
export default function ClientesPage() {
    const [rows, setRows] = useState<ApiCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [q, setQ] = useState("");
    const [editing, setEditing] = useState<EditingCliente | null>(null);

    const modal = useDisclosure();

    /* Cargar clientes */
    async function refresh() {
        try {
            setErr(null);
            setLoading(true);
            const data = await listClientes();
            setRows(data);
        } catch (e: any) {
            setErr(e?.message || "No se pudo cargar clientes");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    /* Búsqueda */
    const filtrados = useMemo(() => {
        if (!q.trim()) return rows;
        const s = q.toLowerCase();
        return rows.filter((c) =>
            [
                c.nombres,
                c.apellidos,
                c.email,
                c.telefono,
                String(c.id_cliente),
                c.cedula,
            ]
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [q, rows]);

    /* Acciones UI */
    function onNew() {
        setEditing({
            id_cliente: 0,
            cedula: "",
            nombres: "",
            apellidos: "",
            telefono: "",
            email: "",
            genero: "",
            fecha_nacimiento: "",
            estado: true,
            __contrasena: "",
        });
        modal.onOpen();
    }

    function onEdit(cli: ApiCliente) {
        setEditing({ ...cli, __contrasena: "" });
        modal.onOpen();
    }

    async function onDelete(id: number) {
        if (!confirm("¿Eliminar este cliente?")) return;
        try {
            await deleteCliente(id);
            setRows((prev) => prev.filter((c) => c.id_cliente !== id));
        } catch (e: any) {
            alert(e?.message || "No se pudo eliminar");
        }
    }

    async function onToggleActivo(c: ApiCliente, val: boolean) {
        try {
            setRows((prev) =>
                prev.map((x) =>
                    x.id_cliente === c.id_cliente ? { ...x, estado: val } : x
                )
            );
            await updateCliente(c.id_cliente, { estado: val });
        } catch (e: any) {
            setRows((prev) =>
                prev.map((x) =>
                    x.id_cliente === c.id_cliente ? { ...x, estado: !val } : x
                )
            );
            alert(e?.message || "No se pudo cambiar el estado");
        }
    }

    async function onSave() {
        if (!editing) return;

        const isCreate = !editing.id_cliente || editing.id_cliente === 0;

        if (
            !editing.nombres.trim() ||
            !editing.apellidos.trim() ||
            !editing.email.trim()
        ) {
            alert("Nombres, apellidos y correo son obligatorios.");
            return;
        }
        if (isCreate && !editing.__contrasena?.trim()) {
            alert("Para crear un cliente, la contraseña es obligatoria.");
            return;
        }

        try {
            if (isCreate) {
                const body: any = {
                    nombre: editing.nombres,
                    apellido: editing.apellidos,
                    cedula: editing.cedula || "",
                    correo: editing.email,
                    contrasena: editing.__contrasena!,
                    fecha_creacion: new Date().toISOString(),
                };

                // convertir genero string → boolean para enviar al backend
                if (editing.genero) {
                    body.genero = editing.genero === "masculino";
                }

                // convertir fecha "YYYY-MM-DD" → "YYYY-MM-DDT00:00:00"
                if (editing.fecha_nacimiento) {
                    body.fecha_nacimiento = `${editing.fecha_nacimiento}T00:00:00`;
                }

                const created = await createCliente(body);
                setRows((prev) => [created, ...prev]);
            } else {
                const updBody: any = {
                    nombres: editing.nombres,
                    apellidos: editing.apellidos,
                    email: editing.email,
                    cedula: editing.cedula,
                    telefono: editing.telefono,
                    estado: editing.estado,
                };

                if (editing.genero) {
                    updBody.genero = editing.genero === "masculino";
                }

                if (editing.fecha_nacimiento) {
                    updBody.fecha_nacimiento = `${editing.fecha_nacimiento}T00:00:00`;
                }

                const upd = await updateCliente(editing.id_cliente, updBody);
                setRows((prev) =>
                    prev.map((c) => (c.id_cliente === upd.id_cliente ? upd : c))
                );
            }

            modal.onClose();
            setEditing(null);
        } catch (e: any) {
            alert(e?.message || "No se pudo guardar");
        }
    }

    function handleCloseModal() {
        modal.onClose();
        setEditing(null);
    }

    return (
        <div className="w-full h-full">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
                {/* Encabezado */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-default-100 ring-1 ring-default-200">
                            <Icon
                                icon="solar:users-group-rounded-bold-duotone"
                                className="text-lg"
                            />
                        </span>
                        <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                            Clientes
                        </h1>
                    </div>

                    <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
                        <Input
                            aria-label="Buscar clientes"
                            placeholder="Buscar por nombre, correo, cédula, teléfono…"
                            variant="bordered"
                            value={q}
                            onValueChange={setQ}
                            startContent={
                                <Icon icon="mdi:magnify" width={18} height={18} />
                            }
                            className="w-full sm:w-64 md:w-72"
                            isDisabled={loading}
                        />
                        <Button
                            color="primary"
                            startContent={
                                <Icon icon="mdi:account-plus" width={18} height={18} />
                            }
                            onPress={onNew}
                            className="w-full sm:w-auto"
                        >
                            Nuevo
                        </Button>
                        <Button
                            variant="flat"
                            startContent={
                                <Icon icon="mdi:refresh" width={18} height={18} />
                            }
                            onPress={refresh}
                            isDisabled={loading}
                            className="w-full sm:w-auto"
                        >
                            Recargar
                        </Button>
                    </div>
                </div>

                {/* Estados */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex items-center gap-3 text-foreground-500">
                            <Spinner />
                            <span>Cargando clientes…</span>
                        </div>
                    </div>
                )}

                {err && !loading && (
                    <Card className="border rounded-2xl bg-background/80 backdrop-blur">
                        <CardBody className="text-center py-8">
                            <p className="font-medium">No se pudo cargar la lista.</p>
                            <p className="text-sm text-foreground-500 mt-1">{err}</p>
                        </CardBody>
                    </Card>
                )}

                {!loading && !err && (
                    <Card className="border rounded-2xl bg-background/80 backdrop-blur shadow-sm">
                        <CardHeader className="font-semibold border-b border-default-100 py-3 px-4 sm:px-6">
                            Listado
                        </CardHeader>
                        <CardBody className="p-4 sm:p-6">
                            {/* === Vista móvil (cards) === */}
                            <div className="sm:hidden space-y-3">
                                {filtrados.length === 0 && (
                                    <div className="text-center text-default-500 py-8">
                                        Sin resultados
                                    </div>
                                )}
                                {filtrados.map((c) => (
                                    <div
                                        key={c.id_cliente}
                                        className="rounded-xl border bg-default-50 p-3 shadow-xs"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar
                                                isBordered
                                                radius="full"
                                                size="sm"
                                                name={`${c.nombres} ${c.apellidos}`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="font-medium truncate">
                                                        {c.nombres} {c.apellidos}
                                                    </div>
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color={c.estado ? "success" : "default"}
                                                    >
                                                        {c.estado ? "Activo" : "Inactivo"}
                                                    </Chip>
                                                </div>
                                                <div className="text-xs text-default-500 mt-1">
                                                    ID: {c.id_cliente} • C.I.:{" "}
                                                    {c.cedula || "—"}
                                                </div>
                                                <div className="mt-2 text-sm break-words">
                                                    {c.email}
                                                </div>
                                                {c.telefono && (
                                                    <Link
                                                        isExternal
                                                        href={`https://wa.me/${c.telefono.replace(
                                                            /\D/g,
                                                            ""
                                                        )}`}
                                                        className="text-xs text-success inline-flex items-center gap-1 mt-1"
                                                    >
                                                        <Icon
                                                            icon="mdi:whatsapp"
                                                            width={14}
                                                            height={14}
                                                        />
                                                        {c.telefono}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <Switch
                                                aria-label={`Cambiar estado de ${c.nombres} ${c.apellidos}`}
                                                isSelected={c.estado}
                                                onValueChange={(v) => onToggleActivo(c, v)}
                                            >
                                                Activo
                                            </Switch>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => onEdit(c)}
                                                >
                                                    <Icon
                                                        icon="mdi:pencil"
                                                        width={18}
                                                        height={18}
                                                    />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="light"
                                                    onPress={() => onDelete(c.id_cliente)}
                                                >
                                                    <Icon
                                                        icon="mdi:trash-can"
                                                        width={18}
                                                        height={18}
                                                    />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* === Vista tablet/escritorio (tabla) === */}
                            <div className="hidden sm:block">
                                <Table aria-label="Tabla de clientes" removeWrapper>
                                    <TableHeader>
                                        <TableColumn>CLIENTE</TableColumn>
                                        <TableColumn>CONTACTO</TableColumn>
                                        <TableColumn>ESTADO</TableColumn>
                                        <TableColumn className="text-right">
                                            ACCIONES
                                        </TableColumn>
                                    </TableHeader>
                                    <TableBody emptyContent="Sin resultados">
                                        {filtrados.map((c) => (
                                            <TableRow key={c.id_cliente}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            isBordered
                                                            radius="full"
                                                            size="sm"
                                                            name={`${c.nombres} ${c.apellidos}`}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {c.nombres} {c.apellidos}
                                                            </span>
                                                            <span className="text-xs text-default-500">
                                                                {c.cedula || "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm break-words">
                                                            {c.email}
                                                        </span>
                                                        {c.telefono ? (
                                                            <Link
                                                                isExternal
                                                                href={`https://wa.me/${c.telefono.replace(
                                                                    /\D/g,
                                                                    ""
                                                                )}`}
                                                                className="text-xs text-success flex items-center gap-1"
                                                            >
                                                                <Icon
                                                                    icon="mdi:whatsapp"
                                                                    width={14}
                                                                    height={14}
                                                                />
                                                                {c.telefono}
                                                            </Link>
                                                        ) : null}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Chip
                                                            color={c.estado ? "success" : "default"}
                                                            size="sm"
                                                            variant="flat"
                                                        >
                                                            {c.estado ? "Activo" : "Inactivo"}
                                                        </Chip>
                                                        <Switch
                                                            aria-label={`Cambiar estado de ${c.nombres} ${c.apellidos}`}
                                                            isSelected={c.estado}
                                                            onValueChange={(v) =>
                                                                onToggleActivo(c, v)
                                                            }
                                                        />
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            onPress={() => onEdit(c)}
                                                        >
                                                            <Icon
                                                                icon="mdi:pencil"
                                                                width={18}
                                                                height={18}
                                                            />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            color="danger"
                                                            variant="light"
                                                            onPress={() => onDelete(c.id_cliente)}
                                                        >
                                                            <Icon
                                                                icon="mdi:trash-can"
                                                                width={18}
                                                                height={18}
                                                            />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>
                )}
                {/* Modal Crear/Editar */}
                <ClienteModal
                    isOpen={modal.isOpen}
                    onClose={handleCloseModal}
                    data={editing}
                    setData={setEditing}
                    onSave={onSave}
                />
            </div>
        </div>
    );
}

/* ===== Modal Crear/Editar ===== */
function ClienteModal({
    isOpen,
    onClose,
    data,
    setData,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    data: EditingCliente | null;
    setData: React.Dispatch<
        React.SetStateAction<EditingCliente | null>
    >;
    onSave: () => void;
}) {
    if (!data) return null;

    const set = (patch: Partial<EditingCliente>) =>
        setData((prev) => (prev ? { ...prev, ...patch } : prev));

    const isCreate = !data.id_cliente || data.id_cliente === 0;

    const generoSelectedKeys = data.genero
        ? new Set<string>([data.genero])
        : new Set<string>();

    return (
        <Modal
            isOpen={isOpen}
            // Ignoramos onOpenChange para que no se cierre por eventos raros (como el Select)
            onOpenChange={() => { }}
            placement="center"
            size="lg"
            backdrop="opaque"
        >
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="mdi:account" width={20} height={20} />
                            {isCreate ? "Nuevo cliente" : "Editar cliente"}
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombres"
                                    variant="bordered"
                                    value={data.nombres}
                                    onValueChange={(v) => set({ nombres: v })}
                                    isRequired
                                />
                                <Input
                                    label="Apellidos"
                                    variant="bordered"
                                    value={data.apellidos}
                                    onValueChange={(v) => set({ apellidos: v })}
                                    isRequired
                                />
                                <Input
                                    label="Cédula"
                                    variant="bordered"
                                    value={data.cedula || ""}
                                    onValueChange={(v) => set({ cedula: v })}
                                />
                                <Input
                                    label="Correo"
                                    type="email"
                                    variant="bordered"
                                    value={data.email}
                                    onValueChange={(v) => set({ email: v })}
                                    isRequired
                                />

                                {isCreate && (
                                    <Input
                                        label="Contraseña"
                                        type="password"
                                        variant="bordered"
                                        value={data.__contrasena || ""}
                                        onValueChange={(v) =>
                                            set({ __contrasena: v })
                                        }
                                        isRequired
                                    />
                                )}

                                <Input
                                    label="Teléfono (WhatsApp)"
                                    variant="bordered"
                                    value={data.telefono || ""}
                                    onValueChange={(v) => set({ telefono: v })}
                                    description="Ej: 099 123 4567"
                                />

                                <Select
                                    label="Género"
                                    placeholder="Selecciona una opción"
                                    selectedKeys={generoSelectedKeys}
                                    onSelectionChange={(keys) => {
                                        if (keys === "all") return;
                                        const k = keys as Set<string>;
                                        const v =
                                            k.values().next().value as
                                            | string
                                            | undefined;
                                        if (!v) return;
                                        set({ genero: v });
                                    }}
                                >
                                    <SelectItem key="masculino">Masculino</SelectItem>
                                    <SelectItem key="femenino">Femenino</SelectItem>
                                </Select>

                                <Input
                                    label="Fecha de Nacimiento"
                                    type="date"
                                    variant="bordered"
                                    value={data.fecha_nacimiento || ""}
                                    onValueChange={(v) =>
                                        set({ fecha_nacimiento: v })
                                    }
                                />
                            </div>

                            <Switch
                                isSelected={!!data.estado}
                                onValueChange={(v) => set({ estado: v })}
                            >
                                Activo
                            </Switch>
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
