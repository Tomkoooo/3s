"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EyeIcon, EyeOffIcon } from "lucide-react"

function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
	const [isVisible, setIsVisible] = React.useState(false)

	return (
		<div className="flex items-center gap-2">
			<Input
				type={isVisible ? "text" : "password"}
				className={className}
				{...props}
			/>
			<Button
				type="button"
				variant="outline"
				size="icon"
				aria-label={isVisible ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
				onClick={() => setIsVisible((v) => !v)}
			>
				{isVisible ? (
					<EyeOffIcon className="w-4 h-4" />
				) : (
					<EyeIcon className="w-4 h-4" />
				)}
			</Button>
		</div>
	)
}

export { PasswordInput }


