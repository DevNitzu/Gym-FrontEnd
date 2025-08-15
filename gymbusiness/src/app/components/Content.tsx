"use client";
import React from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Content() {
  const features = [
    "Planes personalizados",
    "Entrenadores certificados",
    "Área de cardio, pesas y crossfit",
    "Clases grupales dinámicas",
  ];

  return (
    <section className="bg-bg py-16 px-4 sm:px-8 lg:px-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Texto */}
        <div className="text-center md:text-left space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-fg leading-tight">
            Transforma tu cuerpo con{" "}
            <span className="text-[#a83466] dark:text-pink-400">GYMFIT</span>
          </h2>
          <p className="text-base sm:text-lg text-fg max-w-xl mx-auto md:mx-0">
            En GYMFIT te ayudamos a alcanzar tus metas de salud y bienestar con
            programas personalizados, entrenadores expertos y el mejor ambiente
            de entrenamiento.
          </p>

          <ul className="space-y-3 max-w-md mx-auto md:mx-0">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center space-x-3 text-fg text-base sm:text-lg">
                <CheckCircle2 className="w-5 h-5 text-[#a83466]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <a
            href="/servicios"
            className="inline-block bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 text-white px-8 py-3 rounded-xl shadow-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
          >
            Conoce nuestros servicios
          </a>
        </div>

        {/* Imagen con animación sutil */}
        <motion.div
          className="flex justify-center md:justify-end"
          initial={{ y: 0 }}
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/img/PesasGym.jpg"
            alt="Entrenamiento GYMFIT"
            width={500}
            height={500}
            className="rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
