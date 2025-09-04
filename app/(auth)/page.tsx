"use client";

import React from "react";
import {
  Card,
  CardBody,
  Tabs,
  Tab,
  Input,
  Link,
  Button,
  Image
} from "@heroui/react";
import { Icon } from "@iconify/react";

type LoginData = Record<string, string>;
type TabKey = "admin" | "employee";

const LoginPage: React.FC = () => {
  const [selected, setSelected] = React.useState<TabKey>("admin");
  const [showPass, setShowPass] = React.useState(false);

  const FormLogin = ({ role }: { role: TabKey }) => (
    <form className="flex flex-col gap-4" noValidate>
      <Input
        isRequired
        name="email"
        type="email"
        placeholder="Correo electrónico"
        aria-label="Correo electrónico"
        autoComplete="email"
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
        placeholder="Contraseña"
        aria-label="Contraseña"
        type={showPass ? "text" : "password"}
        autoComplete="current-password"
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
            <Icon
              icon={showPass ? "lucide:eye-off" : "lucide:eye"}
              width={20}
              height={20}
              className="text-black/60"
            />
          </button>
        }
        classNames={{
          inputWrapper: "bg-white/70 border border-black/5 shadow-none rounded-xl",
          input: "placeholder:text-black/40 text-black/80",
        }}
      />

      <div className="flex justify-end -mt-2">
        <Link href="#" size="sm" underline="always" className="text-white">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" color="primary" fullWidth className="h-11 text-[15px]">
        Ingresar {role === "admin" ? "como Administrador" : "como Empleado"}
      </Button>
    </form>
  );

  return (
    <div
      className="
        relative min-h-[100vh] w-[100vw] overflow-hidden
        flex items-center
        justify-center md:justify-end
        p-4 md:pr-12 lg:pr-20
      "
    >
      {/* 🔹 Fondo de video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/video-principal.mp4" type="video/mp4" />
        Tu navegador no soporta videos en HTML5.
      </video>

      {/* 🔹 Overlay oscuro suave para legibilidad */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 🔹 Contenido principal (Card a la derecha en desktop, centrado en móvil) */}
      <Card className="relative z-10 w-full max-w-sm bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl overflow-hidden">
        <CardBody className="p-0">
          {/* Header con degradado + icono */}
          <div className="relative">
            <div className="h-24 w-full bg-gradient-to-b from-sky-200/80 via-sky-100/60 to-transparent" />
            <div className="absolute inset-x-0 -bottom-6 flex justify-center">
              <Image
                alt="HeroUI hero Image"
                src="/icono-arkim.png"
                width={100}
              />
            </div>
          </div>

          {/* Títulos */}
          <div className="px-6 pt-10 pb-4 text-center">
            <h1 className="text-[18px] font-semibold text-white">Inicia sesión con tu correo</h1>
            <p className="mt-1 text-[13px] leading-5 text-white">
              Administra horarios, reservas, membresías y entrenadores <br /> de tu gimnasio desde un solo lugar.
            </p>
          </div>

          {/* Tabs */}
          <div className="px-6 pb-6">
            <Tabs
              fullWidth
              aria-label="Selecciona tu tipo de acceso"
              selectedKey={selected}
              onSelectionChange={(k) => setSelected(k as TabKey)}
              size="md"
              classNames={{
                tabList: "bg-white/70 backdrop-blur-md border border-black/10 rounded-xl p-1",
                tab: "data-[hover=true]:opacity-80 text-black/70 rounded-lg transition-colors",
                tabContent: "group-data-[selected=true]:text-black font-medium",
                cursor: "bg-white shadow-sm border border-black/5 rounded-lg",
              }}
            >
              <Tab key="admin" title="Administrador">
                <div className="mt-4">
                  <FormLogin role="admin" />
                </div>
              </Tab>

              <Tab key="employee" title="Empleado">
                <div className="mt-4">
                  <FormLogin role="employee" />
                </div>
              </Tab>
            </Tabs>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage;
