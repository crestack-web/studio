"use client";
import React, { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Chimmy L.",
    role: "Retail Seller",
    quote: "Busmo made it so easy to manage my inventory and payments. My sales grew 30% in just two months!",
    avatar: "https://tse1.mm.bing.net/th/id/OIF.D8u49GMTOq3J3AhXssoy2A?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    name: "James K.",
    role: "Investor",
    quote: "I love how transparent and simple investing is with Busmo. The returns are great and the process is smooth.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Fatima S.",
    role: "Fashion Entrepreneur",
    quote: "The onboarding was seamless. I recommend Busmo to every small business owner I know.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Tunde A.",
    role: "BusmoPay User",
    quote: "Collecting payments from customers is now stress-free. BusmoPay is a game changer for my business.",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
  },
  {
    name: "Deborah E.",
    role: "Marketplace Seller",
    quote: "BusmoGo helped me reach more customers than ever before. Highly recommended!",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(timer);
  }, []);

  const prev = () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setIndex((i) => (i + 1) % testimonials.length);

  return (
    <section className="w-full max-w-2xl mx-auto my-16 px-4">
      <h2 className="text-2xl font-bold text-center mb-8 text-purple-700">What our users say</h2>
      <div className="relative bg-white border border-gray-100 rounded-xl shadow p-8 flex flex-col items-center transition-all duration-300 min-h-[220px]">
        <img
          src={testimonials[index].avatar}
          alt={testimonials[index].name}
          className="w-14 h-14 rounded-full mb-4 border-2 border-purple-100"
        />
        <blockquote className="text-lg text-gray-700 italic text-center mb-4">
          “{testimonials[index].quote}”
        </blockquote>
        <div className="text-sm text-gray-900 font-semibold">{testimonials[index].name}</div>
        <div className="text-xs text-gray-500">{testimonials[index].role}</div>
        {/* Controls */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <button
            aria-label="Previous testimonial"
            onClick={prev}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full p-2 shadow transition"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M13 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <button
            aria-label="Next testimonial"
            onClick={next}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full p-2 shadow transition"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        {/* Dots */}
        <div className="flex gap-2 mt-6 absolute bottom-4 left-1/2 -translate-x-1/2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2.5 h-2.5 rounded-full ${i === index ? "bg-purple-700" : "bg-purple-200"} transition`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}