"use client";

import { XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

type ImageModalProps = {
    src: string;
    alt: string;
    onClose: () => void;
};

export default function ImageModal({ src, alt, onClose }: ImageModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
            onClick={onClose}
        >
            <button 
                className="absolute top-4 right-4 p-2 text-white bg-black/50 rounded-full hover:bg-black/80 transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            >
                <XIcon className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-5xl h-[85vh]" onClick={e => e.stopPropagation()}>
                <Image 
                    src={src} 
                    alt={alt} 
                    fill 
                    className="object-contain"
                    sizes="100vw"
                />
            </div>
        </div>
    );
}
