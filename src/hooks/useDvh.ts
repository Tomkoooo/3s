"use client"

import { useState, useEffect } from "react";

export default function useDvh() {
    const [dvh, setDvh] = useState("vh");

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (window.CSS.supports("height: 100dvh")) {
                setDvh("dvh")
            }
        }
    }, [])

    return dvh
}