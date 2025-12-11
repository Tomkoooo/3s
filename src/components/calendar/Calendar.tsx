"use client";

import dayjs from "@/lib/dayjs";
import { cn, loopingNumber } from "@/lib/utils";
import React, { useCallback, useMemo, useState } from "react";

const weekDays = Array.from({ length: 7 }, (_, index) => dayjs().day(index + 1).format("dd"))

const DayEvent = ({
    event,
    type,
    isNewLine,
}: {
    event: NonNullable<CalendarProps["events"]>[number]
    type: "start" | "end" | "between" | "allDay"
    isNewLine: boolean
}) => {
    const { title } = useMemo(() => event, [event])

    // Only show title for single-day events, start of multi-day events, or when it's a new line
    const shouldShowTitle = type === "allDay" || type === "start" || isNewLine

    return (
        <div
            className={cn(
                "text-xs font-medium h-fit bg-amber-800 text-white md:px-2 md:py-0.5 text-nowrap min-w-full w-full",
                !shouldShowTitle && "text-transparent",
                (shouldShowTitle && type !== "allDay") && "min-w-max z-2 overflow-visible",
                type === "allDay" && "rounded-sm md:rounded-xl",
                type === "start" && "rounded-tl-sm md:rounded-tl-xl rounded-bl-sm md:rounded-bl-xl",
                type === "end" && "rounded-tr-sm md:rounded-tr-xl rounded-br-sm md:rounded-br-xl",
            )}>
            {title}
        </div>
    )
}

const DayItem = ({
    day,
    monthIndicator = 0,
    today = false,
    events
}: {
    day: dayjs.Dayjs
    monthIndicator?: 0 | 1 | -1
    today?: boolean
    events?: {
        event: NonNullable<CalendarProps["events"]>[number]
        type: "start" | "end" | "between" | "allDay"
    }[]
}) => {
    const notCurrentMonth = useMemo(() => {
        return monthIndicator !== 0
    }, [monthIndicator])

    return (
        <div className={cn(
            "flex flex-col grow hover:bg-gray-100 transition-colors duration-100 rounded-md relative overflow-visible",
            today && "after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-[.3rem] after:bg-blue-500 after:rounded-full"
        )}>
            <span className={cn(
                "text-xs font-medium p-2",
                notCurrentMonth && "text-gray-400",
                today && "text-blue-500 md:text-sm"
            )}>{day.format("DD")}</span>
            <div className="w-full grid grid-rows-[1fr_auto] gap-1 items-start justify-stretch h-min">
                {events?.map((event) => (
                    <DayEvent
                        key={event.event.title}
                        event={event.event}
                        type={event.type}
                        isNewLine={day.day() === 1} // Monday is day 1 in dayjs
                    />
                ))}
            </div>
        </div>
    )
}

export interface CalendarProps {
    yearAndMonthInView?: string
    events?: {
        start: dayjs.Dayjs
        end?: dayjs.Dayjs // if not provided, it means the event is for the day
        title: string
        description: string
    }[]
}

