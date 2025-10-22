"use client";

import React from "react";
import {
  Card, CardBody, CardHeader, Button, Input, Textarea, Chip, Checkbox,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Progress, Tooltip, Image, Spinner
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

// === CONFIG ===
const BASE_URL = "http://localhost:8000";

// === Tipos de respuestas (ajusta si tu API responde diferente) ===
type CreatedEmpresa = { id_empresa?: number | string; id?: number | string };
type CreatedGimnasio = { id_gimnasio?: number | string; id?: number | string };
type CreatedEmpleado = { id_empleado?: number | string; id?: number | string };
type AuthResponse = { token?: string };

// --------- Tipos ----------
type Paso = 1 | 2 | 3;

type Empresa = {
  nombre: string;
  ruc?: string;
  correo: string;
  telefono?: string;
  direccion?: string;
};

type Gimnasio = {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
};

type Admin = {
  nombre: string;
  apellido: string;
  cedula?: string;
  correo: string;
  contrasena: string;
  gimnasiosAsignados: string[]; // ids locales de gimnasio
};

// --------- Helpers ----------
const emailOk = (v: string) => /\S+@\S+\.\S+/.test(v);

// Helper POST genérico
async function postJson<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = "Error en la solicitud.";
    try {
      const j = await res.json();
      msg = j?.error || j?.message || msg;
    } catch { }
    throw new Error(`${url} → ${msg}`);
  }
  return (await res.json()) as T;
}

/** Pequeño hook local que emula useDisclosure */
function useDisclosureLike() {
  const [isOpen, setIsOpen] = React.useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    setOpen: setIsOpen,
  };
}

