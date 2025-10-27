"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Hook: obtiene el id_empresa desde ?empresa o desde localStorage */
function useEmpresaId() {
    const sp = useSearchParams();
    const [empresaId, setEmpresaId] = React.useState<string | null>(null);

    React.useEffect(() => {
        // 1) si viene en la URL actual, úsalo
        const fromQuery = sp.get("empresa");
        if (fromQuery) {
            setEmpresaId(fromQuery);
            try { localStorage.setItem("auth:empresaId", fromQuery); } catch { }
            return;
        }
        // 2) si no, intenta desde localStorage
        try {
            const saved = localStorage.getItem("auth:empresaId");
            if (saved) setEmpresaId(saved);
        } catch { }
    }, [sp]);

    return empresaId;
}

/** Construye un href con query params (sin depender del host real) */
function buildHrefWithQuery(href: string, query?: Record<string, string | number | boolean | null | undefined>) {
    if (!query || Object.keys(query).length === 0) return href;
    const url = new URL(href, "http://dummy"); // base dummy para usar URL sin window
    Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
            url.searchParams.set(k, String(v));
        }
    });
    return url.pathname + (url.search ? url.search : "");
}

function NavItem({
    href,
    label,
    query,
    onNavigate,
}: {
    href: string;
    label: string;
    query?: Record<string, string | number | boolean | null | undefined>;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const hrefWithQuery = React.useMemo(() => buildHrefWithQuery(href, query), [href, query]);
    const active = pathname === href || pathname.startsWith(href + "/");

    return (
        <Link
            href={hrefWithQuery}
            onClick={onNavigate}
            className={`px-3 py-2 rounded-md text-sm transition
        ${active ? "bg-primary text-primary-foreground" : "hover:bg-default-100"}`}
        >
            {label}
        </Link>
    );
}

/** Sidebar responsivo:
 * - En md+: rail fijo a la izquierda.
 * - En sm: botón "Menú" que abre/cierra un drawer lateral.
 */
export default function AdminSidebar() {
    const empresaId = useEmpresaId();
    const [open, setOpen] = React.useState(false);

    // Evita scroll del body cuando el drawer está abierto
    React.useEffect(() => {
        if (open) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [open]);

    // Empaqueta query si hay empresaId
    const baseQuery = React.useMemo(() => (empresaId ? { empresa: empresaId } : undefined), [empresaId]);

    // Cierra el drawer al navegar
    const handleNavigate = React.useCallback(() => setOpen(false), []);

    return (
        <>
            {/* Topbar solo visible en móvil */}
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
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setOpen(false)}
                />
                {/* Panel */}
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
                                <path fill="currentColor" d="M18.3 5.71L12 12l6.3 6.29l-1.41 1.42L10.59 13.4l-6.3 6.3L2.88 18.3l6.29-6.3l-6.3-6.29L4.3 4.3l6.3 6.29l6.29-6.3z" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex flex-col gap-1 p-4">
                        <NavItem href="/admin/gimnasios" label="Gimnasios" query={baseQuery} onNavigate={handleNavigate} />
                        <NavItem href="/admin/empleados" label="Empleados" query={baseQuery} onNavigate={handleNavigate} />
                        <NavItem href="/admin/clientes" label="Clientes" query={baseQuery} onNavigate={handleNavigate} />
                        <NavItem href="/admin/perfil" label="Perfil" query={baseQuery} onNavigate={handleNavigate} />
                    </nav>
                </aside>
            </div>

            {/* Sidebar fijo en md+ */}
            <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 border-r bg-background p-4 space-y-4">
                <h2 className="text-base font-semibold">Panel Admin</h2>
                <nav className="flex flex-col gap-1">
                    <NavItem href="/admin/gimnasios" label="Gimnasios" query={baseQuery} />
                    <NavItem href="/admin/empleados" label="Empleados" query={baseQuery} />
                    <NavItem href="/admin/clientes" label="Clientes" query={baseQuery} />
                    <NavItem href="/admin/perfil" label="Perfil" query={baseQuery} />
                </nav>
            </aside>
        </>
    );
}
