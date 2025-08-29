'use client'

import { Suspense } from "react";
import { ThemeSwitch } from "@/components/theme-switch";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full">
            {/* Sidebar fijo a la izquierda */}

            {/* Contenido principal que ocupa el resto del espacio */}
            <main className="flex-1 bg-background overflow-hidden">
                <Suspense fallback={<div>Cargando...</div>}>
                    <div className="flex items-center justify-center p-2 m-3 rounded-full absolute right-0 bottom-0 bg-gray-300 dark:bg-gray-900 backdrop-blur-sm shadow-lg z-50">
                        <ThemeSwitch />
                    </div>
                    {children}
                </Suspense>
            </main>
        </div>
    )
}
