"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
    "Entrenadores expertos",
    "Equipamiento de última generación",
    "Comunidad solidaria",
];

export default function PorQueElegirnosCollage() {
    const title = "¿Por qué elegirnos?";

    return (
        <section className="py-16 px-4 sm:px-8 lg:px-24 bg-bg text-fg transition-colors duration-300">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Imagen con movimiento */}
                <motion.div
                    className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-[450px] rounded-xl overflow-hidden shadow-2xl bg-card group"
                    initial={{ y: 0 }}
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Image
                        src="/img/chicas gym.jpg"
                        alt="Entrenamiento"
                        fill
                        className="object-cover transform transition-transform duration-700 ease-out group-hover:scale-105 group-hover:rotate-1"
                        priority
                    />
                </motion.div>

                {/* Texto y botones */}
                <div className="mx-auto max-w-lg text-center lg:text-left space-y-6">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-card-fg whitespace-pre">
                        {title.split("").map((char, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                {char}
                            </motion.span>
                        ))}
                        <motion.span
                            className="inline-block ml-1 w-[2px] bg-card-fg"
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />
                    </h2>

                    <p className="text-base sm:text-lg leading-relaxed text-card-desc">
                        Estamos comprometidos a ayudarte a alcanzar tus objetivos fitness
                        con los mejores recursos y apoyo disponibles.
                    </p>

                    <ul className="space-y-4 mb-8">
                        {features.map((feature, i) => (
                            <li
                                key={i}
                                className="flex items-center space-x-3 text-card-fg justify-center lg:justify-start text-sm sm:text-base"
                            >
                                <CheckCircle2 className="w-6 h-6 text-pink-600 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
                        <a
                            href="/know-more"
                            className="px-8 py-3 rounded-full font-bold shadow-md bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 text-white hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 text-center"
                        >
                            Saber más
                        </a>
                        <a
                            href="/contact"
                            className="px-8 py-3 rounded-full font-semibold border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300 transform hover:scale-105 text-center"
                        >
                            Contáctanos
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
