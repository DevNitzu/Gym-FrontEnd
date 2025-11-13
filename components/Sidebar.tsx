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
        const value = empresaFromQuery || ls || null;
        if (empresaFromQuery) {
            try { localStorage.setItem("auth:empresaId", empresaFromQuery); } catch { }
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
    Dashboard: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8v-10h-8v10Zm0-18v6h8V3h-8Z" />
        </svg>
    ),
    Apps: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M4 4h6v6H4zm0 10h6v6H4zm10-10h6v6h-6zm0 10h6v6h-6z" />
        </svg>
    ),
    Settings: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M12 8a4 4 0 1 0 4 4a4 4 0 0 0-4-4Zm8.94 2.06l1.42-1.42l-2.12-2.12l-1.42 1.42a7.963 7.963 0 0 0-1.77-.98L16 5h-2l-.05 2.96c-.63.22-1.21.56-1.77.98L11.76 7.5L9.64 9.62l1.42 1.42c-.42.56-.76 1.14-.98 1.77L7 13v2l2.96.05c.22.63.56 1.21.98 1.77l-1.42 1.42l2.12 2.12l1.42-1.42c.56.42 1.14.76 1.77.98L14 19h2l.05-2.96c.63-.22 1.21-.56 1.77-.98l1.42 1.42l2.12-2.12l-1.42-1.42c.42-.56.76-1.14.98-1.77L19 11v-2l-2.96-.05c-.22-.63-.56-1.21-.98-1.77Z" />
        </svg>
    ),
    Marketing: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M4 4h16v2H4zm0 6h10v2H4zm0 6h16v2H4z" />
        </svg>
    ),
    Mediciones: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" {...p}>
            <path fill="currentColor" d="M12 3L2 9l10 6l10-6l-10-6zm0 8.25L5.14 9L12 5.75L18.86 9L12 11.25zM2 13v8l10 6l10-6v-8l-2 1.2v6.8l-8 4.8l-8-4.8v-6.8L2 13z" />
        </svg>
    ),
};

/* =========================
   NavItem
========================= */

function NavItem({
    href, label, icon, collapsed, onNavigate,
}: {
    href: string; label: string; icon: React.ReactNode; collapsed: boolean; onNavigate?: () => void;
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
    const [open, setOpen] = React.useState(false);           // drawer móvil
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

    const handleNavigate = React.useCallback(() => setOpen(false), []);
    const toggleCollapsed = React.useCallback(() => {
        setCollapsed((v) => {
            const nv = !v;
            try { localStorage.setItem("ui:sidebarCollapsed", nv ? "1" : "0"); } catch { }
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
        { href: `/admin/dashboard${baseQueryStr}`, label: "Dashboard", icon: <I.Dashboard className="h-4 w-4" /> },
        { href: `/admin/gimnasios${baseQueryStr}`, label: "Gimnasios", icon: <I.Gym className="h-4 w-4" /> },
        { href: `/admin/historial`, label: "Historial", icon: <I.History className="h-4 w-4" /> },
        { href: `/admin/empleados${baseQueryStr}`, label: "Empleados", icon: <I.Users className="h-4 w-4" /> },
        { href: `/admin/clientes${baseQueryStr}`, label: "Clientes", icon: <I.Client className="h-4 w-4" /> },
        { href: `/admin/mediciones${baseQueryStr}`, label: "Mediciones", icon: <I.Mediciones className="h-4 w-4" /> },
        { href: `/admin/movil${baseQueryStr}`, label: "Aplicación Móvil", icon: <I.Apps className="h-4 w-4" /> },
        { href: `/admin/marketing${baseQueryStr}`, label: "Marketing", icon: <I.Marketing className="h-4 w-4" /> },
        { href: `/admin/configuracion${baseQueryStr}`, label: "Configuración", icon: <I.Settings className="h-4 w-4" /> },
        { href: `/admin/perfil${baseQueryStr}`, label: "Perfil", icon: <I.Profile className="h-4 w-4" /> },
    ];

    return (
        <>
            {/* FAB móvil */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="md:hidden fixed bottom-4 left-4 z-40 rounded-full border bg-background/80 backdrop-blur px-4 py-3 shadow-lg hover:bg-default-100"
                aria-label="Abrir menú"
            >
                <I.Menu className="h-5 w-5" />
            </button>

            {/* Drawer móvil – FULL SCREEN */}
            <div
                id="mobile-sidebar"
                role="dialog"
                aria-modal="true"
                className={`md:hidden fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
            >
                {/* overlay */}
                <div
                    className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setOpen(false)}
                />
                {/* panel */}
                <aside
                    className={[
                        "absolute left-0 inset-y-0 h-dvh w-full sm:w-[420px]", // ← ocupa toda la pantalla (en sm limita el ancho)
                        "transform border-r bg-background shadow-xl transition-transform",
                        open ? "translate-x-0" : "-translate-x-full",
                        "flex flex-col", // para header / scroll / footer
                    ].join(" ")}
                >
                    {/* header */}
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

                    {/* contenido scrollable */}
                    <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
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

                    {/* footer */}
                    <div className="border-t p-3">
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

            {/* Sidebar escritorio */}
            <aside
                className={[
                    "hidden md:sticky md:top-0 md:flex md:h-dvh md:shrink-0 md:flex-col",
                    "border-r bg-background/70 backdrop-blur",
                    "transition-[width] duration-200",
                    collapsed ? "md:w-20" : "md:w-72",
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

                {/* Scroll interno */}
                <div className="flex-1 overflow-y-auto px-3">
                    <nav className="flex flex-col gap-1 pb-4">
                        {LINKS.map((l) => (
                            <NavItem key={l.href} href={l.href} label={l.label} icon={l.icon} collapsed={collapsed} />
                        ))}
                    </nav>
                </div>

                {/* Footer */}
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
