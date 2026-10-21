"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Display_Image({ play, image_src, vid_src }: { play: boolean; image_src: string; vid_src?: string }) {
    const vidRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!vidRef.current) return;
        if (!play) {
            vidRef.current.currentTime = 0;
            vidRef.current.pause();
        } else vidRef.current.play();
    }, [play]);

    const [fallback, set_fallback] = useState<boolean>(false);

    return vid_src && !fallback ? (
        <>
            <video ref={vidRef} className={`${play ? "flex" : "hidden"} w-full h-full object-cover`} controls={false} preload="metadata" loop poster={image_src} muted autoPlay={false} playsInline onError={() => set_fallback(true)}>
                <source src={vid_src} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <Image src={image_src} alt={image_src} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 40vw" className={`brightness-100 ${play ? "hidden" : "flex"}`} />
        </>
    ) : (
        <Image src={image_src} alt={image_src} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 40vw" className={`brightness-80 group-hover:brightness-100 group-hover:scale-105 transition-default`} />
    );
}
