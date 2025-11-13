export type Screen = "home" | "message" | "routine" | "timer";

export type VisibleModules = {
    feed: boolean;
    messages: boolean;
    notifications: boolean;
    routines: boolean;
    users: boolean;
    timer: boolean;
};
