"use client";

import React from "react";
import AdminSidebar from "@/components/Sidebar"; // tu ruta real

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-background">
            {/* 1 col en mobile, 2 cols en md+: [sidebar 16rem | contenido] */}
            <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
                {/* Celda 1: Sidebar (en móvil solo topbar; en md+ aside fijo) */}
                <AdminSidebar />

                {/* Celda 2: Contenido */}
                <main className="min-w-0">
                    {/* padding responsivo + ancho máximo opcional */}
                    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
