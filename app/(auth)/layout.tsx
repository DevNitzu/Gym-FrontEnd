'use client'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <section className="relative flex flex-col min-h-screen">
            <main className="container max-w-full flex-grow overflow-x-hidden">
                {children}
            </main>
        </section>
    )
}
