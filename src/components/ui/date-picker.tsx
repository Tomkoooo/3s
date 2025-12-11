"use client"

import * as React from "react"
import dayjs from "@/lib/dayjs"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DatePicker({
    selected,
    onSelect,
    clearable = false,
    weekStartsOn = 1,
    disabled = false,
    dayDisableRule,
}: {
    selected?: Date
    onSelect: (date: Date | undefined) => void
    clearable?: boolean,
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    disabled?: boolean
    dayDisableRule?: (date: Date) => boolean
}) {
    return (
        <Popover open={disabled ? false : undefined}>
            <div className="flex flex-row gap-0">
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled}
                        data-empty={!selected}
                        className={cn(
                            "data-[empty=true]:text-muted-foreground grow justify-start text-left font-normal",
                            clearable && "rounded-r-none"
                        )}
                    >
                        <CalendarIcon />
                        {selected ? dayjs(selected).format("YYYY. MMMM DD.") : <span>Válasszon egy dátumot</span>}
                    </Button>
                </PopoverTrigger>
                {clearable && <Button disabled={!selected} variant="outline" className="rounded-l-none border-l-0" size="icon" onClick={() => onSelect(undefined)}>
                    <X />
                </Button>}
            </div>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selected} onSelect={onSelect}
                    dayDisableRule={dayDisableRule}
                    required
                    weekStartsOn={weekStartsOn}
                    formatters={{
                        formatDay: (date) => dayjs(date).format("D"),
                        formatCaption: (date) => `${dayjs(date).format("YYYY MMMM")}`,
                        formatMonthDropdown: (date) => dayjs(date).format("YYYY MMMM"),
                        formatWeekdayName: (date) => dayjs(date).format("dd"),
                        formatWeekNumber: (date) => dayjs(date).format("W"),
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}