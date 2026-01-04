"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Preloader from "../components/Preloader";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const heroTextRef = useRef<HTMLHeadingElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const marqueeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        // 1. Hero Text Reveal
        const tl = gsap.timeline({ delay: 4.5 }); // Wait for preloader
        tl.fromTo(heroTextRef.current,
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.5, ease: "power4.out" }
        );

        // 2. Video Zoom Scroll Effect
        gsap.fromTo(videoContainerRef.current,
            { scale: 0.8, opacity: 0.5 },
            {
                scale: 1,
                opacity: 1,
                scrollTrigger: {
                    trigger: videoContainerRef.current,
                    start: "top 80%",
                    end: "center center",
                    scrub: 1.5,
                }
            }
        );

        // 3. Marquee Scroll
        gsap.to(marqueeRef.current, {
            xPercent: -20,
            ease: "none",
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden cursor-default">
            <Preloader />

            {/* NAVIGATION */}
            <nav className="fixed top-0 w-full p-8 flex justify-between items-center z-40 mix-blend-difference">
                <div className="text-xl font-bold tracking-tighter">IZZU.</div>
                <div className="flex gap-8">
                    <Link href="/docs" className="hover:underline underline-offset-4 decoration-2">DOCS</Link>
                    <Link href="/login" className="hover:underline underline-offset-4 decoration-2">LOGIN</Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="h-screen flex flex-col justify-center items-center px-4 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,50,50,0.5),rgba(0,0,0,1))]" />

                <h1 ref={heroTextRef} className="text-[12vw] leading-[0.85] font-black tracking-tighter text-center mix-blend-overlay z-10 opacity-0">
                    IDENTITY <br />
                    RECLAIMED
                </h1>

                <div className="absolute bottom-12 flex flex-col items-center gap-4 z-10">
                    <div className="text-sm font-mono text-zinc-500">SCROLL TO UNLOCK</div>
                    <div className="w-[1px] h-16 bg-white/20" />
                </div>
            </section>

            {/* MARQUEE SECTION */}
            <div className="py-24 border-y border-white/10 overflow-hidden whitespace-nowrap bg-zinc-950">
                <div ref={marqueeRef} className="flex gap-16 text-8xl font-bold text-white/10">
                    <span>NO CLOUD</span>
                    <span>NO FEES</span>
                    <span>PURE MATH</span>
                    <span>AES-256</span>
                    <span>REAL TIME</span>
                    <span>NO CLOUD</span>
                    <span>NO FEES</span>
                </div>
            </div>

            {/* ZOOM SCROLL SECTION */}
            <section className="min-h-screen flex items-center justify-center py-32 px-4">
                <div ref={videoContainerRef} className="max-w-[1200px] w-full aspect-video bg-zinc-900 rounded-3xl overflow-hidden relative border border-white/10 group">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/40 transition-all duration-500 z-20">
                        <Link href="/login" className="px-12 py-5 bg-white text-black text-xl font-bold rounded-full hover:scale-110 transition-transform duration-300 flex items-center gap-3">
                            DEPLOY NOW <ArrowRight className="w-6 h-6" />
                        </Link>
                    </div>

                    {/* Abstract Grid Video Placeholder */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                </div>
            </section>

            {/* TYPOGRAPHY LIST */}
            <section className="py-32 px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div>
                        <h3 className="text-zinc-500 font-mono mb-8">( 001 )</h3>
                        <h2 className="text-6xl font-bold mb-6">SELF HOSTED.</h2>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-md">
                            Your data never leaves your metal. We provide the mathematical engine. You provide the infrastructure. Zero probability of third-party breaches.
                        </p>
                    </div>
                    <div className="md:pt-32">
                        <h3 className="text-zinc-500 font-mono mb-8">( 002 )</h3>
                        <h2 className="text-6xl font-bold mb-6">ANTI SPOOF.</h2>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-md">
                            Laplacian variance checks. 3D Mesh Depth analysis. Gaze tracking. Photos don't work. Videos don't work. Masks don't work.
                        </p>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="h-screen bg-white text-black flex flex-col justify-center items-center relative overflow-hidden">
                <h2 className="text-[15vw] font-black tracking-tighter leading-none hover:italic transition-all duration-500 cursor-pointer">
                    <Link href="/login">GET IZZU</Link>
                </h2>
                <div className="absolute bottom-8 w-full px-8 flex justify-between text-sm font-bold uppercase tracking-widest">
                    <div>© 2026 IZZU INC</div>
                    <div>GITHUB: THISISTANISHQ/IZZU</div>
                </div>
            </footer>
        </div>
    );
}
