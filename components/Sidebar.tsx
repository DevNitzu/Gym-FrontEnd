"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Hook: obtiene el id_empresa desde URL o localStorage (sync en inicial) */
function useEmpresaId() {
    const [empresaId, setEmpresaId] = React.useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        const qs = new URLSearchParams(window.location.search);
        const fromQuery = qs.get("empresa");
        if (fromQuery) {
            try { localStorage.setItem("auth:empresaId", fromQuery); } catch { }
            return fromQuery;
        }
        try { return localStorage.getItem("auth:empresaId"); } catch { return null; }
    });
    return empresaId;
}

/** Ítem de navegación simple */
function NavItem({
    href,
    label,
    onNavigate,
}: {
    href: string;
    label: string;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={`px-3 py-2 rounded-md text-sm transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-default-100"
                }`}
        >
            {label}
        </Link>
    );
}

/** Sidebar responsivo */
export default function AdminSidebar() {
    const empresaId = useEmpresaId();
    const [open, setOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        // ✅ Limpia cualquier selección previa de gimnasio para entrar “limpio”
        try { localStorage.removeItem("gymId"); } catch { }
    }, []);

    // Evita scroll del body cuando el drawer está abierto
    React.useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    // Query base SOLO con empresa (sin id_gimnasio)
    const baseQueryStr = React.useMemo(() => {
        const q = new URLSearchParams();
        if (empresaId) q.set("empresa", empresaId);
        const s = q.toString();
        return s ? `?${s}` : "";
    }, [empresaId]);

    // ✅ Historial SIEMPRE limpio (sin id_gimnasio)
    const historialHref = "/admin/historial";

    const handleNavigate = React.useCallback(() => setOpen(false), []);

    // Evita hidratar con href vacío antes de tiempo
    if (!mounted) return null;

    return (
        <>
            {/* Topbar móvil */}
            <div className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-background/80 backdrop-blur px-4 py-3">
                <h2 className="text-base font-semibold">Panel Admin</h2>
                <button
                    type="button"
                    aria-label="Abrir menú"
                    aria-expanded={open}
                    aria-controls="mobile-sidebar"
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-default-100"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80">
                        <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
                    </svg>
                    Menú
                </button>
            </div>

            {/* Drawer móvil */}
            <div
                id="mobile-sidebar"
                role="dialog"
                aria-modal="true"
                className={`md:hidden fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
            >
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setOpen(false)}
                />
                <aside
                    className={`absolute left-0 top-0 h-full w-72 max-w-[85%] transform bg-background border-r shadow transition-transform
          ${open ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-base font-semibold">Panel Admin</h2>
                        <button
                            type="button"
                            aria-label="Cerrar menú"
                            onClick={() => setOpen(false)}
                            className="rounded-md border px-2 py-1 hover:bg-default-100"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80">
                                <path
                                    fill="currentColor"
                                    d="M18.3 5.71L12 12l6.3 6.29l-1.41 1.42L10.59 13.4l-6.3 6.3L2.88 18.3l6.29-6.3l-6.3-6.29L4.3 4.3l6.3 6.29l6.29-6.3z"
                                />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex flex-col gap-1 p-4">
                        <NavItem
                            href={`/admin/gimnasios${baseQueryStr}`}
                            label="Gimnasios"
                            onNavigate={handleNavigate}
                        />
                        {/* 👇 Historial SIEMPRE limpio */}
                        <NavItem href={historialHref} label="Historial" onNavigate={handleNavigate} />
                        <NavItem
                            href={`/admin/empleados${baseQueryStr}`}
                            label="Empleados"
                            onNavigate={handleNavigate}
                        />
                        <NavItem
                            href={`/admin/clientes${baseQueryStr}`}
                            label="Clientes"
                            onNavigate={handleNavigate}
                        />
                        <NavItem
                            href={`/admin/perfil${baseQueryStr}`}
                            label="Perfil"
                            onNavigate={handleNavigate}
                        />
                    </nav>
                </aside>
            </div>

            {/* Sidebar fijo en md+ */}
            <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 border-r bg-background p-4 space-y-4">
                <h2 className="text-base font-semibold">Panel Admin</h2>
                <nav className="flex flex-col gap-1">
                    <NavItem href={`/admin/gimnasios${baseQueryStr}`} label="Gimnasios" />
                    {/* 👇 Historial SIEMPRE limpio */}
                    <NavItem href={historialHref} label="Historial" />
                    <NavItem href={`/admin/empleados${baseQueryStr}`} label="Empleados" />
                    <NavItem href={`/admin/clientes${baseQueryStr}`} label="Clientes" />
                    <NavItem href={`/admin/perfil${baseQueryStr}`} label="Perfil" />
                </nav>
            </aside>
        </>
    );
}
