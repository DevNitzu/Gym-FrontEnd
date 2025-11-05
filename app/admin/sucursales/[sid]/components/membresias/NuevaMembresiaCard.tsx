"use client";
import React from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Spinner,
    Chip,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import {
    ApiCliente,
    ApiEstadoPago,
    ApiMembresia,
    ApiMetodoPago,
    ApiPrecioMembresia,
} from "../../../../lib/types";
import { addDuration, money } from "../../../../lib/utils";
import {
    apiCreateCliente,
    apiCreateMembresia,
    apiListClientes,
    apiListEstadosPago,
    apiListMetodoPagos,
    apiListPrecioMembresias,
} from "../../../../lib/api";
import InfoModal from "../common/InfoModal";

/* ===== Helpers fecha ===== */
const pad2 = (n: number) => String(n).padStart(2, "0");
const todayLocalYYYYMMDD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
// ISO a medianoche (no mostramos hora)
const dateOnlyToISOAtMidnight = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0);
    return dt.toISOString();
};
const toYYYYMMDD = (v: string | Date) => {
    const d = v instanceof Date ? v : new Date(v);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export default function NuevaMembresiaCard({
    id_gimnasio,
    onCreated,
}: {
    id_gimnasio: number;
    onCreated: (m: ApiMembresia) => void;
}) {
    /* ===== Catálogos ===== */
    const [planes, setPlanes] = React.useState<ApiPrecioMembresia[]>([]);
    const [clientes, setClientes] = React.useState<ApiCliente[]>([]);
    const [metodos, setMetodos] = React.useState<ApiMetodoPago[]>([]);
    const [estados, setEstados] = React.useState<ApiEstadoPago[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    /* ===== Selecciones ===== */
    const [selPlan, setSelPlan] = React.useState<number | null>(null);
    const [selCliente, setSelCliente] = React.useState<number | null>(null);
    const [selMetodo, setSelMetodo] = React.useState<number | null>(null);
    const [selEstado, setSelEstado] = React.useState<number | null>(null);

    /* ===== Parámetros del plan ===== */
    const [unidad, setUnidad] = React.useState<string>("mes");
    const [cant, setCant] = React.useState<string>("1");
    const [precioUnit, setPrecioUnit] = React.useState<number>(0);

    // Descuento en PORCENTAJE ENTERO 0..100 (UI)
    const [descuentoPct, setDescuentoPct] = React.useState<number>(0);
    const [showDesc, setShowDesc] = React.useState<boolean>(false);

    const [renovable] = React.useState(true);

    /* ===== Fechas ===== */
    const [fecha, setFecha] = React.useState<string>(todayLocalYYYYMMDD());
    const fechaInicioISO = React.useMemo(() => dateOnlyToISOAtMidnight(fecha), [fecha]);
    const fechaExpISO = React.useMemo(
        () => addDuration(fechaInicioISO, unidad, Number(cant) || 0),
        [fechaInicioISO, unidad, cant]
    );
    const expLocalDate = React.useMemo(() => toYYYYMMDD(fechaExpISO), [fechaExpISO]);

    const [saving, setSaving] = React.useState(false);

    /* ===== Modales ===== */
    const [mClienteOpen, setMClienteOpen] = React.useState(false);
    const [okOpen, setOkOpen] = React.useState(false);
    const [errOpen, setErrOpen] = React.useState(false);
    const [errMsg, setErrMsg] = React.useState("");

    /* ===== Borrador para prellenar modal de cliente ===== */
    const [draftCliente, setDraftCliente] = React.useState<Partial<ApiCliente>>({});

    /* ===== Búsqueda (LIKE) en Paso 2 ===== */
    const [cliText, setCliText] = React.useState<string>(""); // lo que escribe el usuario

    const normalized = (s?: string) =>
        (s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

    const clienteMatches = React.useMemo(() => {
        const q = normalized(cliText);
        if (!q) return clientes;
        return clientes.filter((c) => {
            const full = `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim();
            return (
                normalized(full).includes(q) ||
                normalized(c.cedula).includes(q) ||
                normalized(c.telefono).includes(q) ||
                normalized(c.correo).includes(q)
                // ⚠️ Evita buscar por contraseña en UI/cliente por seguridad.
            );
        });
    }, [cliText, clientes]);

    const selectedClienteObj = React.useMemo(
        () => clientes.find((c) => c.id_cliente === selCliente) || null,
        [clientes, selCliente]
    );

    /* ===== Carga inicial ===== */
    const reloadBasics = React.useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const [p, c, mp, ep] = await Promise.all([
                apiListPrecioMembresias(id_gimnasio),
                apiListClientes(),
                apiListMetodoPagos(),
                apiListEstadosPago(),
            ]);

            setPlanes(p || []);
            setClientes(c || []);
            setMetodos(mp || []);
            setEstados(ep || []);

            if (mp?.length && !selMetodo) setSelMetodo(mp[0].id_metodo_pago);
            if (ep?.length && !selEstado) setSelEstado(ep[0].id_estado_pago);

            const planMes =
                p.find((x) => (x.tipo || "").toLowerCase() === "mes") || p[0];
            if (planMes) {
                setSelPlan(planMes.id_precio_membresia);
                setUnidad((planMes.tipo || "mes").toLowerCase());
                setPrecioUnit(planMes.precio || 0);
                setCant("1");
            }
        } catch (e: any) {
            setErr(e?.message || "No se pudo cargar catálogos.");
        } finally {
            setLoading(false);
        }
    }, [id_gimnasio, selMetodo, selEstado]);

    React.useEffect(() => {
        reloadBasics();
    }, [reloadBasics]);

    React.useEffect(() => {
        const plan = planes.find((x) => x.id_precio_membresia === selPlan);
        if (plan) {
            setUnidad((plan.tipo || unidad).toLowerCase());
            setPrecioUnit(plan.precio || 0);
            setCant("1");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selPlan, planes]);

    /* ===== Derivados ===== */
    const selectedCliente = selectedClienteObj;
    const pct = Math.min(100, Math.max(0, Math.round(Number(descuentoPct) || 0)));
    const pctFrac = pct / 100;
    const subtotal = (precioUnit || 0) * (Number(cant) || 0);
    const total = Math.max(0, subtotal * (1 - pctFrac));
    const canSave = !!(selCliente && selPlan && selMetodo && selEstado);

    /* ===== Featured plans ===== */
    const featuredPlans = React.useMemo(() => {
        if (!planes?.length) return [] as ApiPrecioMembresia[];
        const idx: Record<string, ApiPrecioMembresia | undefined> = {};
        for (const t of ["dia", "mes", "año"])
            idx[t] = planes.find((p) => (p.tipo || "").toLowerCase() === t);
        const base = [idx["dia"], idx["mes"], idx["año"]].filter(Boolean) as ApiPrecioMembresia[];
        if (base.length >= 3) return base.slice(0, 3);
        const taken = new Set(base.map((p) => p.id_precio_membresia));
        const rest = planes
            .filter((p) => !taken.has(p.id_precio_membresia))
            .sort((a, b) => (a.precio || 0) - (b.precio || 0));
        return [...base, ...rest].slice(0, 3);
    }, [planes]);

    const pickPlan = (p: ApiPrecioMembresia) => {
        setSelPlan(p.id_precio_membresia);
        setUnidad((p.tipo || "mes").toLowerCase());
        setPrecioUnit(p.precio || 0);
        setCant("1");
    };

    /* ===== Helpers: prellenar modal desde texto libre ===== */
    const prefillFromFreeText = (text: string) => {
        const raw = (text || "").trim();
        const parts = raw.split(/\s+/);
        const nombre = parts.shift() || raw;
        const apellido = parts.join(" ");
        setDraftCliente({ nombre, apellido, contrasena: "12345678" });
        setMClienteOpen(true);
    };

    /* ===== Crear cliente rápido (modal) ===== */
    const createCliente = async () => {
        try {
            const nombre = (document.getElementById("ncli-nombre") as HTMLInputElement)?.value?.trim();
            const apellido = (document.getElementById("ncli-apellido") as HTMLInputElement)?.value?.trim();
            const cedula = (document.getElementById("ncli-cedula") as HTMLInputElement)?.value?.trim();
            const correo = (document.getElementById("ncli-correo") as HTMLInputElement)?.value?.trim();
            const telefono = (document.getElementById("ncli-telefono") as HTMLInputElement)?.value?.trim();
            const contrasenaInput = (document.getElementById("ncli-contrasena") as HTMLInputElement)?.value?.trim();

            if (!nombre || !apellido) {
                setErrMsg("Nombre y apellido son obligatorios.");
                setErrOpen(true);
                return;
            }

            // 🔐 Regla: por defecto la contraseña = cédula (y si no hay cédula, fallback opcional)
            const contrasena = contrasenaInput || cedula;

            const cli = await apiCreateCliente({ nombre, apellido, cedula, correo, telefono, contrasena });
            setClientes((s) => [cli, ...(s || [])]);
            setSelCliente(cli.id_cliente);
            setCliText(`${cli.nombre ?? ""} ${cli.apellido ?? ""}`.trim());
            setMClienteOpen(false);
            setDraftCliente({});
        } catch (e: any) {
            setErrMsg(e?.message || "No se pudo crear el cliente.");
            setErrOpen(true);
        }
    };

    /* ===== Crear desde texto libre del Autocomplete -> ABRIR MODAL ===== */
    const createFromFreeText = async () => {
        const raw = (cliText || "").trim();
        if (!raw) return;
        prefillFromFreeText(raw);
    };

    /* ===== Guardar membresía ===== */
    const handleSave = async () => {
        try {
            setSaving(true);
            if (!canSave) throw new Error("Faltan datos: cliente, plan, método y estado.");

            const cantidad = Math.max(1, Number(cant) || 1);
            const payload: Omit<ApiMembresia, "id_membresia" | "activo"> = {
                id_gimnasio,
                id_cliente: selCliente!,
                id_metodo_pago: selMetodo!,
                id_estado_pago: selEstado!,
                unidad_duracion: unidad,
                cantidad_duracion: cantidad,
                precio_unitario: Number(precioUnit),
                descuento: pctFrac,
                precio_total: total,
                fecha_creacion: new Date().toISOString(),
                fecha_inicio: fechaInicioISO,
                fecha_expiracion: fechaExpISO,
                renovable,
            };

            const created = await apiCreateMembresia(payload);
            onCreated(created);
            setOkOpen(true);
            await reloadBasics();
        } catch (e: any) {
            setErrMsg(
                e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo crear la membresía."
            );
            setErrOpen(true);
        } finally {
            setSaving(false);
        }
    };

    /* ===== UI ===== */
    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:card-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Nueva membresía</span>
                </div>
                <div className="text-xs text-foreground-500">Registro rápido con 3 pasos</div>
            </CardHeader>

            <CardBody className="space-y-4">
                {loading && (
                    <div className="flex items-center gap-2 text-foreground-500">
                        <Spinner size="sm" /> Cargando…
                    </div>
                )}
                {err && !loading && (
                    <div className="text-danger-500 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold-duotone" />
                        {err}
                    </div>
                )}

                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* ===== Columna izquierda (2/3) ===== */}
                        <div className="md:col-span-2 space-y-4">
                            {/* Paso 1: Elige el plan */}
                            <section className="space-y-2">
                                <div className="text-sm font-medium">1) Elige el plan</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {featuredPlans.map((p) => {
                                        const active = selPlan === p.id_precio_membresia;
                                        const labelTipo = (p.tipo || "").toUpperCase();
                                        return (
                                            <Button
                                                key={`plan-${p.id_precio_membresia}`}
                                                size="lg"
                                                variant={active ? "solid" : "flat"}
                                                color={active ? "primary" : "default"}
                                                onPress={() => pickPlan(p)}
                                                className={[
                                                    "w-full h-20 px-5 justify-start text-left shadow-sm rounded-2xl",
                                                    active ? "ring-2 ring-primary-400 shadow-md" : "hover:shadow-md",
                                                ].join(" ")}
                                                startContent={<Icon icon="solar:ticket-bold-duotone" className="text-2xl opacity-90" />}
                                            >
                                                <div className="flex flex-col leading-tight">
                                                    <span className="text-base font-bold tracking-wide">{labelTipo}</span>
                                                    <span className="text-sm opacity-80">{money(p.precio)}</span>
                                                    <span className="text-xs opacity-60">Tap para seleccionar</span>
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Paso 2: Cliente (Autocomplete: escribir LIKE o seleccionar) */}
                            <section className="space-y-2">
                                <div className="text-sm font-medium">2) Cliente</div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="min-w-[280px] w-full sm:w-[380px]">
                                        <Autocomplete
                                            label="Buscar o seleccionar cliente"
                                            placeholder="Escribe nombre, cédula, teléfono o correo…"
                                            inputValue={cliText}
                                            onInputChange={(val) => {
                                                setCliText(val);
                                            }}
                                            selectedKey={selCliente ? String(selCliente) : null}
                                            onSelectionChange={(key) => {
                                                if (key) {
                                                    const id = Number(key);
                                                    const c = clientes.find((x) => x.id_cliente === id);
                                                    if (c) {
                                                        setSelCliente(id);
                                                        setCliText(`${c?.nombre ?? ""} ${c?.apellido ?? ""}`.trim());
                                                        return;
                                                    }
                                                    // Si llega un key que no corresponde, abrimos modal desde el texto actual
                                                    if (cliText.trim()) prefillFromFreeText(cliText);
                                                    setSelCliente(null);
                                                    return;
                                                }
                                                // Sin key (valor libre o se limpió)
                                                const exact = clienteMatches.some(
                                                    (c) =>
                                                        `${(c.nombre ?? "").trim()} ${(c.apellido ?? "").trim()}`
                                                            .trim()
                                                            .toLowerCase() === cliText.trim().toLowerCase()
                                                );
                                                if (cliText.trim() && !exact) {
                                                    prefillFromFreeText(cliText);
                                                } else {
                                                    setSelCliente(null);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    const exactMatch = clienteMatches.some(
                                                        (c) =>
                                                            `${(c.nombre ?? "").trim()} ${(c.apellido ?? "").trim()}`
                                                                .trim()
                                                                .toLowerCase() === cliText.trim().toLowerCase()
                                                    );
                                                    if (cliText.trim() && !exactMatch) {
                                                        e.preventDefault();
                                                        prefillFromFreeText(cliText);
                                                    }
                                                }
                                            }}
                                            allowsCustomValue
                                            defaultItems={clienteMatches}
                                            isLoading={!clientes.length && loading}
                                            startContent={<Icon icon="solar:user-bold-duotone" />}
                                            items={clienteMatches}
                                        >
                                            {(c: ApiCliente) => (
                                                <AutocompleteItem key={String(c.id_cliente)} textValue={`${c.nombre} ${c.apellido}`}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {c.nombre} {c.apellido}
                                                        </span>
                                                        <span className="text-xs opacity-70">
                                                            {c.cedula ? `CI: ${c.cedula} · ` : ""}
                                                            {c.telefono || ""}{c.telefono && c.correo ? " · " : ""}{c.correo || ""}
                                                        </span>
                                                    </div>
                                                </AutocompleteItem>
                                            )}
                                        </Autocomplete>
                                    </div>

                                    {/* Crear desde texto si no existe -> abre modal */}
                                    {cliText.trim() &&
                                        !clienteMatches.some(
                                            (c) =>
                                                `${(c.nombre ?? "").trim()} ${(c.apellido ?? "").trim()}`
                                                    .trim()
                                                    .toLowerCase() === cliText.trim().toLowerCase()
                                        ) && (
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                onPress={createFromFreeText}
                                                startContent={<Icon icon="solar:user-plus-bold-duotone" />}
                                            >
                                                Crear “{cliText.trim()}”
                                            </Button>
                                        )}

                                    {/* Crear con formulario completo */}
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        onPress={() => {
                                            setDraftCliente({ contrasena: "12345678" });
                                            setMClienteOpen(true);
                                        }}
                                        startContent={<Icon icon="solar:user-plus-bold-duotone" />}
                                    >
                                        Nuevo
                                    </Button>
                                </div>
                            </section>

                            {/* Paso 3: Resumen / acciones rápidas */}
                            <section className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <Chip variant="flat">Cantidad: {cant}</Chip>
                                    <Chip variant="flat">Expira: {expLocalDate}</Chip>
                                    <Chip color="success" variant="flat">Total: {money(total)}</Chip>
                                    {pct > 0 && <Chip color="primary" variant="flat">Descuento: {pct}%</Chip>}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        onPress={() => setShowDesc((s) => !s)}
                                        startContent={<Icon icon="solar:discount-bold-duotone" />}
                                    >
                                        {showDesc ? "Ocultar descuento" : "Agregar descuento"}
                                    </Button>

                                    {showDesc && (
                                        <Select
                                            aria-label="Atajos de descuento"
                                            className="w-[160px]"
                                            selectedKeys={new Set([String(pct)])}
                                            onSelectionChange={(k) => {
                                                const v = Number(Array.from(k)[0] || 0);
                                                setDescuentoPct(v);
                                            }}
                                            items={[
                                                { id: "0", label: "0%" },
                                                { id: "10", label: "10%" },
                                                { id: "15", label: "15%" },
                                                { id: "20", label: "20%" },
                                                { id: "25", label: "25%" },
                                                { id: "50", label: "50%" },
                                                { id: "100", label: "100%" },
                                            ]}
                                            renderValue={(items) => items.map((i) => (i as any).data?.label).join(", ")}
                                        >
                                            {(it: any) => <SelectItem key={it.id}>{it.label}</SelectItem>}
                                        </Select>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* ===== Columna derecha (panel de pago) ===== */}
                        <aside className="md:col-span-1">
                            <div className="md:sticky md:top-4 space-y-3">
                                <Card className="border">
                                    <CardHeader className="py-3">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:wallet-2-bold-duotone" className="text-xl" />
                                            <span className="font-semibold">Opciones de pago</span>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="space-y-3">
                                        <Select
                                            label="Método de pago"
                                            items={metodos.map((m) => ({ id: String(m.id_metodo_pago), nombre: m.nombre }))}
                                            selectedKeys={selMetodo ? new Set([String(selMetodo)]) : new Set([])}
                                            onSelectionChange={(k) => setSelMetodo(Number(Array.from(k)[0]))}
                                            isLoading={!metodos.length && loading}
                                            isDisabled={!metodos.length}
                                            renderValue={(items) => items.map((i) => (i as any).data?.nombre).join(", ")}
                                            className="w-full"
                                        >
                                            {(item) => <SelectItem key={item.id}>{item.nombre}</SelectItem>}
                                        </Select>

                                        <Select
                                            label="Estado de pago"
                                            items={estados.map((e) => ({ id: String(e.id_estado_pago), nombre: e.nombre }))}
                                            selectedKeys={selEstado ? new Set([String(selEstado)]) : new Set([])}
                                            onSelectionChange={(k) => setSelEstado(Number(Array.from(k)[0]))}
                                            isLoading={!estados.length && loading}
                                            isDisabled={!estados.length}
                                            renderValue={(items) => items.map((i) => (i as any).data?.nombre).join(", ")}
                                            className="w-full"
                                        >
                                            {(item) => <SelectItem key={item.id}>{item.nombre}</SelectItem>}
                                        </Select>

                                        <div className="flex items-center justify-between rounded-xl border px-3 py-2 bg-content1/40">
                                            <span className="text-sm opacity-80">Total a cobrar</span>
                                            <span className="text-lg font-semibold">{money(total)}</span>
                                        </div>

                                        <Button
                                            color="primary"
                                            size="lg"
                                            onPress={handleSave}
                                            isLoading={saving}
                                            isDisabled={!canSave}
                                            className="w-full shadow-md hover:shadow-lg"
                                            startContent={<Icon icon="solar:check-read-line-duotone" className="text-xl" />}
                                        >
                                            Confirmar y guardar
                                        </Button>
                                    </CardBody>
                                </Card>
                            </div>
                        </aside>
                    </div>
                )}
            </CardBody>

            {/* ===== Modal: nuevo cliente (form) ===== */}
            <Modal
                isOpen={mClienteOpen}
                onOpenChange={setMClienteOpen}
                backdrop="opaque"
                isDismissable={false}
                isKeyboardDismissDisabled
                // @ts-ignore
                shouldCloseOnInteractOutside={() => false}
            >
                <ModalContent onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    {() => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <Icon icon="solar:user-plus-bold-duotone" />
                                Nuevo cliente
                            </ModalHeader>
                            <ModalBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input id="ncli-nombre" label="Nombre" autoFocus defaultValue={draftCliente.nombre ?? ""} />
                                <Input id="ncli-apellido" label="Apellido" defaultValue={draftCliente.apellido ?? ""} />
                                <Input id="ncli-cedula" label="Cédula" defaultValue={draftCliente.cedula ?? ""} />
                                <Input id="ncli-correo" label="Correo" type="email" defaultValue={draftCliente.correo ?? ""} />
                                <Input id="ncli-telefono" label="Teléfono" defaultValue={draftCliente.telefono ?? ""} />
                                <Input
                                    id="ncli-contrasena"
                                    label="Contraseña (por defecto: cédula)"
                                    type="password"
                                    defaultValue={draftCliente.contrasena ?? ""}
                                />

                            </ModalBody>
                            <ModalFooter className="justify-between">
                                <Button variant="flat" onPress={() => { setMClienteOpen(false); setDraftCliente({}); }}>
                                    Cerrar
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="flat"
                                        onPress={createCliente}
                                        startContent={<Icon icon="solar:user-plus-bold-duotone" />}
                                    >
                                        Guardar
                                    </Button>
                                    <Button
                                        color="primary"
                                        onPress={async () => {
                                            await createCliente();
                                            setMClienteOpen(false);
                                        }}
                                        startContent={<Icon icon="solar:check-read-line-duotone" />}
                                    >
                                        Guardar y cerrar
                                    </Button>
                                </div>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Info modals */}
            <InfoModal
                open={okOpen}
                type="success"
                title="Membresía creada"
                message="Se registró la membresía correctamente."
                onClose={() => setOkOpen(false)}
            />
            <InfoModal open={errOpen} type="error" title="Error" message={errMsg} onClose={() => setErrOpen(false)} />
        </Card>
    );
}
