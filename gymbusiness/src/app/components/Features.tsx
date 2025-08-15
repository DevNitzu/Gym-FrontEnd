"use client";
import React from "react";
import { motion } from "framer-motion";

const features = [
    {
        title: "Entrenamientos personalizados",
        desc: "Crea planes a la medida para cada cliente y sigue su progreso.",
        icon: (
            <svg
                className="w-6 h-6 text-pink-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.5 0-3 .5-3 3s1.5 3 3 3 3-.5 3-3-1.5-3-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m0-7a6 6 0 100-12 6 6 0 000 12z" />
            </svg>
        ),
    },
    {
        title: "Monitoreo en tiempo real",
        desc: "Sigue las métricas de tus clientes desde cualquier lugar.",
        icon: (
            <svg
                className="w-6 h-6 text-pink-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a3 3 0 013-3h3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h-4a1 1 0 01-1-1v-3a1 1 0 011-1h3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h3a2 2 0 002-2v-4a2 2 0 00-2-2h-3" />
            </svg>
        ),
    },
    {
        title: "Motivación y retos",
        desc: "Crea retos y desafíos para mantener a tus clientes motivados.",
        icon: (
            <svg
                className="w-6 h-6 text-pink-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c5-1.5 9-7.5 9-13a9 9 0 10-18 0c0 5.5 4 11.5 9 13z" />
            </svg>
        ),
    },
];

export default function Features() {
    return (
        <section id="features" className="py-20 bg-bg transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 text-fg">
                    Características principales
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
                    {features.map(({ title, desc, icon }, i) => (
                        <motion.div
                            key={title}
                            className="bg-card p-6 sm:p-8 rounded-xl shadow-md hover:shadow-2xl transition-transform duration-300 cursor-default flex flex-col items-start"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2, duration: 0.6 }}
                        >
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 mb-4">
                                {icon}
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-card-fg">{title}</h3>
                            <p className="text-card-desc">{desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
