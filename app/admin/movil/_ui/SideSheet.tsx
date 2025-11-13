"use client";
import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function SideSheet({
    open, onClose, title, icon, children, width = 420,
}: {
    open: boolean; onClose: () => void; title: string; icon: string; children: React.ReactNode; width?: number;
}) {
    return (
        <>
            <div
                onClick={onClose}
                className={`fixed inset-0 z-[60] bg-black/15 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
            />
            <aside
                role="dialog"
                aria-modal="true"
                className={[
                    "fixed right-0 top-0 z-[61] h-dvh w-full border-l bg-background/95 backdrop-blur-md shadow-2xl",
                    "transition-transform will-change-transform", open ? "translate-x-0" : "translate-x-full", "flex flex-col",
                ].join(" ")}
                style={{ maxWidth: width }}
            >
                <header className="flex items-center gap-2 border-b px-4 py-3">
                    <Icon icon={icon} />
                    <h3 className="font-semibold">{title}</h3>
                    <Button size="sm" variant="light" className="ml-auto" onPress={onClose}>Cerrar</Button>
                </header>
                <div className="flex-1 overflow-y-auto p-4">{children}</div>
            </aside>
        </>
    );
}
