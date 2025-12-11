"use client";

import { useEffect, useState } from "react";
import Container from "@/components/container";
import { Calendar as BigCalendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/hu";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { CalendarIcon, ListIcon } from "lucide-react";

// Set moment locale to Hungarian
moment.locale("hu");
const localizer = momentLocalizer(moment);

type CalendarEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: {
        _id: string;
        status: "scheduled" | "in_progress" | "completed";
        site: { name: string };
        participants: Array<{ fullName: string }>;
    };
};

export default function MyCalendarPage() {
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>("month");
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        async function loadAudits() {
            try {
                const response = await fetch("/api/audits/calendar");
                if (response.ok) {
                    const data = await response.json();
                    
                    const calendarEvents: CalendarEvent[] = data.audits.map((audit: any) => ({
                        id: audit._id,
                        title: audit.site?.name || "Ismeretlen terület",
                        start: new Date(audit.onDate),
                        end: new Date(audit.onDate),
                        resource: {
                            _id: audit._id,
                            status: audit.status,
                            site: audit.site,
                            participants: audit.participants,
                        },
                    }));

                    setEvents(calendarEvents);
                }
            } catch (error) {
                console.error("Failed to load calendar:", error);
            } finally {
                setLoading(false);
            }
        }

        loadAudits();
    }, []);

    const handleSelectEvent = (event: CalendarEvent) => {
        router.push(`/audits/${event.id}`);
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        const status = event.resource.status;
        
        let backgroundColor = "#3b82f6"; // blue for scheduled
        if (status === "in_progress") {
            backgroundColor = "#eab308"; // yellow
        } else if (status === "completed") {
            backgroundColor = "#22c55e"; // green
        }

        return {
            style: {
                backgroundColor,
                borderRadius: "4px",
                opacity: 0.9,
                color: "white",
                border: "0px",
                display: "block",
                fontSize: "13px",
                padding: "2px 5px",
            },
        };
    };

    const CustomEvent = ({ event }: { event: CalendarEvent }) => {
        return (
            <div className="flex items-center gap-1 overflow-hidden">
                <span className="truncate text-xs">{event.title}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <Container className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Naptár betöltése...</p>
            </Container>
        );
    }

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-full px-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Ellenőrzéseim</h1>
                    <p className="text-muted-foreground">
                        Naptár nézet ({events.length} ellenőrzés)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/audits")}
                    >
                        <ListIcon className="w-4 h-4 mr-2" />
                        Lista nézet
                    </Button>
                </div>
            </div>

            <Card className="p-4">
                <div className="calendar-wrapper" style={{ height: "70vh" }}>
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        components={{
                            event: CustomEvent,
                        }}
                        messages={{
                            today: "Ma",
                            previous: "Előző",
                            next: "Következő",
                            month: "Hónap",
                            week: "Hét",
                            day: "Nap",
                            agenda: "Napirend",
                            date: "Dátum",
                            time: "Idő",
                            event: "Esemény",
                            noEventsInRange: "Nincs esemény ebben az időszakban",
                            showMore: (total) => `+ ${total} további`,
                        }}
                        style={{ height: "100%" }}
                    />
                </div>
            </Card>

            {/* Legend */}
            <Card className="p-4">
                <h3 className="font-semibold mb-3">Jelmagyarázat</h3>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <StatusBadge status="scheduled" />
                        <span className="text-sm">Ütemezve</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status="in_progress" />
                        <span className="text-sm">Folyamatban</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status="completed" />
                        <span className="text-sm">Befejezett</span>
                    </div>
                </div>
            </Card>

            <style jsx global>{`
                .rbc-calendar {
                    font-family: inherit;
                }
                .rbc-header {
                    padding: 10px 5px;
                    font-weight: 600;
                    font-size: 14px;
                }
                .rbc-today {
                    background-color: #f0f9ff;
                }
                .rbc-event {
                    padding: 2px 5px;
                    font-size: 13px;
                }
                .rbc-event:focus {
                    outline: 2px solid #3b82f6;
                }
                .rbc-toolbar button {
                    padding: 6px 12px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                }
                .rbc-toolbar button:hover {
                    background: #f9fafb;
                }
                .rbc-toolbar button.rbc-active {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                }
            `}</style>
        </Container>
    );
}


