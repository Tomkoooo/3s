"use client"

import { useMemo } from "react";
import { Calendar } from "@/components/calendar/Calendar";
import Container from "@/components/container";
import dayjs from "@/lib/dayjs";

export default function CalendarDemoPage() {

    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const currentMonth = useMemo(() => new Date().getMonth(), []);

    // Példa események - több napos eseményekkel Google Calendar stílusban
    const sampleEvents = [
        {
            start: dayjs().year(currentYear).month(currentMonth).date(15).hour(9).minute(0),
            end: dayjs().year(currentYear).month(currentMonth).date(16).hour(17).minute(0),
            title: "2 napos program",
            description: "Konferencia leírása",
        },
        {
            start: dayjs().year(currentYear).month(currentMonth).date(16).hour(10).minute(0),
            title: "Egy napos program",
            description: "Egy napos program leírása",
        },
        {
            start: dayjs().year(currentYear).month(currentMonth).date(15).hour(9).minute(0),
            end: dayjs().year(currentYear).month(currentMonth).date(19).hour(17).minute(0),
            title: "5 napos program",
            description: "Konferencia leírása",
        },
        {
            start: dayjs().year(currentYear).month(currentMonth).date(10).hour(10).minute(0),
            title: "Esemény",
            description: "Esemény leírása",
        },
        {
            start: dayjs().year(currentYear).month(currentMonth).date(10).hour(10).minute(0),
            title: "Még egy esemény",
            description: "Esemény leírása",
        }
    ];

    return (
        <Container className="flex-1 flex flex-col">
            <Calendar events={sampleEvents} />
        </Container>
    );
}
