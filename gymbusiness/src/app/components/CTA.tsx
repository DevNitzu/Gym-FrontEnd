"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function CTA() {
    return (
        <section className="bg-cta w-full py-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 items-center min-h-[400px]">
                {/* Texto */}
                <div className="max-w-xl mx-auto md:mx-0 text-center md:text-left px-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
                        ¿Listo para transformar tu cuerpo?
                    </h2>
                    <p className="mb-6 text-lg sm:text-xl text-fg/90">
                        Únete a miles de usuarios que ya usan nuestra app.
                    </p>
                    <button
                        className="px-8 py-4 rounded-full font-bold shadow-lg bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 text-white hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                        aria-label="Descargar la aplicación GYMFIT"
                    >
                        Descárgala ahora
                    </button>
                </div>

                {/* Imagen con animación */}
                <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-full h-64 sm:h-80 md:h-96 px-4"
                >
                    <Image
                        src="/img/mockup.png"
                        alt="Mockup de la aplicación GYMFIT"
                        layout="fill"
                        objectFit="contain"
                        priority
                    />
                </motion.div>
            </div>
        </section>
    );
}
