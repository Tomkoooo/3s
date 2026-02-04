"use client";

import { useState } from "react";
import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DownloadIcon } from "lucide-react";

export default function ReportsPage() {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    const [startDate, setStartDate] = useState(lastMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const handleExport = () => {
        const params = new URLSearchParams({
            startDate,
            endDate,
        });
        window.location.href = `/api/admin/reports/export?${params.toString()}`;
    };

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-4xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Jelentések</h1>
                <p className="text-muted-foreground">
                    Ellenőrzési eredmények exportálása és elemzése
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ellenőrzési Eredmények Exportálása</CardTitle>
                    <CardDescription>
                        Lista letöltése CSV formátumban a kiválasztott időszakról
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Kezdő dátum</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Záró dátum</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button onClick={handleExport} className="w-full md:w-auto">
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Exportálás CSV-be
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Container>
    );
}