export const Calendar = ({
    yearAndMonthInView,
    events: eventsProp
}: CalendarProps) => {
    const today = useMemo(() => dayjs(), [])
    const [ymView] = useState(yearAndMonthInView || today.format("YYYY-MM"))
    const [events] = useState<NonNullable<CalendarProps["events"]>>(eventsProp || [])

    const processedEvents = useMemo<NonNullable<CalendarProps["events"]>>(() => {
        const multidayEvents = events.filter((event) => event.end)
        // sort multiday events by duration
        multidayEvents.sort((a, b) => {
            const durationA = a.end!.diff(a.start, "day")
            const durationB = b.end!.diff(b.start, "day")
            return durationB - durationA
        })
        // for each multiday event, check if it collides with any single day event
        for (const multidayEvent of multidayEvents) {
            for (const multidayEvent2 of multidayEvents) {
                const startIsInside = multidayEvent.start.isBetween(multidayEvent2.start, multidayEvent2.end, "day", "[]")
                const endIsInside = multidayEvent.end!.isBetween(multidayEvent2.start, multidayEvent2.end, "day", "[]")
                if (startIsInside || endIsInside) {
                    multidayEvents.splice(multidayEvents.indexOf(multidayEvent2), 1)
                    multidayEvents.push({
                        start: multidayEvent2.start,
                        end: multidayEvent2.end,
                        title: multidayEvent2.title,
                        description: multidayEvent2.description
                    })
                }
            }
        }

        const singleDayEvents = events.filter((event) => !event.end)

        return [...multidayEvents, ...singleDayEvents]
    }, [events])

    const daysInMonth = useMemo<dayjs.Dayjs[]>(() => {
        const [year, month] = ymView.split("-")
        const firstDayOfMonth = dayjs(`${year}-${month}-01`)
        const lastDayOfMonth = firstDayOfMonth.endOf("month")
        const daysInMonth = lastDayOfMonth.diff(firstDayOfMonth, "day") + 1
        return Array.from({ length: daysInMonth }, (_, index) => dayjs(`${year}-${month}-${index + 1}`))
    }, [ymView])

    const getEventsForDay = useCallback((day: dayjs.Dayjs): {
        event: NonNullable<CalendarProps["events"]>[number]
        type: "start" | "end" | "between" | "allDay"
    }[] => {
        return processedEvents.map((event) => {
            if (event.end) {
                return day.isBetween(event.start, event.end, "day", "[]") ? {
                    event,
                    type: (() => {
                        if (day.isSame(event.start, "day")) return "start" as const
                        if (day.isSame(event.end, "day")) return "end" as const
                        return "between" as const
                    })()
                } : null
            }
            return day.isSame(event.start, "day") ? {
                event,
                type: "allDay" as const
            } : null
        }).filter((item): item is NonNullable<typeof item> => item !== null)
    }, [processedEvents])

    const prependedDays = useMemo<dayjs.Dayjs[]>(() => {
        const firstDayOfMonth = dayjs(`${ymView}-01`)
        const weekDay = loopingNumber({
            current: firstDayOfMonth.day(),
            min: 0,
            max: 6,
            step: -1
        })
        if (weekDay === 0) return []
        const daysToPrepend = Array.from({ length: weekDay }, (_, index) => firstDayOfMonth.subtract(index + 1, "day"))
        return daysToPrepend.reverse()
    }, [ymView])

    const appendedDays = useMemo<dayjs.Dayjs[]>(() => {
        const lastDayOfMonth = dayjs(`${ymView}-01`).endOf("month")
        const weekDay = lastDayOfMonth.day()
        if (weekDay === 0) return []
        const daysToAppend = Array.from({ length: 7 - weekDay }, (_, index) => lastDayOfMonth.add(index + 1, "day"))
        return daysToAppend
    }, [ymView])

    const daysToRender = useMemo<{
        day: dayjs.Dayjs
        monthIndicator: 0 | 1 | -1
    }[]>(() => {
        return [
            ...prependedDays.map((day) => ({ day, monthIndicator: -1 as const })),
            ...daysInMonth.map((day) => ({ day, monthIndicator: 0 as const })),
            ...appendedDays.map((day) => ({ day, monthIndicator: 1 as const })),
        ]
    }, [prependedDays, daysInMonth, appendedDays])

    return (
        <div
            className={cn(
                "flex-1 grid items-stretch grid-cols-7 md:grid-cols-[1.5rem_repeat(7,1fr)] grid-rows-[1rem_repeat(5,1fr)] select-none",
                "md:grid-cols-[1.5rem_repeat(7,1fr)] md:grid-rows-[1rem_repeat(5,1fr)]",
                "[--zoom:.9] md:[--zoom:1]"
            )}
            style={{
                zoom: "var(--zoom)"
            }}
        >
            <div className="col-span-1 hidden md:flex" />
            {weekDays.map((day) => (
                <div key={day} className="flex flex-col items-start justify-center px-2">
                    <span className="text-xs font-light">{day}</span>
                </div>
            ))}
            {daysToRender.map((day, i) => (
                <React.Fragment key={`${day.day.format("YYYY-MM-DD")}-fragment`}>
                    {i % 7 === 0 && (
                        <div className="col-span-1 hidden items-start justify-start py-2 md:flex">
                            <span className="text-xs font-light">{day.day.week()}</span>
                        </div>
                    )}
                    <DayItem day={day.day} monthIndicator={day.monthIndicator} today={day.day.isSame(today, "day")} events={getEventsForDay(day.day)} />
                </React.Fragment>
            ))}
        </div>
    )
}