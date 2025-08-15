"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules"; // quitamos Pagination
import Image from "next/image";
import { motion } from "framer-motion";
import "swiper/css";

const activities = [
    { title: "Entrenamiento de fuerza", imgSrc: "/img/actividades/strength.jpg" },
    { title: "Cardio", imgSrc: "/img/actividades/cardio.jpg" },
    { title: "Entrenamiento funcional", imgSrc: "/img/actividades/funcional.jpg" },
    { title: "Entrenamiento personalizado", imgSrc: "/img/actividades/personal.jpg" },
];

export default function ActividadesCarousel() {
    return (
        <section className="py-20 px-6 sm:px-8 lg:px-24 bg-bg text-fg transition-colors duration-300">
            <h2 className="text-4xl font-bold text-center mb-12 text-card-fg">
                NUESTRAS{" "}
                <motion.span
                    className="underline underline-offset-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-pink-600 to-pink-400"
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 4, repeat: Infinity, repeatType: "loop" }}
                    style={{ backgroundSize: "200% 200%" }}
                >
                    ACTIVIDADES
                </motion.span>
            </h2>

            <Swiper
                modules={[Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                breakpoints={{
                    640: { slidesPerView: 1 },
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                }}
                className="max-w-7xl mx-auto"
            >
                {activities.map(({ title, imgSrc }, index) => (
                    <SwiperSlide key={index} className="flex justify-center">
                        <div className="relative rounded-lg overflow-hidden group shadow-xl bg-card">
                            <div className="relative w-full h-[32rem]">
                                <Image
                                    src={imgSrc}
                                    alt={title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    priority={index === 0}
                                />
                            </div>
                            <div className="absolute bottom-0 left-0 w-full bg-[color:var(--card-bg)]/90 p-4 text-center">
                                <h3 className="text-lg font-semibold uppercase text-card-fg">{title}</h3>
                                <button className="mt-3 text-sm px-4 py-2 border border-pink-400 text-pink-400 rounded hover:bg-pink-400 hover:text-black transition-colors">
                                    Ver más
                                </button>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}
