"use client";

import React from "react";
import AdminSidebar from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-dvh"
            style={{
                backgroundImage: `url("/fondo.png")`,
                backgroundSize: "250px",     // cambia el tamaño del patrón
                backgroundRepeat: "repeat",   // para que se repita
                backgroundPosition: "center",
                backgroundColor: "#ffffff",   // color base
            }}
        >
            <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
                <AdminSidebar />

                <main className="min-w-0">
                    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