// --------- Page ----------
export default function RegistroPage() {
  const router = useRouter();

  // Estado
  const [paso, setPaso] = React.useState<Paso>(1);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [enviando, setEnviando] = React.useState(false);

  const [empresa, setEmpresa] = React.useState<Empresa>({
    nombre: "",
    correo: "",
    direccion: "",
  });

  const [gimnasios, setGimnasios] = React.useState<Gimnasio[]>([]);
  const [editingGym, setEditingGym] = React.useState<Gimnasio | null>(null);
  const modalGym = useDisclosureLike();

  const [admin, setAdmin] = React.useState<Admin>({
    nombre: "",
    apellido: "",
    cedula: "",
    correo: "",
    contrasena: "",
    gimnasiosAsignados: [],
  });

  // Validaciones
  const paso1Valido = () =>
    empresa.nombre.trim().length > 1 && emailOk(empresa.correo);

  const paso2Valido = () =>
    gimnasios.length >= 1 && gimnasios.every(g => g.nombre.trim().length > 1);

  const paso3Valido = () =>
    admin.nombre.trim().length > 1 &&
    emailOk(admin.correo) &&
    admin.contrasena.length >= 6 &&
    admin.gimnasiosAsignados.length >= 1;

  // Progreso visual
  const progressValue = paso === 1 ? 33 : paso === 2 ? 66 : 100;

  // Gimnasios: CRUD local
  function onNewGym() {
    setEditingGym({
      id: `G${Date.now()}`,
      nombre: "",
      direccion: "",
      telefono: "",
      correo: "",
    });
    modalGym.open();
  }

  function onEditGym(g: Gimnasio) {
    setEditingGym({ ...g });
    modalGym.open();
  }

  function onDeleteGym(id: string) {
    setGimnasios(prev => prev.filter(x => x.id !== id));
    setAdmin(a => ({ ...a, gimnasiosAsignados: a.gimnasiosAsignados.filter(gid => gid !== id) }));
  }

  function onSaveGym() {
    if (!editingGym || !editingGym.nombre.trim()) return;
    setGimnasios(prev => {
      const exists = prev.some(x => x.id === editingGym.id);
      if (exists) return prev.map(x => (x.id === editingGym.id ? editingGym : x));
      return [...prev, editingGym];
    });
    modalGym.close();
  }

  // Envío final: usa tus endpoints
  async function onSubmit() {
    setMsg(null);
    if (!paso1Valido()) return setMsg("Revisa los datos de la empresa.");
    if (!paso2Valido()) return setMsg("Agrega al menos un gimnasio con nombre.");
    if (!paso3Valido()) return setMsg("Revisa los datos del administrador.");

    setEnviando(true);
    try {
      // 1) Crear EMPRESA
      const empresaPayload = {
        nombre: empresa.nombre,
        ruc: empresa.ruc || null,
        correo: empresa.correo,
        telefono: empresa.telefono || null,
        direccion: empresa.direccion || null,
      };

      const createdEmpresa = await postJson<CreatedEmpresa>(
        `${BASE_URL}/api/v1/empresas`,
        empresaPayload
      );
      const id_empresa = createdEmpresa.id_empresa ?? createdEmpresa.id;
      if (!id_empresa) throw new Error("La API no devolvió id_empresa.");

      // 2) Crear GIMNASIOS (con id_empresa)
      const gymIdMap = new Map<string, string | number>();
      for (const g of gimnasios) {
        const gymPayload = {
          id_empresa,
          nombre: g.nombre,
          direccion: g.direccion || null,
          telefono: g.telefono || null,
          correo: g.correo || null,
        };

        const createdGym = await postJson<CreatedGimnasio>(
          `${BASE_URL}/api/v1/gimnasios`,
          gymPayload
        );
        const id_gimnasio = createdGym.id_gimnasio ?? createdGym.id;
        if (!id_gimnasio) throw new Error("La API no devolvió id_gimnasio.");
        gymIdMap.set(g.id, id_gimnasio);
      }

      // 3) Crear EMPLEADO(S) ADMIN (uno por cada gimnasio asignado)
      for (const localGymId of admin.gimnasiosAsignados) {
        const id_gimnasio = gymIdMap.get(localGymId);
        if (!id_gimnasio) continue;

        const empleadoPayload = {
          nombre: admin.nombre,
          apellido: admin.apellido,
          cedula: admin.cedula,
          correo: admin.correo,
          contrasena: admin.contrasena,
          id_tipo_empleado: "1",
          id_empresa,
          id_gimnasio,
        };

        await postJson<CreatedEmpleado>(
          `${BASE_URL}/api/v1/empleados`,
          empleadoPayload
        );
      }

      // 4) (Opcional) Login automático
      try {
        const auth = await postJson<AuthResponse>(
          `${BASE_URL}/api/v1/empleados/auth`,
          { email: admin.correo, contrasena: admin.contrasena }
        );
        if (auth?.token) localStorage.setItem("auth:token", auth.token);
      } catch (e) {
        console.warn("Login automático falló:", e);
      }

      // Redirigir al dashboard
      router.push("/admin/dashboard");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo completar el registro.");
    } finally {
      setEnviando(false);
    }
  }

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/(auth)");
  }

  // UI de “píldoras” de paso
  const StepPill = ({ n, label }: { n: Paso; label: string }) => {
    const active = paso === n;
    const done = paso > n;
    const color = active ? "primary" : done ? "success" : "default";
    return (
      <Chip color={color} variant="flat" className="capitalize">
        <span className="mr-1">{n}.</span>{label}
      </Chip>
    );
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fondo con video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/poster-video.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/video-principal.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/45" />

      {/* Botón regresar */}
      <div className="absolute top-4 left-4 z-20">
        <Tooltip content="Regresar" offset={6}>
          <Button
            isIconOnly
            variant="flat"
            className="bg-white/30 backdrop-blur-md border border-white/40 text-white"
            aria-label="Regresar"
            onPress={handleBack}
          >
            <Icon icon="mdi:arrow-left" width={20} height={20} />
          </Button>
        </Tooltip>
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full min-h-[100svh] grid place-items-center px-4 py-8">
        <Card className="w-full max-w-5xl rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-col gap-3">
            {/* Encabezado con marca */}
            <div className="relative w-full">
              <div className="h-24 w-full bg-gradient-to-b from-sky-200/70 via-sky-100/50 to-transparent" />
              <div className="absolute inset-x-0 -bottom-6 flex justify-center">
                <Image alt="Logo" src="/icono-arkim.png" width={100} />
              </div>
            </div>

            {/* Títulos y pasos */}
            <div className="pt-10 px-2 text-center">
              <h1 className="text-lg md:text-xl font-semibold text-white">Crea tu cuenta</h1>
              <p className="text-[13px] text-white/90">Completa los 3 pasos para empezar a usar el sistema.</p>
            </div>

            {/* Steps pills + progreso */}
            <div className="flex flex-col gap-3 px-4">
              <div className="flex flex-wrap items-center gap-2 justify-center">
                <StepPill n={1} label="empresa" />
                <Icon icon="mdi:chevron-right" width={18} className="opacity-70 text-white" />
                <StepPill n={2} label="gimnasios" />
                <Icon icon="mdi:chevron-right" width={18} className="opacity-70 text-white" />
                <StepPill n={3} label="admin" />
              </div>
              <Progress
                aria-label="Progreso"
                value={progressValue}
                className="w-full"
                classNames={{ track: "bg-white/30", indicator: "bg-white" }}
              />
            </div>

            {/* Mensaje global */}
            {msg && (
              <div className="px-4 w-full flex justify-center">
                <Chip color="warning" variant="flat" startContent={<Icon icon="mdi:alert" width={16} />}>
                  {msg}
                </Chip>
              </div>
            )}
          </CardHeader>

          <CardBody className="px-4 pb-5">
            {/* PASO 1: EMPRESA */}
            {paso === 1 && (
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Nombre de la empresa"
                  variant="bordered"
                  value={empresa.nombre}
                  onValueChange={(v) => setEmpresa((p) => ({ ...p, nombre: v }))}
                />
                <Input
                  label="RUC / Identificación"
                  variant="bordered"
                  value={empresa.ruc || ""}
                  onValueChange={(v) => setEmpresa((p) => ({ ...p, ruc: v }))}
                />
                <Input
                  isRequired
                  type="email"
                  label="Correo de contacto"
                  variant="bordered"
                  value={empresa.correo}
                  isInvalid={empresa.correo !== "" && !emailOk(empresa.correo)}
                  errorMessage={empresa.correo !== "" && !emailOk(empresa.correo) ? "Correo inválido" : undefined}
                  onValueChange={(v) => setEmpresa((p) => ({ ...p, correo: v }))}
                />
                <Input
                  label="Teléfono"
                  variant="bordered"
                  value={empresa.telefono || ""}
                  onValueChange={(v) => setEmpresa((p) => ({ ...p, telefono: v }))}
                />
                <Textarea
                  isRequired
                  label="Dirección"
                  variant="bordered"
                  minRows={3}
                  value={empresa.direccion || ""}
                  onValueChange={(v) => setEmpresa((p) => ({ ...p, direccion: v }))}
                />
              </div>
            )}

            {/* PASO 2: GIMNASIOS */}
            {paso === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Gimnasios</h3>
                  <Button startContent={<Icon icon="mdi:plus" width={18} />} onPress={onNewGym}>
                    Agregar gimnasio
                  </Button>
                </div>

                <Table removeWrapper aria-label="Gimnasios">
                  <TableHeader>
                    <TableColumn>NOMBRE</TableColumn>
                    <TableColumn>DIRECCIÓN</TableColumn>
                    <TableColumn>TELÉFONO</TableColumn>
                    <TableColumn>CORREO</TableColumn>
                    <TableColumn className="text-right">ACCIONES</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="Aún no agregas gimnasios">
                    {gimnasios.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.nombre}</TableCell>
                        <TableCell>{g.direccion || "-"}</TableCell>
                        <TableCell>{g.telefono || "-"}</TableCell>
                        <TableCell>{g.correo || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="light" onPress={() => onEditGym(g)}>
                              <Icon icon="mdi:pencil" width={18} />
                            </Button>
                            <Button size="sm" color="danger" variant="light" onPress={() => onDeleteGym(g.id)}>
                              <Icon icon="mdi:trash-can" width={18} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* PASO 3: ADMIN */}
            {paso === 3 && (
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Nombre del empleado"
                  variant="bordered"
                  value={admin.nombre}
                  onValueChange={(v) => setAdmin((p) => ({ ...p, nombre: v }))}
                />
                  <Input
                  isRequired
                  label="Apellido del empleado"
                  variant="bordered"
                  value={admin.apellido}
                  onValueChange={(v) => setAdmin((p) => ({ ...p, apellido: v }))}
                />
                <Input
                  isRequired
                  label="Cédula / Identificación"
                  variant="bordered"
                  value={admin.cedula || ""}
                  onValueChange={(v) => setAdmin((p) => ({ ...p, cedula: v }))}
                />
                <Input
                  isRequired
                  type="email"
                  label="Correo del empleado"
                  variant="bordered"
                  value={admin.correo}
                  isInvalid={admin.correo !== "" && !emailOk(admin.correo)}
                  errorMessage={admin.correo !== "" && !emailOk(admin.correo) ? "Correo inválido" : undefined}
                  onValueChange={(v) => setAdmin((p) => ({ ...p, correo: v }))}
                />
                <Input
                  isRequired
                  type="password"
                  label="Contraseña"
                  variant="bordered"
                  value={admin.contrasena}
                  onValueChange={(v) => setAdmin((p) => ({ ...p, contrasena: v }))}
                  description="Mínimo 6 caracteres."
                />

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-white">Asignar gimnasios a este admin</label>
                  <div className="flex flex-wrap gap-3">
                    {gimnasios.length === 0 ? (
                      <Chip>No hay gimnasios. Vuelve al Paso 2.</Chip>
                    ) : (
                      gimnasios.map((g) => {
                        const selected = admin.gimnasiosAsignados.includes(g.id);
                        return (
                          <Checkbox
                            key={g.id}
                            isSelected={selected}
                            onValueChange={(v) =>
                              setAdmin((p) => ({
                                ...p,
                                gimnasiosAsignados: v
                                  ? [...p.gimnasiosAsignados, g.id]
                                  : p.gimnasiosAsignados.filter((id) => id !== g.id),
                              }))
                            }
                          >
                            {g.nombre}
                          </Checkbox>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER DE NAVEGACIÓN */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="light"
                startContent={<Icon icon="mdi:chevron-left" width={18} />}
                isDisabled={paso === 1 || enviando}
                onPress={() => setPaso((p) => (p > 1 ? ((p - 1) as Paso) : p))}
              >
                Atrás
              </Button>

              {paso < 3 ? (
                <Button
                  color="primary"
                  endContent={<Icon icon="mdi:chevron-right" width={18} />}
                  isDisabled={(paso === 1 && !paso1Valido()) || (paso === 2 && !paso2Valido()) || enviando}
                  onPress={() => setPaso((p) => ((p + 1) as Paso))}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  color="primary"
                  isLoading={enviando}
                  startContent={enviando ? <Spinner size="sm" /> : <Icon icon="mdi:check" width={18} />}
                  onPress={onSubmit}
                >
                  Finalizar registro
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* MODAL: CREAR/EDITAR GIMNASIO */}
      <Modal isOpen={modalGym.isOpen} onOpenChange={modalGym.setOpen} placement="center" size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Icon icon="mdi:dumbbell" width={20} />
                {editingGym && gimnasios.some(x => x.id === editingGym.id) ? "Editar gimnasio" : "Nuevo gimnasio"}
              </ModalHeader>
              <ModalBody className="space-y-4">
                {editingGym && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      isRequired
                      label="Nombre"
                      variant="bordered"
                      value={editingGym.nombre}
                      onValueChange={(v) => setEditingGym((g) => (g ? { ...g, nombre: v } : g))}
                    />
                    <Input
                      isRequired
                      label="Dirección"
                      variant="bordered"
                      value={editingGym.direccion || ""}
                      onValueChange={(v) => setEditingGym((g) => (g ? { ...g, direccion: v } : g))}
                    />
                    <Input
                      isRequired
                      label="Teléfono"  
                      type="number"
                      variant="bordered"
                      value={editingGym.telefono || ""}
                      onValueChange={(v) => setEditingGym((g) => (g ? { ...g, telefono: v } : g))}
                    />
                    <Input
                      isRequired
                      type="email"
                      label="Correo"
                      variant="bordered"
                      value={editingGym.correo || ""}
                      onValueChange={(v) => setEditingGym((g) => (g ? { ...g, correo: v } : g))}
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cancelar</Button>
                <Button color="primary" onPress={onSaveGym}>Guardar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
