"use client";

import { useState } from "react";
import ImageModal from "./ImageModal";

export default function ClickableImage({ src, alt, className }: { src: string, alt: string, className?: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div 
                className={`cursor-zoom-in ${className || ''}`} 
                onClick={() => setIsOpen(true)}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className="w-full h-full object-cover transition-transform hover:scale-[1.02]" />
            </div>
            {isOpen && <ImageModal src={src} alt={alt} onClose={() => setIsOpen(false)} />}
        </>
    );
}
