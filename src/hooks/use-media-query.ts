import { useState, useEffect } from "react";

export default function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const listener = () => {
                setMatches(window.matchMedia(query).matches);
            }

            window.addEventListener("resize", listener);
            window.addEventListener("orientationchange", listener);
            window.addEventListener("change", listener);
            listener();

            return () => {
                window.removeEventListener("resize", listener);
                window.removeEventListener("orientationchange", listener);
                window.removeEventListener("change", listener);
            }
        }
    }, [query]);

    return matches;
}