"use client";

import React from "react";
import {
  Card,
  CardBody,
  Input,
  Link,
  Button,
  Image,
  Checkbox,
  Chip,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = "http://localhost:8000";

function isEmail(v: string) {
  return /\S+@\S+\.\S+/.test(v);
}

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/admin/gimnasios"; // lo ajustamos abajo con ?empresa

  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [remember, setRemember] = React.useState(true);

  const [showPass, setShowPass] = React.useState(false);
  const [caps, setCaps] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState({ email: false, pass: false });

  // Cargar correo recordado
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("login:email");
      if (saved) setEmail(saved);
    } catch { }
  }, []);

  // Guardar/limpiar recordatorio
  React.useEffect(() => {
    try {
      if (remember && isEmail(email)) localStorage.setItem("login:email", email);
      else localStorage.removeItem("login:email");
    } catch { }
  }, [remember, email]);

  const emailErr = touched.email && !isEmail(email) ? "Ingresa un correo válido." : "";
  const passErr = touched.pass && pass.length < 6 ? "Mínimo 6 caracteres." : "";
  const isValid = isEmail(email) && pass.length >= 6;

  async function getEmpresaIdDelEmpleado(correo: string, token?: string): Promise<{ id_empresa: number | null, empleado?: any }> {
    try {
      // Opción ideal si tu backend la soporta:
      // const url = `${API_BASE}/api/v1/empleados?correo=${encodeURIComponent(correo)}`;

      // Opción genérica: traer todo y filtrar por correo:
      const url = `${API_BASE}/api/v1/empleados`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
        mode: "cors",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar empleados`);

      const lista = await res.json();
      // La respuesta esperada es un array de objetos como el ejemplo que mostraste
      const empleado = Array.isArray(lista)
        ? lista.find((e: any) => (e?.correo || "").toLowerCase() === correo.toLowerCase())
        : null;

      const id_empresa = empleado?.id_empresa ?? null;
      return { id_empresa, empleado };
    } catch (e) {
      return { id_empresa: null };
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setTouched({ email: true, pass: true });
    if (!isValid || loading) return;

    setLoading(true);
    try {
      const url = `${API_BASE}/api/v1/empleados/auth`;

      // 1) Autenticación
      let res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ correo: email, contrasena: pass }),
      });

      // Fallback de compatibilidad
      if (!res.ok && (res.status === 400 || res.status === 401 || res.status === 422)) {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ email, contrasena: pass }),
        });
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || j?.message || "Credenciales incorrectas.");
      }

      // 2) Parse de respuesta de auth
      const data = await res.json().catch(() => ({}));
      const token: string | undefined = data?.token || data?.access_token || data?.jwt;

      if (token) localStorage.setItem("auth:token", token);
      localStorage.setItem("auth:user_email", email);

      // 3) Obtener id_empresa del empleado autenticado
      // Si tu /auth YA devuelve id_empresa, úsalo directamente:
      // const idEmpresaFromAuth = data?.id_empresa ?? data?.empresa?.id;
      // if (idEmpresaFromAuth) { ...redirect... } else { ...consultar empleados... }

      let idEmpresa: number | null = data?.id_empresa ?? null;

      if (!idEmpresa) {
        const { id_empresa, empleado } = await getEmpresaIdDelEmpleado(email, token);
        idEmpresa = id_empresa;
        if (empleado) {
          localStorage.setItem("auth:empleado", JSON.stringify(empleado));
        }
      }

      if (!idEmpresa) {
        throw new Error("No se encontró id_empresa del empleado.");
      }

      localStorage.setItem("auth:empresa", String(idEmpresa));

      // 4) Redirigir a gimnasios con ?empresa=ID (respetando ?redirect si ya lo trae)
      const hasEmpresaInRedirect = redirectTo.includes("empresa=");
      const next = hasEmpresaInRedirect
        ? redirectTo
        : `${redirectTo}?empresa=${encodeURIComponent(String(idEmpresa))}`;

      router.push(next);
    } catch (err: any) {
      setMsg(err?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100vh] w-[100vw] overflow-hidden flex items-center justify-center p-4 md:pr-12 lg:pr-20">
      {/* Fondo (opcional) */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/video-principal.mp4" type="video/mp4" />
        Tu navegador no soporta videos en HTML5.
      </video>
      <div className="absolute inset-0 bg-black/40" />

      <Card
        role="form"
        aria-busy={loading}
        className="relative z-10 w-full max-w-sm bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl overflow-hidden"
      >
        <CardBody className="p-0">
          {/* Header */}
          <div className="relative">
            <div className="h-24 w-full bg-gradient-to-b from-sky-200/80 via-sky-100/60 to-transparent" />
            <div className="absolute inset-x-0 -bottom-6 flex justify-center">
              <Image alt="Logo" src="/icono-arkim.png" width={100} />
            </div>
          </div>

          {/* Título */}
          <div className="px-6 pt-10 pb-2 text-center">
            <h1 className="text-[18px] font-semibold text-white">Inicia sesión</h1>
            <p className="mt-1 text-[13px] leading-5 text-white/90">Ingresa con tu correo y contraseña.</p>
          </div>

          {/* Mensaje global */}
          <div className="px-6">
            {msg && (
              <div className="mb-3">
                <Chip color="warning" variant="flat" startContent={<Icon icon="mdi:alert" width={16} height={16} />}>
                  {msg}
                </Chip>
              </div>
            )}
          </div>

          {/* Formulario */}
          <div className="px-6 pb-6">
            <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
              <Input
                isRequired
                name="email"
                type="email"
                value={email}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                onValueChange={setEmail}
                placeholder="Correo electrónico"
                aria-label="Correo electrónico"
                autoComplete="email"
                isInvalid={!!emailErr}
                errorMessage={emailErr}
                size="md"
                radius="lg"
                variant="bordered"
                startContent={<Icon icon="mdi:email-outline" width={20} height={20} className="text-black/50" />}
                classNames={{
                  inputWrapper: "bg-white/70 border border-black/5 shadow-none rounded-xl",
                  input: "placeholder:text-black/40 text-black/80",
                }}
              />

              <Input
                isRequired
                name="password"
                value={pass}
                onBlur={() => setTouched((t) => ({ ...t, pass: true }))}
                onValueChange={setPass}
                placeholder="Contraseña"
                aria-label="Contraseña"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                isInvalid={!!passErr}
                errorMessage={passErr || (caps ? "Bloq Mayús activado." : undefined)}
                onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}
                size="md"
                radius="lg"
                variant="bordered"
                startContent={<Icon icon="mdi:lock-outline" width={20} height={20} className="text-black/50" />}
                endContent={
                  <button
                    type="button"
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="outline-none"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    <Icon icon={showPass ? "lucide:eye-off" : "lucide:eye"} width={20} height={20} className="text-black/60" />
                  </button>
                }
                classNames={{
                  inputWrapper: "bg-white/70 border border-black/5 shadow-none rounded-xl",
                  input: "placeholder:text-black/40 text-black/80",
                }}
              />

              <div className="flex items-center justify-between -mt-2">
                <Checkbox size="sm" isSelected={remember} onValueChange={setRemember} className="text-white">
                  Recordarme
                </Checkbox>
                <Link href="/recuperar" size="sm" underline="always" className="text-white">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  color="primary"
                  className="h-11 text-[15px] flex-1"
                  isLoading={loading}
                  isDisabled={!isValid || loading}
                  startContent={loading ? <Spinner size="sm" /> : <Icon icon="mdi:login" width={18} height={18} />}
                >
                  {loading ? "Ingresando…" : "Ingresar"}
                </Button>

                <Button
                  type="button"
                  variant="bordered"
                  className="h-11 text-[15px] bg-white/20 border-white/50 text-white flex-1"
                  startContent={<Icon icon="mdi:account-plus" width={18} height={18} />}
                  onPress={() => router.push("/registro")}
                >
                  Crear cuenta
                </Button>
              </div>
            </form>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
