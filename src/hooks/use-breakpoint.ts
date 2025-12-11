import useMediaQuery from "./use-media-query";

export const breakpoints = {
    xs: "0rem",
    sm: "48rem",
    md: "64rem",
    lg: "80rem",
    xl: "96rem",
    "2xl": "128rem",
}

export interface UseBreakpointProps {
    breakpoint: keyof typeof breakpoints,
    type: "max" | "min"
}

export default function useBreakpoint({
    breakpoint,
    type = "min"
}: UseBreakpointProps) {
    const isBreakpoint = useMediaQuery(`(${type}-width: ${breakpoints[breakpoint]})`);

    return isBreakpoint;
}