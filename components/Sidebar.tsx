"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/* =========================
   Helpers
========================= */

function useEmpresaId() {
    const sp = useSearchParams();
    const empresaFromQuery = sp.get("empresa");
    const [empresaId, setEmpresaId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const ls = localStorage.getItem("auth:empresaId");
        let value = empresaFromQuery || ls || null;
        if (empresaFromQuery) {
            try {
                localStorage.setItem("auth:empresaId", empresaFromQuery);
            } catch { }
        }
        setEmpresaId(value);
    }, [empresaFromQuery]);

    return empresaId;
}

function useIsActive(href: string) {
    const pathname = usePathname();
    const base = React.useMemo(() => {
        try {
            const u = new URL(href, "http://x");
            return u.pathname;
        } catch {
            return href.split("?")[0].split("#")[0];
        }
    }, [href]);
    return pathname === base || (pathname.startsWith(base + "/") && base !== "/");
}

/* =========================
   Icons (inline)
========================= */

const I = {
    Gym: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M7 9V6h10v3h2v11H5V9h2Zm2 0h6V8H9v1Zm-2 9h2v-6H7v6Zm4 0h2v-6h-2v6Zm4 0h2v-6h-2v6Z" />
        </svg>
    ),
    History: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-2.05-4.95L16 9h5V4l-1.64 1.64A8.96 8.96 0 0 0 13 3Zm-1 5h2v5h-4v-2h2V8Z" />
        </svg>
    ),
    Users: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm6 8v-1a5 5 0 0 0-5-5H7a5 5 0 0 0-5 5v1h16Zm4-8a3 3 0 1 0-3-3a3 3 0 0 0 3 3Zm-2 8h4v-1a4 4 0 0 0-3-3.87A5.98 5.98 0 0 1 14 14c2.76 0 5 1.79 5.74 4.24A4 4 0 0 1 20 19v1Z" />
        </svg>
    ),
    Client: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5Zm-7 9v-1.5A4.5 4.5 0 0 1 9.5 15h5A4.5 4.5 0 0 1 19 19.5V21H5Z" />
        </svg>
    ),
    Profile: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" />
        </svg>
    ),
    Chevron: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="m9.4 17l4.6-5l-4.6-5L11 5.4l6 6l-6 6Z" />
        </svg>
    ),
    Logout: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M10 17v-2h4V9h-4V7h6v10zm-6-2h2V9H4z" />
        </svg>
    ),
    Menu: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
        </svg>
    ),
};

/* =========================
   NavItem
========================= */

