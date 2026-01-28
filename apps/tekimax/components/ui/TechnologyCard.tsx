"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const TechnologyCard: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="group relative w-full max-w-sm"
        >
            {/* Ambient Background Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3178C6]/20 to-[#357ACA]/20 rounded-sm blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative bg-[#0b0f1a]/80 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden glass-card transition-all duration-500 group-hover:border-[#3178C6]/30 group-hover:shadow-[0_0_40px_rgba(49,120,198,0.15)]">
                {/* Image Container */}
                <div className="relative h-48 overflow-hidden">
                    <img
                        src="/images/typescript-banner.png"
                        alt="TypeScript-First Architecture"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-[#0b0f1a]/20 to-transparent"></div>

                    {/* Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#3178C6]/90 backdrop-blur-md border border-white/20 shadow-lg">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="white">
                            <path d="M1 1V23H23V1H1ZM17.438 18.156C17.438 19.344 16.719 20.25 15.281 20.25C14.031 20.25 13.094 19.531 12.656 18.75L13.875 17.969C14.156 18.5 14.656 19 15.281 19C15.844 19 16.188 18.719 16.188 18.313C16.188 17.906 15.938 17.719 15.094 17.344C13.844 16.781 12.75 16.125 12.75 14.719C12.75 13.563 13.594 12.5 15.188 12.5C16.344 12.5 17.156 13.125 17.594 14.125L16.438 14.813C16.156 14.281 15.75 13.781 15.125 13.781C14.656 13.781 14.031 14.031 14.031 14.656C14.031 15.031 14.344 15.25 15.156 15.625C16.469 16.219 17.438 16.781 17.438 18.156ZM11.656 20.125H10.375V13.688H7.719V12.625H14.344V13.688H11.656V20.125Z" />
                        </svg>
                        <span className="text-white text-[9px] font-black uppercase tracking-widest">TS-Architect</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#3178C6] transition-colors duration-300">
                        TypeScript-First Architecture
                    </h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-6 font-light">
                        Maximum type safety and developer productivity with our first-class TypeScript SDK and auto-generated API clients.
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3178C6] opacity-50"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3178C6] opacity-30"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3178C6] opacity-20"></span>
                        </div>
                        <span className="text-[10px] font-bold text-[#3178C6] uppercase tracking-tighter">Enterprise Ready</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
