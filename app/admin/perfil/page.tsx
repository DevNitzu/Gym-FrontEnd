"use client";

import React from "react";
import {
    Card, CardHeader, CardBody, Button, Input, Avatar, Tabs, Tab,
    Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    useDisclosure, Select, SelectItem, Chip, Spinner, Switch
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/** ===== Tipos de API ===== */
type ApiEmpleado = {
    nombre: string;
    apellido: string;
    cedula: string;
    correo: string;            // user@example.com
    id_empresa: number;
    id_gimnasio: number;
    id_tipo_empleado: number;
    fecha_creacion: string;    // ISO
    id_empleado: number;
    activo: boolean | number | string;
};

/** ===== Modelo UI ===== */
type PerfilData = {
    id_empleado: number;
    id_empresa: number;
    id_gimnasio: number;
    id_tipo_empleado: number;
    nombre: string;
    apellido: string;
    cedula: string;
    email: string;
    telefono: string;   // opcional (tu GET no lo trae)
    rol: "admin" | "editor" | "viewer";
    bio: string;
    avatarUrl?: string;
    activo: boolean;
    creado: string;
};

function toBool(v: any): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    return String(v ?? "").toLowerCase() === "true";
}
function mapTipoToRol(id_tipo_empleado: number): PerfilData["rol"] {
    if (id_tipo_empleado === 1) return "admin";
    if (id_tipo_empleado === 2) return "editor";
    return "viewer";
}
function mapRolToTipo(rol: PerfilData["rol"]): number {
    if (rol === "admin") return 1;
    if (rol === "editor") return 2;
    return 3;
}
function normalizeEmpleado(x: any): PerfilData {
    return {
        id_empleado: Number(x?.id_empleado ?? 0),
        id_empresa: Number(x?.id_empresa ?? 0),
        id_gimnasio: Number(x?.id_gimnasio ?? 0),
        id_tipo_empleado: Number(x?.id_tipo_empleado ?? 0),
        nombre: String(x?.nombre ?? ""),
        apellido: String(x?.apellido ?? ""),
        cedula: String(x?.cedula ?? ""),
        email: String(x?.correo ?? ""),
        telefono: "",
        rol: mapTipoToRol(Number(x?.id_tipo_empleado ?? 0)),
        bio: "",
        avatarUrl: undefined,
        activo: toBool(x?.activo),
        creado: String(x?.fecha_creacion ?? ""),
    };
}

/** ===== Helpers fetch ===== */
async function apiFetch(path: string, init?: RequestInit) {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth:token") : null;
    const headers = new Headers(init?.headers || {});
    headers.set("Accept", "application/json");
    if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store", mode: "cors" });
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = (j?.message || j?.detail || j?.error || msg) as string; } catch { }
        throw new Error(msg);
    }
    return res.json();
}

async function getEmpleadoById(id_empleado: number): Promise<PerfilData> {
    const data = await apiFetch(`/api/v1/empleados/${id_empleado}`);
    // si tu endpoint devuelve 1 objeto directo, normalizamos ese;
    // si devolviera array con 1 item, tomamos el primero:
    const raw = Array.isArray(data) ? data[0] : data;
    return normalizeEmpleado(raw ?? {});
}

async function updateEmpleado(id_empleado: number, patch: Partial<ApiEmpleado>) {
    return apiFetch(`/api/v1/empleados/${id_empleado}`, {
        method: "PUT",
        body: JSON.stringify(patch),
    });
}

/** ===== ID empleado desde ?empleado o localStorage ===== */
function useEmpleadoId(): number | null {
    const sp = useSearchParams();
    const [id, setId] = React.useState<number | null>(null);

    React.useEffect(() => {
        const q = sp.get("empleado");
        if (q) {
            const n = Number(q);
            if (!Number.isNaN(n) && n > 0) {
                setId(n);
                try { localStorage.setItem("auth:empleadoId", String(n)); } catch { }
                return;
            }
        }
        try {
            const saved = localStorage.getItem("auth:empleadoId");
            if (saved) {
                const n = Number(saved);
                if (!Number.isNaN(n) && n > 0) setId(n);
            }
        } catch { }
    }, [sp]);

    return id;
}

