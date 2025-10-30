"use client";
import React from "react";
import {
    Button, Card, CardBody, CardHeader, Input, Modal, ModalBody, ModalContent,
    ModalFooter, ModalHeader, Select, SelectItem, Spinner, Divider
} from "@heroui/react";
import { Icon } from "@iconify/react";
import {
    ApiCliente, ApiEstadoPago, ApiMembresia, ApiMetodoPago, ApiPrecioMembresia
} from "../../../../lib/types";
import { addDuration, money } from "../../../../lib/utils";
import {
    apiCreateCliente, apiCreateMembresia, apiListClientes,
    apiListEstadosPago, apiListMetodoPagos, apiListPrecioMembresias
} from "../../../../lib/api";
import InfoModal from "../common/InfoModal";

/* ===== Helpers de fecha/hora ===== */
const pad2 = (n: number) => String(n).padStart(2, "0");
const todayLocalYYYYMMDD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const toLocalHHmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const combineLocalDateTimeToISO = (dateStr: string, hhmm: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [h, mm] = hhmm.split(":").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1, h || 0, mm || 0, 0, 0);
    return dt.toISOString();
};

export default function NuevaMembresiaCard({
    id_gimnasio,
    onCreated,
}: {
    id_gimnasio: number;
    onCreated: (m: ApiMembresia) => void;
}) {
    const [planes, setPlanes] = React.useState<ApiPrecioMembresia[]>([]);
    const [clientes, setClientes] = React.useState<ApiCliente[]>([]);
    const [metodos, setMetodos] = React.useState<ApiMetodoPago[]>([]);
    const [estados, setEstados] = React.useState<ApiEstadoPago[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    const [selPlan, setSelPlan] = React.useState<number | null>(null);
    const [selCliente, setSelCliente] = React.useState<number | null>(null);
    const [selMetodo, setSelMetodo] = React.useState<number | null>(null);
    const [selEstado, setSelEstado] = React.useState<number | null>(null);

    const [unidad, setUnidad] = React.useState<string>("mes");
    const [cant, setCant] = React.useState<string>("1");
    const [precioUnit, setPrecioUnit] = React.useState<number>(0);
    const [descuento, setDescuento] = React.useState<string>("0");
    const [renovable, setRenovable] = React.useState(true);

    // UI: fecha + hora (solo minutos)
    const [fecha, setFecha] = React.useState<string>(todayLocalYYYYMMDD());
    const [hora, setHora] = React.useState<string>(toLocalHHmm(new Date()));

    // ISO para backend
    const fechaInicioISO = React.useMemo(() => combineLocalDateTimeToISO(fecha, hora), [fecha, hora]);
    const fechaExpISO = React.useMemo(
        () => addDuration(fechaInicioISO, unidad, Number(cant) || 0),
        [fechaInicioISO, unidad, cant]
    );
    const expLocal = React.useMemo(() => {
        const d = new Date(fechaExpISO);
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${toLocalHHmm(d)}`;
    }, [fechaExpISO]);

    const [saving, setSaving] = React.useState(false);

    // Modales CRUD rápidos
    const [mClienteOpen, setMClienteOpen] = React.useState(false);
    const [okOpen, setOkOpen] = React.useState(false);
    const [errOpen, setErrOpen] = React.useState(false);
    const [errMsg, setErrMsg] = React.useState("");

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
            setPlanes(p);
            setClientes(c);
            setMetodos(mp);
            setEstados(ep);

            if (p[0]) {
                setSelPlan(p[0].id_precio_membresia);
                setUnidad((p[0].tipo || "mes").toLowerCase());
                setPrecioUnit(p[0].precio || 0);
                setCant("1");
            }
            if (c[0]) setSelCliente(c[0].id_cliente);
            if (mp[0]) setSelMetodo(mp[0].id_metodo_pago);
            if (ep[0]) setSelEstado(ep[0].id_estado_pago);
        } catch (e: any) {
            setErr(e?.message || "No se pudo cargar catálogos.");
        } finally {
            setLoading(false);
        }
    }, [id_gimnasio]);

    React.useEffect(() => { reloadBasics(); }, [reloadBasics]);

    React.useEffect(() => {
        const plan = planes.find((x) => x.id_precio_membresia === selPlan);
        if (plan) {
            setUnidad((plan.tipo || unidad).toLowerCase());
            setPrecioUnit(plan.precio || 0);
            setCant("1");
        }
    }, [selPlan, planes]);

    const total = Math.max(0, (precioUnit || 0) * (Number(cant) || 0) - (Number(descuento) || 0));

    const createCliente = async () => {
        try {
            const nombre = (document.getElementById("ncli-nombre") as HTMLInputElement).value.trim();
            const apellido = (document.getElementById("ncli-apellido") as HTMLInputElement).value.trim();
            const cedula = (document.getElementById("ncli-cedula") as HTMLInputElement).value.trim();
            const correo = (document.getElementById("ncli-correo") as HTMLInputElement).value.trim();
            const telefono = (document.getElementById("ncli-telefono") as HTMLInputElement).value.trim();
            if (!nombre || !apellido) {
                setErrMsg("Nombre y apellido son obligatorios.");
                setErrOpen(true);
                return;
            }
            const cli = await apiCreateCliente({ nombre, apellido, cedula, correo, telefono });

            // Añade y selecciona automático
            setClientes((s) => [cli, ...(s || [])]);
            setSelCliente(cli.id_cliente);

            // Cierra el modal en éxito para evitar conflictos con el Select externo
            setMClienteOpen(false);
        } catch (e: any) {
            setErrMsg(e?.message || "No se pudo crear el cliente.");
            setErrOpen(true);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (!selCliente) throw new Error("Selecciona un cliente");
            if (!selPlan) throw new Error("Selecciona un plan");
            if (!selMetodo) throw new Error("Selecciona un método de pago");
            if (!selEstado) throw new Error("Selecciona un estado de pago");

            const cantidad = Math.max(1, Number(cant) || 1);
            const payload: Omit<ApiMembresia, "id_membresia" | "activo"> = {
                id_gimnasio,
                id_cliente: selCliente,
                id_metodo_pago: selMetodo,
                id_estado_pago: selEstado,
                unidad_duracion: unidad,
                cantidad_duracion: cantidad,
                precio_unitario: Number(precioUnit),
                descuento: Number(descuento) || 0,
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
            setErrMsg(e?.__is401 ? "Sesión expirada (401). Inicia sesión." : e?.message || "No se pudo crear la membresía.");
            setErrOpen(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="border">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:card-bold-duotone" className="text-xl" />
                    <span className="font-semibold">Nueva membresía</span>
                </div>
                <div className="text-xs text-foreground-500">Crea y registra el pago con cliente y plan.</div>
            </CardHeader>

            <CardBody className="space-y-4">
                {loading && (
                    <div className="flex items-center gap-2 text-foreground-500">
                        <Spinner size="sm" /> Cargando catálogos…
                    </div>
                )}
                {err && !loading && (
                    <div className="text-danger-500 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold-duotone" />
                        {err}
                    </div>
                )}

                {!loading && (
                    <>
                        {/* --- Cliente --- */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Cliente</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Select
                                    label="Cliente"
                                    selectedKeys={selCliente ? new Set([String(selCliente)]) : new Set([])}
                                    onSelectionChange={(k) => setSelCliente(Number(Array.from(k)[0]))}
                                >
                                    {clientes.map((c) => (
                                        <SelectItem key={c.id_cliente}>
                                            {c.nombre} {c.apellido} • {c.cedula || c.correo || ""}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Button
                                    variant="flat"
                                    onPress={() => setMClienteOpen(true)}
                                    startContent={<Icon icon="solar:user-plus-bold-duotone" />}
                                >
                                    Nuevo cliente
                                </Button>
                            </div>
                        </div>

                        <Divider />

                        {/* --- Plan: botones rápidos --- */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Plan</div>
                            <div className="flex flex-wrap gap-2">
                                {planes.map((p) => {
                                    const active = selPlan === p.id_precio_membresia;
                                    return (
                                        <Button
                                            key={`btn-${p.id_precio_membresia}`}
                                            size="sm"
                                            variant={active ? "solid" : "flat"}
                                            color={active ? "primary" : "default"}
                                            onPress={() => {
                                                setSelPlan(p.id_precio_membresia);
                                                setUnidad((p.tipo || "mes").toLowerCase());
                                                setPrecioUnit(p.precio || 0);
                                                setCant("1");
                                            }}
                                        >
                                            {p.tipo?.toUpperCase()} · {money(p.precio)}
                                        </Button>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Select
                                    label="Unidad"
                                    selectedKeys={new Set([unidad])}
                                    onSelectionChange={(k) => setUnidad(String(Array.from(k)[0]))}
                                >
                                    <SelectItem key="dia">Día</SelectItem>
                                    <SelectItem key="mes">Mes</SelectItem>
                                    <SelectItem key="año">Año</SelectItem>
                                </Select>
                                <Input label="Cantidad" type="number" value={cant} onValueChange={setCant} />
                            </div>
                        </div>

                        <Divider />

                        {/* --- Precios --- */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Precio</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Input
                                    label="Precio unitario"
                                    type="number"
                                    value={String(precioUnit)}
                                    onValueChange={(v) => setPrecioUnit(Number(v) || 0)}
                                />
                                <Input label="Descuento" type="number" value={descuento} onValueChange={setDescuento} />
                                <Input label="Total" isReadOnly value={String(total)} />
                            </div>
                        </div>

                        <Divider />

                        {/* --- Fechas --- */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Fechas</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Input label="Fecha" type="date" value={fecha} onValueChange={setFecha} />
                                <Input label="Hora (HH:mm)" type="time" value={hora} onValueChange={setHora} />
                                <Input label="Expira (calculada)" value={expLocal} isReadOnly description="Según unidad y cantidad" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="flat" onPress={() => { setFecha(todayLocalYYYYMMDD()); }}>
                                    Hoy
                                </Button>
                                <Button size="sm" variant="flat" onPress={() => {
                                    const d = new Date(); d.setDate(d.getDate() + 1);
                                    setFecha(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
                                }}>
                                    Mañana
                                </Button>
                                <Button size="sm" variant="flat" onPress={() => { setHora(toLocalHHmm(new Date())); }}>
                                    Ahora
                                </Button>
                            </div>
                        </div>

                        <Divider />

                        {/* --- Pago --- */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Pago</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Select
                                    label="Método de pago"
                                    selectedKeys={selMetodo ? new Set([String(selMetodo)]) : new Set([])}
                                    onSelectionChange={(k) => setSelMetodo(Number(Array.from(k)[0]))}
                                >
                                    {metodos.map((m) => (
                                        <SelectItem key={m.id_metodo_pago}>{m.nombre}</SelectItem>
                                    ))}
                                </Select>
                                <Select
                                    label="Estado de pago"
                                    selectedKeys={selEstado ? new Set([String(selEstado)]) : new Set([])}
                                    onSelectionChange={(k) => setSelEstado(Number(Array.from(k)[0]))}
                                >
                                    {estados.map((e) => (
                                        <SelectItem key={e.id_estado_pago}>{e.nombre}</SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="text-sm text-foreground-600">
                                Renovable: <span className="ml-2">{renovable ? "Sí" : "No"}</span>
                            </div>
                            <Button
                                color="primary"
                                onPress={handleSave}
                                isLoading={saving}
                                startContent={<Icon icon="solar:check-read-line-duotone" />}
                            >
                                Guardar membresía
                            </Button>
                        </div>
                    </>
                )}
            </CardBody>

            {/* Modal: nuevo cliente rápido (totalmente controlado) */}
            <Modal
                isOpen={mClienteOpen}
                onOpenChange={(open) => setMClienteOpen(open)}
                backdrop="opaque"
                isDismissable={false}
                isKeyboardDismissDisabled
                // Algunas versiones ignoran esto; lo reforzamos más abajo con stopPropagation.
                // @ts-ignore
                shouldCloseOnInteractOutside={() => false}
            >
                <ModalContent
                    // Bloquea burbujeo para que NADA externo dispare cierre
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <Icon icon="solar:user-plus-bold-duotone" />
                                Nuevo cliente
                            </ModalHeader>
                            <ModalBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input id="ncli-nombre" label="Nombre" autoFocus />
                                <Input id="ncli-apellido" label="Apellido" />
                                <Input id="ncli-cedula" label="Cédula" />
                                <Input id="ncli-correo" label="Correo" type="email" />
                                <Input id="ncli-telefono" label="Teléfono" />
                            </ModalBody>
                            <ModalFooter className="justify-between">
                                <Button variant="flat" onPress={() => setMClienteOpen(false)}>
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
                                        onPress={async () => { await createCliente(); setMClienteOpen(false); }}
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

            <InfoModal
                open={okOpen}
                type="success"
                title="Membresía creada"
                message="Se registró la membresía correctamente."
                onClose={() => setOkOpen(false)}
            />
            <InfoModal
                open={errOpen}
                type="error"
                title="Error"
                message={errMsg}
                onClose={() => setErrOpen(false)}
            />
        </Card>
    );
}
