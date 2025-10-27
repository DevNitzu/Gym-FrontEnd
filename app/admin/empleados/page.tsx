"use client";

import React from "react";
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
    Spinner,
    Link,
} from "@heroui/react";
import { Icon } from "@iconify/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/* ====================== Tipos API ====================== */
type ApiEmpleado = {
    nombre: string;
    apellido: string;
    cedula: string;
    correo: string;
    telefono: string;
    id_empresa: number;
    id_gimnasio: number;
    id_tipo_empleado: number;
    fecha_creacion: string;
    id_empleado: number;
    activo: boolean;
    contrasena?: string;
};

/* ====================== Tipos UI ====================== */
type RolUI = "operario" | "vendedor" | "administrador";

type EmpleadoUI = {
    id_empleado?: number;
    nombres: string;
    nombre: string;
    apellido: string;
    email: string;
    cedula: string;
    telefono: string;
    id_empresa: number;
    id_gimnasio: number;
    rol: RolUI;
    id_tipo_empleado: number;
    activo: boolean;
    avatarUrl?: string;
    fecha_creacion?: string;
    contrasena?: string;
};

/* ====================== Utils ====================== */
function toBool(v: any): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    return String(v ?? "").toLowerCase() === "true";
}
function mapTipoToRol(tipo: number): RolUI {
    if (tipo === 1) return "administrador";
    if (tipo === 2) return "vendedor";
    return "operario";
}
function mapRolToTipo(rol: RolUI): number {
    if (rol === "administrador") return 1;
    if (rol === "vendedor") return 2;
    return 3;
}
function normApiToUI(x: ApiEmpleado): EmpleadoUI {
    const rol = mapTipoToRol(Number(x.id_tipo_empleado));
    return {
        id_empleado: Number(x.id_empleado),
        nombres: `${x.nombre ?? ""} ${x.apellido ?? ""}`.trim(),
        nombre: String(x.nombre ?? ""),
        apellido: String(x.apellido ?? ""),
        email: String(x.correo ?? ""),
        cedula: String(x.cedula ?? ""),
        telefono: String(x.telefono ?? ""),
        id_empresa: Number(x.id_empresa ?? 0),
        id_gimnasio: Number(x.id_gimnasio ?? 0),
        rol,
        id_tipo_empleado: Number(x.id_tipo_empleado ?? mapRolToTipo(rol)),
        activo: toBool(x.activo),
        fecha_creacion: String(x.fecha_creacion ?? ""),
    };
}
function uiToApiCreate(x: EmpleadoUI): Omit<ApiEmpleado, "id_empleado" | "activo"> & { contrasena?: string } {
    return {
        nombre: x.nombre,
        apellido: x.apellido,
        cedula: x.cedula,
        correo: x.email,
        telefono: x.telefono,
        id_empresa: x.id_empresa,
        id_gimnasio: x.id_gimnasio,
        id_tipo_empleado: mapRolToTipo(x.rol),
        fecha_creacion: x.fecha_creacion || new Date().toISOString(),
        contrasena: x.contrasena,
    };
}
function uiToApiUpdate(x: EmpleadoUI): Partial<ApiEmpleado> {
    return {
        nombre: x.nombre,
        apellido: x.apellido,
        cedula: x.cedula,
        correo: x.email,
        telefono: x.telefono,
        id_empresa: x.id_empresa,
        id_gimnasio: x.id_gimnasio,
        id_tipo_empleado: mapRolToTipo(x.rol),
        contrasena: x.contrasena,
        activo: x.activo,
    };
}

