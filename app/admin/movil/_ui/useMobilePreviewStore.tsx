"use client";

import React from "react";

export type Screen = "home" | "message" | "routine" | "timer";
export type VisibleModules = {
    feed: boolean;
    messages: boolean;
    notifications: boolean;
    routines: boolean;
    users: boolean;
    timer: boolean;
};

type State = {
    screen: Screen;
    phone: { w: number; h: number; zoom: number };
    visible: VisibleModules;
    sheets: {
        messages: boolean;
        push: boolean;
        routines: boolean;
        users: boolean;
        branding: boolean;
        modules: boolean;
    };
};

type Ctx = {
    state: State;
    setScreen: (s: Screen) => void;
    setPhone: (p: Partial<State["phone"]>) => void;
    setVisible: (up: Partial<VisibleModules>) => void;
    open: (k: keyof State["sheets"]) => void;
    close: (k: keyof State["sheets"]) => void;
    anyOpen: () => boolean;
};

const MobileCtx = React.createContext<Ctx | null>(null);

export function MobileProvider({ children }: { children: React.ReactNode }): JSX.Element {
    const [state, setState] = React.useState<State>({
        screen: "home",
        phone: { w: 360, h: 740, zoom: 85 },
        visible: { feed: true, messages: true, notifications: true, routines: true, users: true, timer: true },
        sheets: { messages: false, push: false, routines: false, users: false, branding: false, modules: false },
    });

    const setScreen = (s: State["screen"]) => setState(v => ({ ...v, screen: s }));
    const setPhone = (p: Partial<State["phone"]>) => setState(v => ({ ...v, phone: { ...v.phone, ...p } }));
    const setVisible = (up: Partial<VisibleModules>) => setState(v => ({ ...v, visible: { ...v.visible, ...up } }));
    const open = (k: keyof State["sheets"]) => setState(v => ({ ...v, sheets: { ...v.sheets, [k]: true } }));
    const close = (k: keyof State["sheets"]) => setState(v => ({ ...v, sheets: { ...v.sheets, [k]: false } }));
    const anyOpen = () => Object.values(state.sheets).some(Boolean);

    return (
        <MobileCtx.Provider value={{ state, setScreen, setPhone, setVisible, open, close, anyOpen }}>
            {children}
        </MobileCtx.Provider>
    );
}

export function useMobile(): Ctx {
    const ctx = React.useContext(MobileCtx);
    if (!ctx) throw new Error("useMobile must be used inside <MobileProvider/>");
    return ctx;
}
