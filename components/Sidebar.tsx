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
            // opcional: persistirlo
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

function NavItem({ href, label, query }: { href: string; label: string; query?: Record<string, string> }) {
    const pathname = usePathname();
    const active = pathname.startsWith(href);

    // Construye href con query si llega
    const hrefWithQuery = React.useMemo(() => {
        if (!query || Object.keys(query).length === 0) return href;
        const url = new URL(href, "http://dummy"); // base dummy para usar URL
        Object.entries(query).forEach(([k, v]) => {
            if (v != null && v !== "") url.searchParams.set(k, v);
        });
        // devolvemos path + search
        return url.pathname + (url.search ? url.search : "");
    }, [href, query]);

    return (
        <Link
            href={hrefWithQuery}
            className={`px-3 py-2 rounded-md text-sm transition
        ${active ? "bg-primary text-primary-foreground" : "hover:bg-default-100"}`}
        >
            {label}
        </Link>
    );
}

export default function AdminSidebar() {
    const empresaId = useEmpresaId();

    return (
        <aside className="border-r bg-background p-4 space-y-4">
            <h2 className="text-base font-semibold">Panel Admin</h2>
            <nav className="flex flex-col gap-1">
                {/* Si tenemos empresaId, lo pasamos en la query */}
                <NavItem href="/admin/gimnasios" label="Gimnasios" query={empresaId ? { empresa: empresaId } : undefined} />
                <NavItem href="/admin/empleados" label="Empleados" />
                <NavItem href="/admin/clientes" label="Clientes" />
                <NavItem href="/admin/perfil" label="Perfil" />
            </nav>
        </aside>
    );
}
