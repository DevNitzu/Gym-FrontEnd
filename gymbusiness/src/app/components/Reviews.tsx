"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type Review = {
    id: number;
    name: string;
    photo: string;
    comment: string;
    rating: number;
};

const reviews: Review[] = [
    {
        id: 1,
        name: "Ana García",
        photo: "/img/users/ana.jpg",
        comment:
            "Excelente app, me motivó a entrenar todos los días. Muy fácil de usar y con rutinas personalizadas.",
        rating: 5,
    },
    {
        id: 2,
        name: "Carlos Pérez",
        photo: "/img/users/carlos.jpg",
        comment:
            "Muy buena plataforma, la animación de las estrellas me encanta y la experiencia es fluida.",
        rating: 4,
    },
    {
        id: 3,
        name: "Lucía Fernández",
        photo: "/img/users/lucia.jpg",
        comment:
            "Me gustó mucho el seguimiento de progreso, ha mejorado mi rendimiento notablemente.",
        rating: 5,
    },
    {
        id: 4,
        name: "Miguel Torres",
        photo: "/img/users/miguel.jpg",
        comment:
            "Interfaz sencilla y muy amigable, la app me ayuda a organizar mis entrenamientos.",
        rating: 5,
    },
    {
        id: 5,
        name: "Sofía López",
        photo: "/img/users/sofia.jpg",
        comment:
            "Las rutinas personalizadas realmente funcionan. Lo recomiendo a todos mis amigos.",
        rating: 5,
    },
];

function Star({ filled }: { filled: boolean }) {
    return (
        <svg
            fill={filled ? "#a83466" : "none"}
            stroke="#a83466"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.959a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.958c.3.922-.755 1.688-1.538 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.783.57-1.838-.196-1.538-1.118l1.287-3.958a1 1 0 00-.364-1.118L2.025 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.959z"
            />
        </svg>
    );
}

export default function ReviewsCarousel() {
    const [startIndex, setStartIndex] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [cardsToShow, setCardsToShow] = useState(3);

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth < 640) setCardsToShow(1);
            else if (window.innerWidth < 1024) setCardsToShow(2);
            else setCardsToShow(3);
        }
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setStartIndex((prev) => (prev + 1) % reviews.length);
        }, 4000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const visibleReviews = [];
    for (let i = 0; i < cardsToShow; i++) {
        visibleReviews.push(reviews[(startIndex + i) % reviews.length]);
    }

    return (
        <section className="max-w-7xl mx-auto p-6 bg-bg rounded-2xl shadow-lg text-fg select-none">
            <h3 className="text-3xl font-bold mb-10 text-center">
                Lo que dicen nuestros usuarios
            </h3>

            <div className="flex space-x-6 overflow-hidden">
                <AnimatePresence initial={false}>
                    {visibleReviews.map(({ id, name, photo, comment, rating }) => (
                        <motion.div
                            key={id}
                            className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 bg-card p-6 rounded-xl shadow-md flex flex-col items-center text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
                                <Image
                                    src={photo}
                                    alt={name}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                    priority={false}
                                />
                            </div>

                            <div className="flex justify-center mb-3 space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} filled={star <= rating} />
                                ))}
                            </div>

                            <p className="text-card-desc text-lg leading-relaxed mb-4 italic">
                                &quot;{comment}&quot;
                            </p>
                            <p className="font-semibold text-card-fg text-lg">- {name}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Dots indicadores */}
            <div className="flex justify-center mt-6 space-x-2">
                {reviews.map((_, idx) => (
                    <button
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            idx === startIndex ? "bg-pink-500 scale-125" : "bg-pink-200"
                        }`}
                        onClick={() => setStartIndex(idx)}
                        aria-label={`Ver review ${idx + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}
