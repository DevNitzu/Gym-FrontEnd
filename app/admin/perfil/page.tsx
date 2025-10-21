"use client";

import React, { useState } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Input,
    Avatar,
    Tabs,
    Tab,
    Textarea,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Select,
    SelectItem,
    Chip
} from "@heroui/react";
import { Icon } from "@iconify/react";

type PerfilData = {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    rol: "admin" | "editor" | "viewer";
    bio: string;
    avatarUrl?: string;
};

export default function PerfilPage() {
    // Datos de ejemplo; cámbialos por datos reales (fetch en Server Action o API)
    const [data, setData] = useState<PerfilData>({
        nombre: "Jonathan",
        apellido: "Pico",
        email: "jonathan@example.com",
        telefono: "+593 99 999 9999",
        rol: "admin",
        bio: "Fabricante de ropa en Pelileo. Me enfoco en calidad, envíos y atención mayorista.",
        avatarUrl: "/avatar.png", // coloca una imagen en /public si quieres
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const onChange = (key: keyof PerfilData, value: string) => {
        setData((prev) => ({ ...prev, [key]: value as any }));
    };

    async function handleSave() {
        setSaving(true);
        setMessage(null);
        try {
            // TODO: aquí harías un fetch a tu API / action
            await new Promise((r) => setTimeout(r, 800));
            setMessage("Cambios guardados correctamente.");
        } catch (e) {
            setMessage("No se pudieron guardar los cambios. Intenta de nuevo.");
        } finally {
            setSaving(false);
        }
    }

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setData((prev) => ({ ...prev, avatarUrl: url }));
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Perfil</h1>
                {message && (
                    <Chip
                        color={message.includes("correctamente") ? "success" : "warning"}
                        variant="flat"
                    >
                        {message}
                    </Chip>
                )}
            </div>

            <Tabs aria-label="Configuración de perfil" color="primary" variant="underlined">
                <Tab
                    key="perfil"
                    title={
                        <div className="flex items-center gap-2">
                            <Icon icon="mdi:account" width={18} height={18} />
                            <span>Perfil</span>
                        </div>
                    }
                >
                    <Card className="border">
                        <CardHeader className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar
                                    isBordered
                                    radius="full"
                                    size="lg"
                                    src={data.avatarUrl}
                                    name={`${data.nombre} ${data.apellido}`}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                    <Button
                                        radius="sm"
                                        startContent={<Icon icon="mdi:camera-plus" width={18} height={18} />}
                                    >
                                        Cambiar foto
                                    </Button>
                                </label>
                                {data.avatarUrl && (
                                    <Button
                                        radius="sm"
                                        variant="light"
                                        onPress={() => setData((p) => ({ ...p, avatarUrl: undefined }))}
                                    >
                                        Quitar
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardBody className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombre"
                                    variant="bordered"
                                    value={data.nombre}
                                    onValueChange={(v) => onChange("nombre", v)}
                                />
                                <Input
                                    label="Apellido"
                                    variant="bordered"
                                    value={data.apellido}
                                    onValueChange={(v) => onChange("apellido", v)}
                                />
                                <Input
                                    label="Correo"
                                    type="email"
                                    variant="bordered"
                                    value={data.email}
                                    onValueChange={(v) => onChange("email", v)}
                                />
                                <Input
                                    label="Teléfono"
                                    variant="bordered"
                                    value={data.telefono}
                                    onValueChange={(v) => onChange("telefono", v)}
                                />
                                <Select
                                    label="Rol"
                                    variant="bordered"
                                    selectedKeys={[data.rol]}
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0] as PerfilData["rol"];
                                        onChange("rol", key);
                                    }}
                                >
                                    {[
                                        { key: "admin", label: "Administrador" },
                                        { key: "editor", label: "Editor" },
                                        { key: "viewer", label: "Visualizador" },
                                    ].map((opt) => (
                                        <SelectItem key={opt.key}>{opt.label}</SelectItem>
                                    ))}
                                </Select>
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
                                >
                                    Guardar cambios
                                </Button>
                                <Button
                                    variant="bordered"
                                    startContent={<Icon icon="mdi:lock-reset" width={18} height={18} />}
                                    onPress={onOpen}
                                >
                                    Cambiar contraseña
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>

                <Tab
                    key="seguridad"
                    title={
                        <div className="flex items-center gap-2">
                            <Icon icon="mdi:shield-lock" width={18} height={18} />
                            <span>Seguridad</span>
                        </div>
                    }
                >
                    <Card className="border">
                        <CardBody className="space-y-4">
                            <p className="text-default-600">
                                Gestiona tu contraseña y revisa ajustes de seguridad.
                            </p>
                            <div className="flex gap-3">
                                <Button color="primary" onPress={onOpen}>
                                    Cambiar contraseña
                                </Button>
                                <Button variant="bordered" startContent={<Icon icon="mdi:logout" width={18} height={18} />}>
                                    Cerrar sesión
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>

            {/* Modal Cambiar contraseña */}
            <ChangePasswordModal isOpen={isOpen} onOpenChange={onOpenChange} />
        </div>
    );
}

function ChangePasswordModal({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [current, setCurrent] = useState("");
    const [pwd, setPwd] = useState("");
    const [repeat, setRepeat] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function onSave() {
        setLoading(true);
        setMsg(null);
        try {
            if (pwd.length < 8) throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
            if (pwd !== repeat) throw new Error("Las contraseñas no coinciden.");
            // TODO: fetch a API para cambiar contraseña
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
                            {msg && (
                                <Chip color={msg.includes("actualizada") ? "success" : "warning"} variant="flat">
                                    {msg}
                                </Chip>
                            )}
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
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>Cancelar</Button>
                            <Button color="primary" isLoading={loading} onPress={onSave}>
                                Guardar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
