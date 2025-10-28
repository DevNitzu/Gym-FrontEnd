"use client";

import React from "react";
import {
    Card, CardHeader, CardBody, Button, Input, Avatar, Tabs, Tab,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    useDisclosure, Select, SelectItem, Chip, Spinner, Switch
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/* ====================== Tipos ====================== */
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
    activo: boolean | number | string;
};

type PerfilData = {
    id_empleado: number;
    id_empresa: number;
    id_gimnasio: number;
    id_tipo_empleado: number;
    nombre: string;
    apellido: string;
    cedula: string;
    email: string;
    telefono: string;
    rol: "admin" | "editor" | "viewer";
    avatarUrl?: string;
    activo: boolean;
    creado: string;
};

type ApiEmpresa = {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    correo: string;
    fecha_creacion: string;
    activo: boolean | number | string;
    id_empresa: number;
    logo_url?: string | null;
};

type EmpresaEdit = {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    correo: string;
    activo: boolean;
    fecha_creacion: string;
    logo_url?: string | null;  // preview (de API o local)
    _logoFile?: File | null;   // archivo seleccionado
};

/* ====================== Utils ====================== */
function toBool(v: any): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    return String(v ?? "").toLowerCase() === "true";
}
function mapTipoToRol(id: number): PerfilData["rol"] {
    if (id === 1) return "admin";
    if (id === 2) return "editor";
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
        telefono: String(x?.telefono ?? ""),
        rol: mapTipoToRol(Number(x?.id_tipo_empleado ?? 0)),
        avatarUrl: undefined,
        activo: toBool(x?.activo),
        creado: String(x?.fecha_creacion ?? ""),
    };
}

/* ====================== Fetch helpers ====================== */
async function apiFetch(path: string, init?: RequestInit) {
    const url = `${API_BASE}${path}`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth:token") : null;
    const headers = new Headers(init?.headers || {});
    headers.set("Accept", "application/json");
    if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);

    console.debug("[apiFetch]", init?.method || "GET", url, init);

    const res = await fetch(url, { ...init, headers, cache: "no-store", mode: "cors" });
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = (j?.message || j?.detail || j?.error || msg) as string; } catch { }
        throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
}

async function getEmpleadoById(id_empleado: number): Promise<PerfilData> {
    const data = await apiFetch(`/api/v1/empleados/${id_empleado}`);
    console.debug("[api] empleado by id ->", data);
    const raw = Array.isArray(data) ? data[0] : data;
    return normalizeEmpleado(raw ?? {});
}

async function getEmpresaById(id_empresa: number): Promise<ApiEmpresa> {
    return apiFetch(`/api/v1/empresas/${id_empresa}`);
}

async function getEmpleadosByEmpresa(id_empresa: number): Promise<ApiEmpleado[]> {
    console.debug("[api] GET /api/v1/empleados/empresa/", id_empresa);
    const data = await apiFetch(`/api/v1/empleados/empresa/${id_empresa}`);
    return Array.isArray(data) ? (data as ApiEmpleado[]) : [];
}

async function updateEmpleado(id_empleado: number, patch: Partial<ApiEmpleado>) {
    return apiFetch(`/api/v1/empleados/${id_empleado}`, {
        method: "PUT",
        body: JSON.stringify(patch),
    });
}

