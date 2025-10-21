"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({ href, label }: { href: string; label: string }) {
    const pathname = usePathname();
    const active = pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-md text-sm transition
        ${active ? "bg-primary text-primary-foreground" : "hover:bg-default-100"}`}
        >
            {label}
        </Link>
    );
}

export default function AdminSidebar() {
    return (
        <aside className="border-r bg-background p-4 space-y-4">
            <h2 className="text-base font-semibold">Panel Admin</h2>
            <nav className="flex flex-col gap-1">
                <NavItem href="/admin/dashboard" label="Dashboard" />
                <NavItem href="/admin/empleados" label="Empleados" />
                <NavItem href="/admin/clientes" label="Clientes" />
                <NavItem href="/admin/perfil" label="Perfil" /> 
                {/* Agrega más: /admin/productos, /admin/ordenes, etc. */}
            </nav>
        </aside>
    );
}
