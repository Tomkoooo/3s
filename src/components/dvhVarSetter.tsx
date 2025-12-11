"use client"

import useDvh from "@/hooks/useDvh";

export default function DvhVarSetter() {
    const dvh = useDvh()

    return (
        <style precedence="1" href="dvh-var-setter" dangerouslySetInnerHTML={{
            __html: `
                :root {
                    --dvh: 1${dvh};
                }
            `
        }} />
    )
}