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
    Spinner,
    Select,
    SelectItem,
    Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { ApiCliente } from "../../../../lib/types";
import {
    apiCreateCliente,
    apiDeleteCliente,
    apiListClientes,
    apiUpdateCliente,
} from "../../../../lib/api";

/** ===== Utilidades ===== */
function classNames(...a: (string | false | null | undefined)[]) {
    return a.filter(Boolean).join(" ");
}
function useDebounced<T>(value: T, ms = 350) {
    const [v, setV] = React.useState<T>(value);
    React.useEffect(() => {
        const id = setTimeout(() => setV(value), ms);
        return () => clearTimeout(id);
    }, [value, ms]);
    return v;
}

/** ===== Componente ===== */
export default function ClientesCrud({
    onSelect,
}: {
    onSelect?: (c: ApiCliente) => void;
}) {
    const [items, setItems] = React.useState<ApiCliente[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    // Filtro
    const [q, setQ] = React.useState("");
    const dq = useDebounced(q, 300);

    // Paginación
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState<number>(12); // default
    const pageSizeOptions = [8, 12, 24, 48];

    // Modal Crear/Editar
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<ApiCliente | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [form, setForm] = React.useState<{
        nombre: string;
        apellido: string;
        cedula: string;
        correo: string;
        telefono: string;
        contrasena?: string;
    }>({
        nombre: "",
        apellido: "",
        cedula: "",
        correo: "",
        telefono: "",
        contrasena: "",
    });

    // Confirmación eliminar
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [toDelete, setToDelete] = React.useState<ApiCliente | null>(null);

    const reload = React.useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const list = await apiListClientes();
            // Orden alfabético estable: apellido, nombre
            list.sort(
                (a, b) =>
                    a.apellido.localeCompare(b.apellido) ||
                    a.nombre.localeCompare(b.nombre)
            );
            setItems(list);
            setPage(1); // reset a la primera página al recargar
        } catch (e: any) {
            setErr(
                e?.__is401
                    ? "Sesión expirada (401). Inicia sesión."
                    : e?.message || "No se pudo cargar clientes."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        reload();
    }, [reload]);

    function stripDiacritics(s: string) {
        // NFD separa letra + tilde; el rango \u0300-\u036f son los “combining marks”
        return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    // Filtro (debounced)
    const filtered = React.useMemo(() => {
        const src = items || [];
        const needle = stripDiacritics(dq.trim().toLowerCase());
        if (!needle) return src;

        return src.filter((c) => {
            const t = stripDiacritics(
                `${c.nombre} ${c.apellido} ${c.cedula} ${c.correo} ${c.telefono}`.toLowerCase()
            );
            return t.includes(needle);
        });
    }, [items, dq]);

    // Paginación a partir de filtered
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    React.useEffect(() => {
        // Si filtro o pageSize cambian, asegura que page esté dentro del rango
        setPage(1);
    }, [dq, pageSize]);

    const paged = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    // Abrir modales
    const openCreate = () => {
        setEditing(null);
        setForm({
            nombre: "",
            apellido: "",
            cedula: "",
            correo: "",
            telefono: "",
            contrasena: "",
        });
        setModalOpen(true);
    };
    const openEdit = (c: ApiCliente) => {
        setEditing(c);
        setForm({
            nombre: c.nombre || "",
            apellido: c.apellido || "",
            cedula: c.cedula || "",
            correo: c.correo || "",
            telefono: c.telefono || "",
            contrasena: "",
        });
        setModalOpen(true);
    };

    // Guardar
    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = { ...form };
            if (!payload.nombre || !payload.apellido || !payload.cedula) {
                throw new Error("Nombre, apellido y cédula son obligatorios.");
            }
            if (editing) await apiUpdateCliente(editing.id_cliente, payload);
            else await apiCreateCliente(payload);
            await reload();
            setModalOpen(false);
        } catch (e: any) {
            setErr(
                e?.__is401
                    ? "Sesión expirada (401). Inicia sesión."
                    : e?.message || "No se pudo guardar."
            );
        } finally {
            setSaving(false);
        }
    };

    // Eliminar
    const confirmDelete = (c: ApiCliente) => {
        setToDelete(c);
        setConfirmOpen(true);
    };
    const doDelete = async () => {
        if (!toDelete) return;
        try {
            await apiDeleteCliente(toDelete.id_cliente);
            await reload();
        } catch (e: any) {
            setErr(
                e?.__is401
                    ? "Sesión expirada (401). Inicia sesión."
                    : e?.message || "No se pudo eliminar."
            );
        } finally {
            setConfirmOpen(false);
            setToDelete(null);
        }
    };

    // Controles de paginación
    const canPrev = page > 1;
    const canNext = page < totalPages;
    const goFirst = () => setPage(1);
    const goPrev = () => canPrev && setPage((p) => p - 1);
    const goNext = () => canNext && setPage((p) => p + 1);
    const goLast = () => setPage(totalPages);

    return (
        <Card className="border">
            {/* ===== Toolbar ===== */}
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-2">
                    <Icon
                        icon="solar:users-group-rounded-bold-duotone"
                        className="text-xl"
                    />
                    <span className="font-semibold">Clientes</span>
                    {items && (
                        <Chip size="sm" variant="flat" color="success">
                            {items.length}
                        </Chip>
                    )}
                    {items && filtered.length !== items.length && (
                        <Chip size="sm" variant="flat" className="ml-1">
                            {filtered.length} filtrados
                        </Chip>
                    )}
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Input
                        className="w-full sm:w-72"
                        size="sm"
                        startContent={<Icon icon="solar:magnifier-bold-duotone" />}
                        placeholder="Buscar (nombre, cédula, correo, teléfono)…"
                        value={q}
                        onValueChange={setQ}
                    />

                    <div className="flex items-center gap-2">
                        <Select
                            aria-label="Tamaño de página"
                            size="sm"
                            className="w-[140px]"
                            selectedKeys={[String(pageSize)]}
                            onSelectionChange={(keys) => {
                                const k = Array.from(keys)[0] as string;
                                const n = Number(k);
                                if (!Number.isNaN(n)) setPageSize(n);
                            }}
                            disallowEmptySelection
                        >
                            {pageSizeOptions.map((n) => (
                                <SelectItem key={String(n)} /* 👈 quita value */
                                    textValue={`${n} por página`}>   {/* textValue es opcional */}
                                    {n} por página
                                </SelectItem>
                            ))}
                        </Select>


                        <Button
                            size="sm"
                            variant="flat"
                            startContent={<Icon icon="solar:refresh-bold-duotone" />}
                            onPress={reload}
                        >
                            Refrescar
                        </Button>
                        <Button
                            size="sm"
                            color="primary"
                            startContent={<Icon icon="solar:add-circle-bold-duotone" />}
                            onPress={openCreate}
                        >
                            Nuevo
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {/* ===== Body ===== */}
            <CardBody className="space-y-3">
                {loading && (
                    <div className="flex items-center gap-2 text-foreground-500">
                        <Spinner size="sm" /> Cargando clientes…
                    </div>
                )}

                {err && !loading && (
                    <div className="text-danger-500 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold-duotone" /> {err}
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="text-sm text-foreground-500">
                        {items && items.length > 0
                            ? "Sin resultados para tu búsqueda."
                            : "Aún no hay clientes."}
                    </div>
                )}

                {/* Grid de tarjetas — diseño más compacto y responsive */}
                {!loading && paged.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {paged.map((c) => {
                            const initials = `${(c.nombre || "?")[0] ?? "?"}${(c.apellido || "?")[0] ?? "?"
                                }`.toUpperCase();

                            return (
                                <Card
                                    key={c.id_cliente}
                                    className="border-sm hover:shadow-sm transition"
                                >
                                    <CardBody className="flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-10 w-10 rounded-full bg-default-200 grid place-content-center font-semibold">
                                                    {initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold truncate">
                                                        {c.nombre} {c.apellido}
                                                    </div>
                                                    <div className="text-xs text-foreground-500 truncate">
                                                        {c.correo || "—"}
                                                    </div>
                                                    <div className="text-xs text-foreground-500 truncate">
                                                        {c.telefono || "—"}
                                                    </div>
                                                </div>
                                            </div>

                                            <Tooltip content={`ID: ${c.id_cliente}`} placement="left">
                                                <Chip size="sm" variant="flat">
                                                    #{c.id_cliente}
                                                </Chip>
                                            </Tooltip>
                                        </div>

                                        <div className="text-xs text-foreground-500">
                                            Cédula: <span className="font-medium">{c.cedula || "—"}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {onSelect && (
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    variant="flat"
                                                    startContent={<Icon icon="solar:check-read-line-duotone" />}
                                                    onPress={() => onSelect(c)}
                                                >
                                                    Seleccionar
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                startContent={<Icon icon="solar:pen-bold-duotone" />}
                                                onPress={() => openEdit(c)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="bordered"
                                                color="danger"
                                                startContent={
                                                    <Icon icon="solar:trash-bin-minimalistic-bold-duotone" />
                                                }
                                                onPress={() => confirmDelete(c)}
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardBody>

            {/* ===== Footer con paginador ===== */}
            <div className="px-4 pb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                    <div className="text-foreground-500">
                        {total > 0 ? (
                            <>
                                Mostrando{" "}
                                <span className="font-medium">
                                    {(page - 1) * pageSize + 1}
                                </span>{" "}
                                –{" "}
                                <span className="font-medium">
                                    {Math.min(page * pageSize, total)}
                                </span>{" "}
                                de <span className="font-medium">{total}</span> clientes
                                {filtered.length !== (items?.length ?? 0) && (
                                    <>
                                        {" "}
                                        (de <span className="font-medium">{items?.length ?? 0}</span>{" "}
                                        totales)
                                    </>
                                )}
                            </>
                        ) : (
                            "Sin resultados"
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <Tooltip content="Primera página">
                            <Button
                                size="sm"
                                variant="flat"
                                isDisabled={!canPrev}
                                onPress={goFirst}
                                startContent={<Icon icon="solar:round-alt-arrow-left-bold-duotone" />}
                            />
                        </Tooltip>
                        <Tooltip content="Página anterior">
                            <Button
                                size="sm"
                                variant="flat"
                                isDisabled={!canPrev}
                                onPress={goPrev}
                                startContent={<Icon icon="solar:arrow-left-bold-duotone" />}
                            />
                        </Tooltip>

                        <Chip size="sm" variant="flat" className="mx-1">
                            {page} / {totalPages}
                        </Chip>

                        <Tooltip content="Página siguiente">
                            <Button
                                size="sm"
                                variant="flat"
                                isDisabled={!canNext}
                                onPress={goNext}
                                startContent={<Icon icon="solar:arrow-right-bold-duotone" />}
                            />
                        </Tooltip>
                        <Tooltip content="Última página">
                            <Button
                                size="sm"
                                variant="flat"
                                isDisabled={!canNext}
                                onPress={goLast}
                                startContent={<Icon icon="solar:round-alt-arrow-right-bold-duotone" />}
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* ===== Modal Crear/Editar ===== */}
            <Modal
                isOpen={modalOpen}
                onOpenChange={setModalOpen}
                isDismissable={!saving}
                backdrop="blur"
                placement="center"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <Icon icon="solar:user-plus-bold-duotone" />{" "}
                                {editing ? "Editar cliente" : "Nuevo cliente"}
                            </ModalHeader>
                            <ModalBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    label="Nombre"
                                    value={form.nombre}
                                    onValueChange={(v) => setForm((f) => ({ ...f, nombre: v }))}
                                />
                                <Input
                                    label="Apellido"
                                    value={form.apellido}
                                    onValueChange={(v) => setForm((f) => ({ ...f, apellido: v }))}
                                />
                                <Input
                                    label="Cédula"
                                    value={form.cedula}
                                    onValueChange={(v) => setForm((f) => ({ ...f, cedula: v }))}
                                />
                                <Input
                                    label="Correo"
                                    type="email"
                                    value={form.correo}
                                    onValueChange={(v) => setForm((f) => ({ ...f, correo: v }))}
                                />
                                <Input
                                    label="Teléfono"
                                    value={form.telefono}
                                    onValueChange={(v) => setForm((f) => ({ ...f, telefono: v }))}
                                />
                                <Input
                                    label="Contraseña (opcional)"
                                    type="password"
                                    value={form.contrasena || ""}
                                    onValueChange={(v) =>
                                        setForm((f) => ({ ...f, contrasena: v }))
                                    }
                                />
                            </ModalBody>
                            <ModalFooter className="flex justify-between">
                                <Button variant="flat" onPress={onClose} isDisabled={saving}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleSave}
                                    isLoading={saving}
                                    startContent={<Icon icon="solar:check-read-line-duotone" />}
                                >
                                    Guardar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* ===== Confirmación eliminar ===== */}
            <Modal
                isOpen={confirmOpen}
                onOpenChange={setConfirmOpen}
                backdrop="blur"
                placement="center"
            >
                <ModalContent>
                    {() => (
                        <>
                            <ModalHeader>Eliminar cliente</ModalHeader>
                            <ModalBody>
                                ¿Seguro que deseas eliminar al cliente{" "}
                                <b>
                                    {toDelete?.nombre} {toDelete?.apellido}
                                </b>
                                ?
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={() => setConfirmOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="danger"
                                    onPress={doDelete}
                                    startContent={
                                        <Icon icon="solar:trash-bin-minimalistic-bold-duotone" />
                                    }
                                >
                                    Eliminar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </Card>
    );
}
