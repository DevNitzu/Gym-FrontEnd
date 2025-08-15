"use client";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section
            className="relative py-20 sm:py-28 md:py-32 transition-colors duration-300 overflow-hidden"
        >
            {/* Imagen + overlay animada */}
            <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 1.05 }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                }}
                className="absolute inset-0 bg-hero-image bg-cover bg-center"
            >
                <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-brightness-90 dark:backdrop-brightness-75" />
            </motion.div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center lg:items-start justify-between">
                {/* Texto y botón */}
                <div className="w-full lg:w-1/2 text-center lg:text-left">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-white"
                    >
                        Tu gimnasio más cerca, más inteligente
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-base sm:text-lg md:text-xl mb-10 text-white max-w-lg mx-auto lg:mx-0"
                    >
                        Descubre nuestra app para entrenar donde y cuando quieras.
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 100 }}
                        whileHover={{ scale: 1.05 }}
                        className="bg-[#a83466] hover:bg-[#922c59] text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-colors duration-300 text-base sm:text-lg"
                    >
                        Conoce más
                    </motion.button>
                </div>
            </div>
        </section>
    );
}