/* ====================== Fetch helper ====================== */
async function apiFetch(path: string, init?: RequestInit) {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth:token") : null;
    const headers = new Headers(init?.headers || {});
    headers.set("Accept", "application/json");
    if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store", mode: "cors" });
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

/* ====================== API calls ====================== */
async function listEmpleados(): Promise<EmpleadoUI[]> {
    const data = await apiFetch(`/api/v1/empleados`);
    if (!Array.isArray(data)) return [];
    return data.map(normApiToUI);
}
async function createEmpleado(body: EmpleadoUI): Promise<EmpleadoUI> {
    const payload = uiToApiCreate(body);
    const created = await apiFetch(`/api/v1/empleados`, { method: "POST", body: JSON.stringify(payload) });
    return normApiToUI(created as ApiEmpleado);
}
async function updateEmpleadoApi(id_empleado: number, body: EmpleadoUI): Promise<EmpleadoUI> {
    const payload = uiToApiUpdate(body);
    const updated = await apiFetch(`/api/v1/empleados/${id_empleado}`, { method: "PUT", body: JSON.stringify(payload) });
    return normApiToUI(updated as ApiEmpleado);
}
async function deleteEmpleadoApi(id_empleado: number): Promise<void> {
    await apiFetch(`/api/v1/empleados/${id_empleado}`, { method: "DELETE" });
}

/* ====================== Página ====================== */
export default function EmpleadosPage() {
    const [rows, setRows] = React.useState<EmpleadoUI[]>([]);
    const [q, setQ] = React.useState("");
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [notif, setNotif] = React.useState<string | null>(null);

    const [editing, setEditing] = React.useState<EmpleadoUI | null>(null);
    const modal = useDisclosure();

    React.useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const all = await listEmpleados();
                if (!alive) return;
                setRows(all);
            } catch (e: any) {
                if (!alive) return;
                setErr(e?.message || "No se pudo obtener empleados.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const filtrados = React.useMemo(() => {
        if (!q.trim()) return rows;
        const s = q.toLowerCase();
        return rows.filter(
            (e) =>
                e.nombres.toLowerCase().includes(s) ||
                e.email.toLowerCase().includes(s) ||
                e.rol.toLowerCase().includes(s) ||
                e.cedula.toLowerCase().includes(s) ||
                String(e.id_empleado ?? "").toLowerCase().includes(s)
        );
    }, [q, rows]);

    function onNew() {
        setEditing({
            nombres: "",
            nombre: "",
            apellido: "",
            email: "",
            cedula: "",
            telefono: "",
            id_empresa: 0,
            id_gimnasio: 0,
            rol: "operario",
            id_tipo_empleado: mapRolToTipo("operario"),
            activo: true,
            contrasena: "",
            fecha_creacion: new Date().toISOString(),
        });
        modal.onOpen();
    }
    function onEdit(emp: EmpleadoUI) {
        setEditing({ ...emp });
        modal.onOpen();
    }
    async function onDelete(id_empleado?: number) {
        if (!id_empleado) return;
        const ok = confirm("¿Eliminar este empleado?");
        if (!ok) return;
        try {
            await deleteEmpleadoApi(id_empleado);
            setRows((prev) => prev.filter((e) => e.id_empleado !== id_empleado));
            setNotif("Empleado eliminado.");
        } catch (e: any) {
            setNotif(e?.message || "No se pudo eliminar.");
        }
    }
    async function onToggleActivo(emp: EmpleadoUI, val: boolean) {
        setRows((prev) => prev.map((e) => (e.id_empleado === emp.id_empleado ? { ...e, activo: val } : e)));
        try {
            if (!emp.id_empleado) throw new Error("Sin id_empleado.");
            await updateEmpleadoApi(emp.id_empleado, { ...emp, activo: val });
        } catch (e: any) {
            setRows((prev) => prev.map((e) => (e.id_empleado === emp.id_empleado ? { ...e, activo: !val } : e)));
            setNotif(e?.message || "No se pudo cambiar estado.");
        }
    }

    async function onSave() {
        if (!editing) return;
        if (!editing.nombre.trim() || !editing.apellido.trim() || !editing.email.trim() || !editing.cedula.trim()) {
            setNotif("Completa: nombre, apellido, correo y cédula.");
            return;
        }
        if (!editing.id_empleado && !editing.contrasena?.trim()) {
            setNotif("Para crear, define una contraseña.");
            return;
        }
        setSaving(true);
        setNotif(null);
        try {
            if (editing.id_empleado) {
                const saved = await updateEmpleadoApi(editing.id_empleado, editing);
                setRows((prev) => prev.map((e) => (e.id_empleado === saved.id_empleado ? saved : e)));
                setNotif("Empleado actualizado.");
            } else {
                const created = await createEmpleado(editing);
                setRows((prev) => [created, ...prev]);
                setNotif("Empleado creado.");
            }
            modal.onClose();
        } catch (e: any) {
            setNotif(e?.message || "No se pudo guardar.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header responsivo */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Empleados</h1>
                <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
                    <Input
                        aria-label="Buscar empleados"
                        placeholder="Buscar por nombre, correo, rol, cédula…"
                        variant="bordered"
                        value={q}
                        onValueChange={setQ}
                        startContent={<Icon icon="mdi:magnify" width={18} height={18} />}
                        className="w-full sm:w-64 md:w-72"
                    />
                    <Button
                        color="primary"
                        startContent={<Icon icon="mdi:account-plus" width={18} height={18} />}
                        onPress={onNew}
                        className="w-full sm:w-auto"
                    >
                        Nuevo
                    </Button>
                </div>
            </div>

            {!!notif && (
                <Chip color={notif.includes("No se pudo") ? "warning" : "success"} variant="flat">
                    {notif}
                </Chip>
            )}

            <Card className="border">
                <CardHeader className="font-semibold">Listado</CardHeader>
                <CardBody>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Spinner size="lg" />
                        </div>
                    ) : err ? (
                        <div className="text-center text-warning-600">{err}</div>
                    ) : (
                        <>
                            {/* ===== Vista móvil (cards) ===== */}
                            <div className="sm:hidden space-y-3">
                                {filtrados.length === 0 && (
                                    <div className="text-center text-default-500 py-8">Sin resultados</div>
                                )}

                                {filtrados.map((e) => (
                                    <div key={e.id_empleado} className="rounded-xl border p-3">
                                        <div className="flex items-start gap-3">
                                            <Avatar isBordered radius="full" size="sm" src={e.avatarUrl} name={e.nombres} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="font-medium truncate">{e.nombres}</div>
                                                    <Chip size="sm" variant="flat" color={e.activo ? "success" : "default"}>
                                                        {e.activo ? "Activo" : "Inactivo"}
                                                    </Chip>
                                                </div>
                                                <div className="text-xs text-default-500 mt-1">ID: {e.id_empleado}</div>
                                                <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
                                                    <span className="break-words">{e.email}</span>
                                                    <span className="text-default-500">C.I.: {e.cedula || "—"}</span>
                                                    {e.telefono && <span className="text-default-500">{e.telefono}</span>}
                                                    <span className="capitalize">Rol: {e.rol}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <Switch
                                                aria-label={`Cambiar estado de ${e.nombres}`}
                                                isSelected={e.activo}
                                                onValueChange={(v) => onToggleActivo(e, v)}
                                            >
                                                Activo
                                            </Switch>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="light" onPress={() => onEdit(e)}>
                                                    <Icon icon="mdi:pencil" width={18} height={18} />
                                                </Button>
                                                <Button size="sm" color="danger" variant="light" onPress={() => onDelete(e.id_empleado)}>
                                                    <Icon icon="mdi:trash-can" width={18} height={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ===== Vista tablet/desktop (tabla) ===== */}
                            <div className="hidden sm:block">
                                <Table aria-label="Tabla de empleados" removeWrapper>
                                    <TableHeader>
                                        <TableColumn>EMPLEADO</TableColumn>
                                        <TableColumn>CÉDULA</TableColumn>
                                        <TableColumn>CORREO</TableColumn>
                                        <TableColumn>ROL</TableColumn>
                                        <TableColumn>ESTADO</TableColumn>
                                        <TableColumn className="text-right">ACCIONES</TableColumn>
                                    </TableHeader>
                                    <TableBody emptyContent="Sin resultados">
                                        {filtrados.map((e) => (
                                            <TableRow key={e.id_empleado}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar isBordered radius="full" size="sm" src={e.avatarUrl} name={e.nombres} />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{e.nombres}</span>
                                                            <span className="text-xs text-default-500">ID: {e.id_empleado}</span>
                                                            {e.telefono ? <span className="text-xs text-default-500">{e.telefono}</span> : null}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{e.cedula}</TableCell>
                                                <TableCell className="break-words">{e.email}</TableCell>
                                                <TableCell className="capitalize">
                                                    <Chip size="sm" variant="flat">{e.rol}</Chip>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Chip color={e.activo ? "success" : "default"} size="sm" variant="flat">
                                                            {e.activo ? "Activo" : "Inactivo"}
                                                        </Chip>
                                                        <Switch
                                                            aria-label={`Cambiar estado de ${e.nombres}`}
                                                            isSelected={e.activo}
                                                            onValueChange={(v) => onToggleActivo(e, v)}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="light" onPress={() => onEdit(e)}>
                                                            <Icon icon="mdi:pencil" width={18} height={18} />
                                                        </Button>
                                                        <Button size="sm" color="danger" variant="light" onPress={() => onDelete(e.id_empleado)}>
                                                            <Icon icon="mdi:trash-can" width={18} height={18} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>

            <EmpleadoModal
                isOpen={modal.isOpen}
                onOpenChange={modal.onOpenChange}
                data={editing}
                setData={setEditing}
                onSave={onSave}
                saving={saving}
            />
        </div>
    );
}

/* ====================== Modal de creación/edición ====================== */
function EmpleadoModal({
    isOpen,
    onOpenChange,
    data,
    setData,
    onSave,
    saving,
}: {
    isOpen: boolean;
    onOpenChange: (v: boolean) => void;
    data: EmpleadoUI | null;
    setData: React.Dispatch<React.SetStateAction<EmpleadoUI | null>>;
    onSave: () => void;
    saving: boolean;
}) {
    if (!data) return null;

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="lg">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="mdi:account" width={20} height={20} />
                            {data.id_empleado ? "Editar empleado" : "Nuevo empleado"}
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombre"
                                    variant="bordered"
                                    value={data.nombre}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, nombre: v, nombres: `${v} ${p.apellido}`.trim() } : p))}
                                    isRequired
                                />
                                <Input
                                    label="Apellido"
                                    variant="bordered"
                                    value={data.apellido}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, apellido: v, nombres: `${p.nombre} ${v}`.trim() } : p))}
                                    isRequired
                                />
                                <Input
                                    label="Cédula"
                                    variant="bordered"
                                    value={data.cedula}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, cedula: v } : p))}
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
                                    value={data.telefono}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, telefono: v } : p))}
                                />
                                <Input
                                    label="ID Empresa"
                                    type="number"
                                    variant="bordered"
                                    value={String(data.id_empresa ?? 0)}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, id_empresa: Number(v) || 0 } : p))}
                                />
                                <Input
                                    label="ID Gimnasio"
                                    type="number"
                                    variant="bordered"
                                    value={String(data.id_gimnasio ?? 0)}
                                    onValueChange={(v) => setData((p) => (p ? { ...p, id_gimnasio: Number(v) || 0 } : p))}
                                />
                                <Select
                                    label="Rol"
                                    variant="bordered"
                                    selectedKeys={[data.rol]}
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0] as RolUI;
                                        setData((p) => (p ? { ...p, rol: key, id_tipo_empleado: mapRolToTipo(key) } : p));
                                    }}
                                >
                                    <SelectItem key="operario">Operario</SelectItem>
                                    <SelectItem key="vendedor">Vendedor</SelectItem>
                                    <SelectItem key="administrador">Administrador</SelectItem>
                                </Select>

                                {!data.id_empleado && (
                                    <Input
                                        label="Contraseña (solo al crear)"
                                        type="password"
                                        variant="bordered"
                                        value={data.contrasena ?? ""}
                                        onValueChange={(v) => setData((p) => (p ? { ...p, contrasena: v } : p))}
                                        description="Mínimo 8 caracteres."
                                    />
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Switch
                                        isSelected={data.activo}
                                        onValueChange={(v) => setData((p) => (p ? { ...p, activo: v } : p))}
                                    >
                                        Activo
                                    </Switch>
                                </div>
                                {data.id_empleado ? (
                                    <Chip size="sm" variant="flat">
                                        ID: {data.id_empleado}
                                    </Chip>
                                ) : null}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button color="primary" onPress={onSave} isLoading={saving}>
                                Guardar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
