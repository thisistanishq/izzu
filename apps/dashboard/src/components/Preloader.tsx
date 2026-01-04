"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader() {
    const [complete, setComplete] = useState(false);
    const words = ["Hello", "Bonjour", "Ciao", "Olà", "やあ", "Hallå", "Hallo", "Namaskaram", "Vanakkam"];

    useEffect(() => {
        const helloText = document.getElementById('hello-text');
        if (!helloText) return;

        let index = 0;

        function typeWord(word: string, callback: () => void) {
            let i = 0;
            const interval = setInterval(() => {
                if (helloText) helloText.textContent += word[i];
                i++;
                if (i === word.length) {
                    clearInterval(interval);
                    setTimeout(callback, 200);
                }
            }, 40);
        }

        function cycleWords() {
            if (index < words.length) {
                typeWord(words[index], () => {
                    if (helloText) helloText.textContent = '';
                    index++;
                    cycleWords();
                });
            } else {
                setTimeout(() => {
                    setComplete(true);
                }, 500);
            }
        }

        cycleWords();
    }, []);

    return (
        <AnimatePresence>
            {!complete && (
                <motion.div
                    id="preloader"
                    initial={{ y: 0 }}
                    exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
                    className="fixed inset-0 z-[100] bg-black text-white flex items-center justify-center"
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <h1 id="hello-text" className="text-4xl md:text-6xl font-mono relative">
                            {/* Text injected by JS */}
                        </h1>
                        <span className="w-3 h-12 bg-white animate-pulse" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
