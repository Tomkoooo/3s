"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CopyIcon } from "lucide-react"
import { toast } from "sonner"

function CopyInput({ className, ...props }: React.ComponentProps<"input">) {
	return (
		<div className="flex items-center gap-2">
			<Input
				type="text"
				readOnly
				className={className}
				{...props}
			/>
			<Button
				type="button"
				variant="outline"
				size="icon"
				aria-label="Másolás"
				onClick={() => {
					navigator.clipboard.writeText(props.value as string)
					toast("Másolva", {
						icon: <CopyIcon className="w-4 h-4" />
					})
				}}
			>
				<CopyIcon className="w-4 h-4" />
			</Button>
		</div>
	)
}

export { CopyInput }


