// app/admin/layout.tsx
"use client";

import React from "react";
import AdminSidebar from "@/components/Sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="min-h-dvh w-full"
           /*  style={{
                backgroundImage: `url("/fondo.png")`,
                backgroundSize: "250px",
                backgroundRepeat: "repeat",
                backgroundPosition: "center",
                backgroundColor: "#ffffff",
            }} */
        >
            <div className="flex min-h-dvh w-full">
                <AdminSidebar />

                {/* CONTENIDO */}
                <main className="flex-1 min-w-0">
                    <div className="w-full h-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