/** PUT empresa con multipart: envía 5 campos + logo_file (opcional) */
async function updateEmpresaMultipart(
    id_empresa: number,
    body: Pick<EmpresaEdit, "nombre" | "ruc" | "direccion" | "telefono" | "correo"> & {
        activo?: boolean;
        fecha_creacion?: string;
        logoFile?: File | null;
    }
): Promise<ApiEmpresa> {
    const fd = new FormData();
    if (body.logoFile) fd.append("logo_file", body.logoFile);
    fd.append("nombre", body.nombre);
    fd.append("ruc", body.ruc);
    fd.append("direccion", body.direccion);
    fd.append("telefono", body.telefono);
    fd.append("correo", body.correo);
    if (typeof body.activo === "boolean") fd.append("activo", body.activo ? "true" : "false");
    if (body.fecha_creacion) fd.append("fecha_creacion", body.fecha_creacion);

    const res = await fetch(`${API_BASE}/api/v1/empresas/${id_empresa}`, {
        method: "PUT",
        body: fd,
        headers: (() => {
            const h = new Headers();
            const token = typeof window !== "undefined" ? localStorage.getItem("auth:token") : null;
            if (token) h.set("Authorization", `Bearer ${token}`);
            return h;
        })(),
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
    return res.json();
}

/* ====================== Hook id empleado ====================== */
function useEmpleadoId(): [number | null, (n: number) => void] {
    const sp = useSearchParams();

    const initial = React.useMemo(() => {
        const q = sp.get("empleado");
        if (q) {
            const n = Number(q);
            if (!Number.isNaN(n) && n > 0) return n;
        }
        try {
            const saved = localStorage.getItem("auth:empleadoId");
            if (saved) {
                const n = Number(saved);
                if (!Number.isNaN(n) && n > 0) return n;
            }
        } catch { }
        return null;
    }, [sp]);

    const [id, setId] = React.useState<number | null>(initial);

    const setIdAndPersist = React.useCallback((n: number) => {
        setId(n);
        try { localStorage.setItem("auth:empleadoId", String(n)); } catch { }
    }, []);

    React.useEffect(() => {
        const q = sp.get("empleado");
        if (q) {
            const n = Number(q);
            if (!Number.isNaN(n) && n > 0) {
                setId(n);
                try { localStorage.setItem("auth:empleadoId", String(n)); } catch { }
            }
        }
    }, [sp]);

    return [id, setIdAndPersist];
}

/* ====================== Página ====================== */
export default function PerfilPage() {
    const [empleadoId, setEmpleadoId] = useEmpleadoId();

    const [data, setData] = React.useState<PerfilData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [message, setMessage] = React.useState<string | null>(null);
    const [err, setErr] = React.useState<string | null>(null);

    const [empresaId, setEmpresaId] = React.useState<number | null>(null);
    const [empresa, setEmpresa] = React.useState<ApiEmpresa | null>(null);
    const [empresaEdit, setEmpresaEdit] = React.useState<EmpresaEdit | null>(null);
    const [empresaLoading, setEmpresaLoading] = React.useState(false);
    const [empresaSaving, setEmpresaSaving] = React.useState(false);
    const [empresaErr, setEmpresaErr] = React.useState<string | null>(null);
    const [empresaMsg, setEmpresaMsg] = React.useState<string | null>(null);

    const [empleadosEmpresa, setEmpleadosEmpresa] = React.useState<ApiEmpleado[] | null>(null);
    const [listLoading, setListLoading] = React.useState(false);

    const logoRef = React.useRef<HTMLInputElement>(null);
    const lastObjectUrlRef = React.useRef<string | null>(null);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    React.useEffect(() => {
        if (empresaId == null) {
            try {
                const eid = localStorage.getItem("auth:empresa");
                if (eid) {
                    const n = Number(eid);
                    if (!Number.isNaN(n) && n > 0) setEmpresaId(n);
                }
            } catch { }
        }
    }, [empresaId]);

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
                if (perfil.id_empresa && perfil.id_empresa > 0) setEmpresaId(perfil.id_empresa);
            } catch (e: any) {
                if (!alive) return;
                setErr(e?.message || "No se pudo cargar el perfil.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [empleadoId]);

    React.useEffect(() => {
        let alive = true;
        (async () => {
            if (empleadoId || !empresaId) return;
            try {
                setListLoading(true);
                setErr(null);
                const lista = await getEmpleadosByEmpresa(empresaId);
                if (!alive) return;
                setEmpleadosEmpresa(lista);
                if (lista.length === 1) {
                    const unico = lista[0];
                    setEmpleadoId(unico.id_empleado);
                    setMessage(`Empleado ${unico.nombre} ${unico.apellido} cargado automáticamente.`);
                }
            } catch (e: any) {
                if (!alive) return;
                setErr(e?.message || "No se pudo listar empleados de la empresa.");
            } finally {
                if (alive) setListLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [empleadoId, empresaId, setEmpleadoId]);

    const fetchEmpresa = React.useCallback(async (id: number) => {
        try {
            setEmpresaLoading(true);
            setEmpresaErr(null);
            setEmpresaMsg(null);
            const emp = await getEmpresaById(id);
            setEmpresa(emp);
            setEmpresaEdit({
                nombre: emp.nombre || "",
                ruc: emp.ruc || "",
                direccion: emp.direccion || "",
                telefono: emp.telefono || "",
                correo: emp.correo || "",
                activo: toBool(emp.activo),
                fecha_creacion: emp.fecha_creacion || "",
                logo_url: emp.logo_url || null,
                _logoFile: null,
            });
            if (lastObjectUrlRef.current) {
                URL.revokeObjectURL(lastObjectUrlRef.current);
                lastObjectUrlRef.current = null;
            }
        } catch (e: any) {
            setEmpresaErr(e?.message || "No se pudo cargar la empresa.");
        } finally {
            setEmpresaLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (empresaId && empresaId > 0) fetchEmpresa(empresaId);
    }, [empresaId, fetchEmpresa]);

    const onChange = (key: keyof PerfilData, value: string | boolean) => {
        setData(prev => prev ? { ...prev, [key]: value as any } : prev);
    };

    async function updateEmpresaJson(
        id_empresa: number,
        body: {
            nombre: string;
            ruc: string;
            direccion: string;
            telefono: string;
            correo: string;
            activo?: boolean;
            fecha_creacion?: string;
        }
    ): Promise<ApiEmpresa> {
        return apiFetch(`/api/v1/empresas/${id_empresa}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    async function uploadEmpresaLogo(id_empresa: number, file: File): Promise<ApiEmpresa> {
        const fd = new FormData();
        fd.append("logo_file", file);

        const token = typeof window !== "undefined" ? localStorage.getItem("auth:token") : null;
        const res = await fetch(`${API_BASE}/api/v1/empresas/logo/${id_empresa}`, {
            method: "PUT",
            body: fd,
            headers: (() => {
                const h = new Headers();
                if (token) h.set("Authorization", `Bearer ${token}`);
                return h;
            })(),
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
        return res.json();
    }

    async function handleSaveEmpleado() {
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

    function setEmpresaField<K extends keyof EmpresaEdit>(key: K, val: EmpresaEdit[K]) {
        setEmpresaEdit((p) => p ? { ...p, [key]: val } : p);
    }

    function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (lastObjectUrlRef.current) {
            URL.revokeObjectURL(lastObjectUrlRef.current);
            lastObjectUrlRef.current = null;
        }
        const url = URL.createObjectURL(file);
        lastObjectUrlRef.current = url;
        setEmpresaEdit((p) => p ? ({ ...p, _logoFile: file, logo_url: url }) : p);
        setEmpresaMsg("Imagen seleccionada. Se actualizará al guardar.");
    }

    function clearLogo() {
        if (lastObjectUrlRef.current) {
            URL.revokeObjectURL(lastObjectUrlRef.current);
            lastObjectUrlRef.current = null;
        }
        setEmpresaEdit((p) => p ? ({ ...p, _logoFile: null, logo_url: null }) : p);
        if (logoRef.current) logoRef.current.value = "";
        setEmpresaMsg("Imagen quitada.");
    }

    async function handleSaveEmpresa() {
        if (!empresaEdit || !empresaId) return;

        if (
            !empresaEdit.nombre.trim() ||
            !empresaEdit.ruc.trim() ||
            !empresaEdit.direccion.trim() ||
            !empresaEdit.telefono.trim() ||
            !empresaEdit.correo.trim()
        ) {
            setEmpresaMsg("Completa: nombre, ruc, dirección, teléfono y correo.");
            return;
        }

        setEmpresaSaving(true);
        setEmpresaMsg(null);

        try {
            const updatedCampos = await updateEmpresaJson(empresaId, {
                nombre: empresaEdit.nombre,
                ruc: empresaEdit.ruc,
                direccion: empresaEdit.direccion,
                telefono: empresaEdit.telefono,
                correo: empresaEdit.correo,
                activo: empresaEdit.activo,
                fecha_creacion: empresaEdit.fecha_creacion,
            });

            let updatedFinal = updatedCampos;
            if (empresaEdit._logoFile) {
                updatedFinal = await uploadEmpresaLogo(empresaId, empresaEdit._logoFile);
                setEmpresaEdit(p => p ? { ...p, _logoFile: null } : p);
                if (logoRef.current) logoRef.current.value = "";
            }

            setEmpresa(updatedFinal);
            setEmpresaEdit({
                nombre: updatedFinal.nombre,
                ruc: updatedFinal.ruc,
                direccion: updatedFinal.direccion,
                telefono: updatedFinal.telefono,
                correo: updatedFinal.correo,
                activo: toBool(updatedFinal.activo),
                fecha_creacion: updatedFinal.fecha_creacion,
                logo_url: updatedFinal.logo_url || null,
                _logoFile: null,
            });

            setEmpresaMsg(empresaEdit._logoFile ? "Empresa y logo actualizados." : "Empresa actualizada.");
        } catch (e: any) {
            setEmpresaMsg(e?.message || "No se pudo actualizar la empresa.");
        } finally {
            setEmpresaSaving(false);
        }
    }

    React.useEffect(() => {
        return () => {
            if (lastObjectUrlRef.current) {
                URL.revokeObjectURL(lastObjectUrlRef.current);
                lastObjectUrlRef.current = null;
            }
        };
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <h1 className="text-xl sm:text-2xl font-bold">Perfil</h1>
                <div className="flex items-center gap-2">
                    {loading && <Chip variant="flat" color="primary" startContent={<Spinner size="sm" />}>Cargando perfil…</Chip>}
                    {message && (
                        <Chip color={message.includes("correctamente") ? "success" : "warning"} variant="flat">
                            {message}
                        </Chip>
                    )}
                    {err && <Chip color="warning" variant="flat">{err}</Chip>}
                </div>
            </div>

            <Tabs aria-label="Configuración de perfil" color="primary" variant="underlined">
                {/* ===== PERFIL ===== */}
                <Tab key="perfil" title={<div className="flex items-center gap-2"><Icon icon="mdi:account" width={18} height={18} /><span>Información</span></div>}>
                    <Card className="border">
                        <CardBody className="space-y-6">
                            {!empleadoId ? (
                                <div className="space-y-4">
                                    {listLoading ? (
                                        <div className="flex items-center gap-2 text-default-500 text-sm">
                                            <Spinner size="sm" /> Buscando empleados de la empresa…
                                        </div>
                                    ) : empleadosEmpresa && empleadosEmpresa.length > 0 ? (
                                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                                            <Select
                                                label="Selecciona un empleado"
                                                variant="bordered"
                                                className="min-w-[260px]"
                                                onSelectionChange={(keys) => {
                                                    const key = Array.from(keys)[0] as string;
                                                    const n = Number(key);
                                                    if (!Number.isNaN(n) && n > 0) setEmpleadoId(n);
                                                }}
                                            >
                                                {empleadosEmpresa.map(emp => (
                                                    <SelectItem key={emp.id_empleado}>
                                                        {emp.nombre} {emp.apellido} — #{emp.id_empleado}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                            <Chip variant="flat" color="success">
                                                {empleadosEmpresa.length} encontrados
                                            </Chip>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-default-500">
                                            Carga un empleado para editar su perfil. Si conoces el ID, abre la página como <code>?empleado=123</code>.
                                        </div>
                                    )}
                                </div>
                            ) : (!data || loading) ? (
                                <div className="flex items-center gap-2 text-default-500 text-sm">
                                    <Spinner size="sm" /> Cargando datos…
                                </div>
                            ) : err ? (
                                <div className="text-sm text-default-500">{err}</div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <Switch isSelected={data.activo} onValueChange={(v) => onChange("activo", v)}>Activo</Switch>
                                        <span className="text-xs text-default-500">
                                            Creado: {data.creado ? new Date(data.creado).toLocaleString() : "—"}
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                        <Button
                                            className="w-full sm:w-auto"
                                            color="primary"
                                            isLoading={saving}
                                            startContent={<Icon icon="mdi:content-save" width={18} height={18} />}
                                            onPress={handleSaveEmpleado}
                                            isDisabled={!data}
                                        >
                                            Guardar cambios
                                        </Button>
                                        <Button
                                            className="w-full sm:w-auto"
                                            variant="flat"
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

                {/* ===== EMPRESA ===== */}
                <Tab key="empresa" title={<div className="flex items-center gap-2"><Icon icon="mdi:office-building" width={18} height={18} /><span>Empresa</span></div>}>
                    <Card className="border">
                        <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
                            <div className="flex items-center gap-2">
                                <Icon icon="mdi:office-building" width={20} height={20} />
                                <span className="font-semibold">Datos de la empresa</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {empresaLoading && (
                                    <Chip variant="flat" color="primary" startContent={<Spinner size="sm" />}>
                                        Cargando…
                                    </Chip>
                                )}
                                {!empresaLoading && empresaId && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        startContent={<Icon icon="mdi:refresh" width={16} height={16} />}
                                        onPress={() => fetchEmpresa(empresaId)}
                                    >
                                        Refrescar
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        {(empresaErr || empresaMsg) && (
                            <div className="px-3 sm:px-6 -mt-2 sm:-mt-3">
                                {empresaErr && <Chip color="warning" variant="flat">{empresaErr}</Chip>}
                                {empresaMsg && !empresaErr && (
                                    <Chip color={empresaMsg.includes("No se pudo") ? "warning" : "success"} variant="flat">{empresaMsg}</Chip>
                                )}
                            </div>
                        )}

                        <CardBody className="space-y-6">
                            {!empresaEdit ? (
                                empresaLoading ? (
                                    <div className="flex items-center gap-2 text-default-500 text-sm">
                                        <Spinner size="sm" /> Cargando datos…
                                    </div>
                                ) : (
                                    <div className="text-sm text-default-500">No hay datos de empresa para este usuario.</div>
                                )
                            ) : (
                                <>
                                    <input
                                        ref={logoRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={onPickLogo}
                                    />

                                    <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4">
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => logoRef.current?.click()}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); logoRef.current?.click(); }
                                            }}
                                            className="relative rounded-full outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer self-start"
                                            title="Cambiar logo"
                                        >
                                            <Avatar
                                                isBordered
                                                radius="full"
                                                className="h-16 w-16 sm:h-20 sm:w-20"
                                                src={empresaEdit.logo_url || undefined}
                                                name={empresaEdit.nombre || "Empresa"}
                                            />
                                            <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                                                <Icon icon="mdi:camera-plus" width={14} height={14} />
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                                className="w-full sm:w-auto"
                                                variant="flat"
                                                startContent={<Icon icon="mdi:image-multiple" width={18} height={18} />}
                                                onPress={() => logoRef.current?.click()}
                                            >
                                                Elegir imagen
                                            </Button>
                                            {empresaEdit.logo_url && (
                                                <Button
                                                    className="w-full sm:w-auto"
                                                    variant="bordered"
                                                    color="danger"
                                                    startContent={<Icon icon="mdi:close" width={18} height={18} />}
                                                    onPress={clearLogo}
                                                >
                                                    Quitar imagen
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-default-100">
                                        <Input
                                            label="Nombre empresa"
                                            variant="bordered"
                                            value={empresaEdit.nombre}
                                            onValueChange={(v) => setEmpresaField("nombre", v)}
                                            isRequired
                                        />
                                        <Input
                                            label="RUC"
                                            variant="bordered"
                                            value={empresaEdit.ruc}
                                            onValueChange={(v) => setEmpresaField("ruc", v)}
                                            isRequired
                                        />
                                        <Input
                                            label="Dirección"
                                            variant="bordered"
                                            value={empresaEdit.direccion}
                                            onValueChange={(v) => setEmpresaField("direccion", v)}
                                            isRequired
                                        />
                                        <Input
                                            label="Teléfono"
                                            variant="bordered"
                                            value={empresaEdit.telefono}
                                            onValueChange={(v) => setEmpresaField("telefono", v)}
                                            isRequired
                                        />
                                        <Input
                                            label="Correo empresa"
                                            type="email"
                                            variant="bordered"
                                            value={empresaEdit.correo}
                                            onValueChange={(v) => setEmpresaField("correo", v)}
                                            isRequired
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                isSelected={empresaEdit.activo}
                                                onValueChange={(v) => setEmpresaField("activo", v)}
                                            >
                                                Activo
                                            </Switch>
                                        </div>
                                        <Input
                                            label="Fecha de creación"
                                            variant="bordered"
                                            value={empresaEdit.fecha_creacion ? new Date(empresaEdit.fecha_creacion).toLocaleString() : "—"}
                                            isReadOnly
                                        />
                                        <div className="hidden md:block" />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                        <Button
                                            className="w-full sm:w-auto"
                                            color="primary"
                                            startContent={<Icon icon="mdi:content-save" width={18} height={18} />}
                                            onPress={handleSaveEmpresa}
                                            isLoading={empresaSaving}
                                            isDisabled={empresaSaving}
                                        >
                                            Guardar cambios {empresaEdit?._logoFile ? "y subir logo" : ""}
                                        </Button>

                                        {empresaId && (
                                            <Button
                                                className="w-full sm:w-auto"
                                                variant="bordered"
                                                startContent={<Icon icon="mdi:refresh" width={18} height={18} />}
                                                onPress={() => fetchEmpresa(empresaId)}
                                                isDisabled={empresaSaving}
                                            >
                                                Descartar cambios
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardBody>
                    </Card>
                </Tab>

                {/* ===== SEGURIDAD (Modal de contraseña ya integrado con API) ===== */}
                <Tab key="seguridad" title={<div className="flex items-center gap-2"><Icon icon="mdi:shield-lock" width={18} height={18} /><span>Seguridad</span></div>}>
                    <Card className="border">
                        <CardBody className="space-y-4">
                            <p className="text-default-600">Gestiona tu contraseña y revisa ajustes de seguridad.</p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <Button className="w-full sm:w-auto" color="primary" onPress={onOpen} isDisabled={!data}>
                                    Cambiar contraseña
                                </Button>
                                <Button className="w-full sm:w-auto" variant="bordered" startContent={<Icon icon="mdi:logout" width={18} height={18} />}>
                                    Cerrar sesión
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>

            <ChangePasswordModal isOpen={isOpen} onOpenChange={onOpenChange} empleadoId={data?.id_empleado ?? 0} />
        </div>
    );
}

/* ====================== Modal contraseña (PUT /api/v1/empleados/{id} con { contrasena }) ====================== */
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
            if (!empleadoId || empleadoId <= 0) throw new Error("Empleado inválido.");
            if (pwd.length < 8) throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
            if (pwd !== repeat) throw new Error("Las contraseñas no coinciden.");

            // Si tu backend exige validar la actual, podrías enviarla también, ej. { contrasena_actual: current, contrasena: pwd }
            // Según tu esquema, basta con enviar "contrasena"
            await apiFetch(`/api/v1/empleados/${empleadoId}`, {
                method: "PUT",
                body: JSON.stringify({ contrasena: pwd }),
            });

            setMsg("Contraseña actualizada correctamente.");
            setCurrent("");
            setPwd("");
            setRepeat("");
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
                            {msg && <Chip color={msg.includes("correctamente") ? "success" : "warning"} variant="flat">{msg}</Chip>}
                            <Input
                                label="Contraseña actual"
                                type="password"
                                variant="bordered"
                                value={current}
                                onValueChange={setCurrent}
                            />
                            <Input
                                label="Nueva contraseña"
                                type="password"
                                variant="bordered"
                                value={pwd}
                                onValueChange={setPwd}
                                description="Mínimo 8 caracteres."
                            />
                            <Input
                                label="Repetir nueva contraseña"
                                type="password"
                                variant="bordered"
                                value={repeat}
                                onValueChange={setRepeat}
                            />
                        </ModalBody>
                        <ModalFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <Button className="w-full sm:w-auto" variant="light" onPress={onClose}>Cancelar</Button>
                            <Button className="w-full sm:w-auto" color="primary" isLoading={loading} onPress={onSave}>Guardar</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