/** ===== Página ===== */
export default function PerfilPage() {
    const empleadoId = useEmpleadoId();

    const [data, setData] = React.useState<PerfilData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [message, setMessage] = React.useState<string | null>(null);
    const [err, setErr] = React.useState<string | null>(null);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // Cargar datos del empleado
    React.useEffect(() => {
        let alive = true;
        (async () => {
            if (!empleadoId) { setLoading(false); return; }
            try {
                setLoading(true);
                setErr(null);
                const perfil = await getEmpleadoById(empleadoId);
                if (!alive) return;
                setData(perfil);
            } catch (e: any) {
                if (!alive) return;
                setErr(e?.message || "No se pudo cargar el perfil.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [empleadoId]);

    const onChange = (key: keyof PerfilData, value: string | boolean) => {
        setData(prev => prev ? { ...prev, [key]: value as any } : prev);
    };

    async function handleSave() {
        if (!data) return;
        setSaving(true);
        setMessage(null);
        try {
            const patch: Partial<ApiEmpleado> = {
                nombre: data.nombre,
                apellido: data.apellido,
                cedula: data.cedula,
                correo: data.email,
                id_tipo_empleado: mapRolToTipo(data.rol),
                id_gimnasio: data.id_gimnasio,
                activo: data.activo,
            };
            await updateEmpleado(data.id_empleado, patch);
            setMessage("Cambios guardados correctamente.");
        } catch (e: any) {
            setMessage(e?.message || "No se pudieron guardar los cambios. Intenta de nuevo.");
        } finally {
            setSaving(false);
        }
    }

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setData(prev => prev ? ({ ...prev, avatarUrl: url }) : prev);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Perfil</h1>
                {message && <Chip color={message.includes("correctamente") ? "success" : "warning"} variant="flat">{message}</Chip>}
            </div>

            <Card className="border">
                <CardBody className="space-y-3">
                    {!empleadoId && (
                        <div className="text-center text-sm">
                            Falta <code>id_empleado</code>. Pasa <code>?empleado=ID</code> en la URL
                            o guarda <code>auth:empleadoId</code> en el login.
                        </div>
                    )}
                    {empleadoId && loading && (
                        <div className="flex items-center justify-center py-6">
                            <Spinner />
                        </div>
                    )}
                    {empleadoId && err && (
                        <div className="text-center">
                            <p className="font-medium">No se pudo cargar el perfil.</p>
                            <p className="text-sm text-default-500 mt-1">{err}</p>
                        </div>
                    )}
                </CardBody>
            </Card>

            <Tabs aria-label="Configuración de perfil" color="primary" variant="underlined">
                <Tab
                    key="perfil"
                    title={<div className="flex items-center gap-2"><Icon icon="mdi:account" width={18} height={18} /><span>Perfil</span></div>}
                >
                    <Card className="border">
                        <CardHeader className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar
                                    isBordered
                                    radius="full"
                                    size="lg"
                                    src={data?.avatarUrl}
                                    name={data ? `${data.nombre} ${data.apellido}` : ""}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                    <Button radius="sm" startContent={<Icon icon="mdi:camera-plus" width={18} height={18} />}>
                                        Cambiar foto
                                    </Button>
                                </label>
                                {data?.avatarUrl && (
                                    <Button radius="sm" variant="light" onPress={() => setData(p => p ? ({ ...p, avatarUrl: undefined }) : p)}>
                                        Quitar
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardBody className="space-y-6">
                            {!empleadoId || loading || err || !data ? (
                                <div className="text-sm text-default-500">Carga un empleado para editar su perfil.</div>
                            ) : (
                                <>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Input label="Nombre" variant="bordered" value={data.nombre} onValueChange={(v) => onChange("nombre", v)} />
                                        <Input label="Apellido" variant="bordered" value={data.apellido} onValueChange={(v) => onChange("apellido", v)} />
                                        <Input label="Correo" type="email" variant="bordered" value={data.email} onValueChange={(v) => onChange("email", v)} />
                                        <Input label="Cédula" variant="bordered" value={data.cedula} onValueChange={(v) => onChange("cedula", v)} />
                                        <Input label="Teléfono" variant="bordered" value={data.telefono} onValueChange={(v) => onChange("telefono", v)} />
                                        <Select
                                            label="Rol"
                                            variant="bordered"
                                            selectedKeys={[data.rol]}
                                            onSelectionChange={(keys) => {
                                                const key = Array.from(keys)[0] as PerfilData["rol"];
                                                onChange("rol", key);
                                                setData(p => p ? ({ ...p, id_tipo_empleado: mapRolToTipo(key) }) : p);
                                            }}
                                        >
                                            <SelectItem key="admin">Administrador</SelectItem>
                                            <SelectItem key="editor">Editor</SelectItem>
                                            <SelectItem key="viewer">Visualizador</SelectItem>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Switch isSelected={data.activo} onValueChange={(v) => onChange("activo", v)}>
                                            Activo
                                        </Switch>
                                        <span className="text-xs text-default-500">
                                            Creado: {data.creado ? new Date(data.creado).toLocaleString() : "—"}
                                        </span>
                                    </div>

                                    <Textarea
                                        label="Bio"
                                        placeholder="Cuéntanos un poco sobre ti…"
                                        variant="bordered"
                                        minRows={4}
                                        value={data.bio}
                                        onValueChange={(v) => onChange("bio", v)}
                                    />

                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            color="primary"
                                            isLoading={saving}
                                            startContent={<Icon icon="mdi:content-save" width={18} height={18} />}
                                            onPress={handleSave}
                                            isDisabled={!data}
                                        >
                                            Guardar cambios
                                        </Button>
                                        <Button
                                            variant="bordered"
                                            startContent={<Icon icon="mdi:lock-reset" width={18} height={18} />}
                                            onPress={onOpen}
                                            isDisabled={!data}
                                        >
                                            Cambiar contraseña
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardBody>
                    </Card>
                </Tab>

                <Tab
                    key="seguridad"
                    title={<div className="flex items-center gap-2"><Icon icon="mdi:shield-lock" width={18} height={18} /><span>Seguridad</span></div>}
                >
                    <Card className="border">
                        <CardBody className="space-y-4">
                            <p className="text-default-600">Gestiona tu contraseña y revisa ajustes de seguridad.</p>
                            <div className="flex gap-3">
                                <Button color="primary" onPress={onOpen} isDisabled={!data}>Cambiar contraseña</Button>
                                <Button variant="bordered" startContent={<Icon icon="mdi:logout" width={18} height={18} />}>
                                    Cerrar sesión
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>

            {/* Modal Cambiar contraseña */}
            <ChangePasswordModal isOpen={isOpen} onOpenChange={onOpenChange} empleadoId={data?.id_empleado ?? 0} />
        </div>
    );
}

function ChangePasswordModal({
    isOpen,
    onOpenChange,
    empleadoId,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    empleadoId: number;
}) {
    const [current, setCurrent] = React.useState("");
    const [pwd, setPwd] = React.useState("");
    const [repeat, setRepeat] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [msg, setMsg] = React.useState<string | null>(null);

    async function onSave() {
        setLoading(true);
        setMsg(null);
        try {
            if (pwd.length < 8) throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
            if (pwd !== repeat) throw new Error("Las contraseñas no coinciden.");
            // TODO: Implementa tu endpoint real para cambiar contraseña:
            // await apiFetch(`/api/v1/empleados/${empleadoId}/password`, {
            //   method: "PUT",
            //   body: JSON.stringify({ actual: current, nueva: pwd }),
            // });
            await new Promise((r) => setTimeout(r, 700));
            setMsg("Contraseña actualizada.");
        } catch (e: any) {
            setMsg(e?.message || "No se pudo actualizar la contraseña.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="mdi:lock-reset" width={20} height={20} />
                            Cambiar contraseña
                        </ModalHeader>
                        <ModalBody className="space-y-3">
                            {msg && <Chip color={msg.includes("actualizada") ? "success" : "warning"} variant="flat">{msg}</Chip>}
                            <Input label="Contraseña actual" type="password" variant="bordered" value={current} onValueChange={setCurrent} />
                            <Input label="Nueva contraseña" type="password" variant="bordered" value={pwd} onValueChange={setPwd} description="Mínimo 8 caracteres." />
                            <Input label="Repetir nueva contraseña" type="password" variant="bordered" value={repeat} onValueChange={setRepeat} />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>Cancelar</Button>
                            <Button color="primary" isLoading={loading} onPress={onSave}>Guardar</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