function NavItem({
    href,
    label,
    icon,
    collapsed,
    onNavigate,
}: {
    href: string;
    label: string;
    icon: React.ReactNode;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    const active = useIsActive(href);
    return (
        <Link
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={[
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/85 hover:bg-default-100 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
            ].join(" ")}
        >
            <span className={["grid place-items-center", collapsed ? "mx-auto" : ""].join(" ")}>
                {icon}
            </span>
            {!collapsed && <span className="truncate">{label}</span>}
        </Link>
    );
}

/* =========================
   Sidebar
========================= */

export default function AdminSidebar() {
    const empresaId = useEmpresaId();
    const [open, setOpen] = React.useState(false);          // drawer móvil
    const [collapsed, setCollapsed] = React.useState(false); // colapso md+
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        try { localStorage.removeItem("gymId"); } catch { }
        try {
            const v = localStorage.getItem("ui:sidebarCollapsed");
            if (v === "1") setCollapsed(true);
        } catch { }
    }, []);

    React.useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    const baseQueryStr = React.useMemo(() => {
        const q = new URLSearchParams();
        if (empresaId) q.set("empresa", empresaId);
        const s = q.toString();
        return s ? `?${s}` : "";
    }, [empresaId]);

    const historialHref = "/admin/historial";

    const handleNavigate = React.useCallback(() => setOpen(false), []);
    const toggleCollapsed = React.useCallback(() => {
        setCollapsed((v) => {
            const nv = !v;
            try {
                localStorage.setItem("ui:sidebarCollapsed", nv ? "1" : "0");
            } catch { }
            return nv;
        });
    }, []);

    const onLogout = React.useCallback(() => {
        try {
            localStorage.removeItem("auth:token");
            localStorage.removeItem("auth:empresaId");
            localStorage.removeItem("gymId");
        } catch { }
        window.location.href = "/";
    }, []);

    if (!mounted) return null;

    const LINKS = [
        { href: `/admin/gimnasios${baseQueryStr}`, label: "Gimnasios", icon: <I.Gym className="h-4 w-4" /> },
        { href: historialHref, label: "Historial", icon: <I.History className="h-4 w-4" /> },
        { href: `/admin/empleados${baseQueryStr}`, label: "Empleados", icon: <I.Users className="h-4 w-4" /> },
        { href: `/admin/clientes${baseQueryStr}`, label: "Clientes", icon: <I.Client className="h-4 w-4" /> },
        { href: `/admin/perfil${baseQueryStr}`, label: "Perfil", icon: <I.Profile className="h-4 w-4" /> },
    ];

    return (
        <>
            {/* FAB móvil para abrir el menú (esquina inferior izquierda) */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="md:hidden fixed bottom-4 left-4 z-40 rounded-full border bg-background/80 backdrop-blur px-4 py-3 shadow-lg hover:bg-default-100"
                aria-label="Abrir menú"
            >
                <I.Menu className="h-5 w-5" />
            </button>

            {/* Drawer móvil - ocupa full screen */}
            <div
                id="mobile-sidebar"
                role="dialog"
                aria-modal="true"
                className={`md:hidden fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
            >
                <div
                    className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setOpen(false)}
                />
                <aside
                    className={`absolute left-0 top-0 h-full w-80 max-w-[90%] transform border-r bg-background shadow-xl transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <div className="flex items-center gap-3 border-b px-4 py-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-sm" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold leading-tight">Panel Admin</p>
                        </div>
                        <button
                            type="button"
                            aria-label="Cerrar menú"
                            onClick={() => setOpen(false)}
                            className="ml-auto rounded-md border px-2 py-1 hover:bg-default-100"
                        >
                            ✕
                        </button>
                    </div>

                    <nav className="flex flex-col gap-1 p-3">
                        {LINKS.map((l) => (
                            <NavItem
                                key={l.href}
                                href={l.href}
                                label={l.label}
                                icon={l.icon}
                                collapsed={false}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </nav>

                    <div className="mt-auto border-t p-3">
                        <button
                            onClick={onLogout}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-default-100"
                        >
                            <I.Logout className="h-4 w-4" />
                            Salir
                        </button>
                    </div>
                </aside>
            </div>

            {/* Sidebar de escritorio: altura completa, sticky, con scroll interno */}
            <aside
                className={[
                    "hidden md:sticky md:top-0 md:flex md:h-dvh md:shrink-0 md:flex-col",
                    "border-r bg-background/70 backdrop-blur",
                    "transition-[width] duration-200",
                    collapsed ? "md:w-20" : "md:w-72", // colapsado vs expandido
                ].join(" ")}
            >
                {/* Header */}
                <div className={["flex items-center gap-3 px-4 py-4", collapsed ? "justify-center" : ""].join(" ")}>
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-sm" />
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold leading-tight">Panel Admin</p>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="px-3 pb-3">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-default-200 to-transparent dark:via-default-100" />
                </div>

                {/* Área scrollable (ocupa el espacio entre header y footer) */}
                <div className="flex-1 overflow-y-auto px-3">
                    <nav className="flex flex-col gap-1 pb-4">
                        {LINKS.map((l) => (
                            <NavItem key={l.href} href={l.href} label={l.label} icon={l.icon} collapsed={collapsed} />
                        ))}
                    </nav>
                </div>

                {/* Footer fijo (toggle + salir) */}
                <div className="mt-auto sticky bottom-0 bg-background/80 backdrop-blur border-t px-3 py-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleCollapsed}
                            className="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-default-100"
                            title={collapsed ? "Expandir" : "Colapsar"}
                            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                        >
                            <I.Chevron className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                        </button>

                        <button
                            onClick={onLogout}
                            className={[
                                "flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm",
                                "hover:bg-default-100",
                            ].join(" ")}
                        >
                            <I.Logout className="h-4 w-4" />
                            {!collapsed && <span>Salir</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
