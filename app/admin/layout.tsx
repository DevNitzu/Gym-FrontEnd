import type { ReactNode } from "react";
import AdminSidebar from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen grid grid-cols-[220px_1fr]">
            <AdminSidebar />
            <main className="p-6">{children}</main>
        </div>
    );
}
