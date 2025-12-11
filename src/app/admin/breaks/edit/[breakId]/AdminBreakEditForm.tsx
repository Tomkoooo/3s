"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { useActionState, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import type { BreakFormState } from "@/app/my-account/breaks/actions";
import { updateBreakForUserAction } from "@/app/my-account/breaks/actions";
import dayjs from "@/lib/dayjs";

const initialState: BreakFormState = { success: false };

export type AdminBreakEditFormProps = {
    breakData: {
        _id: string;
        start: string;
        end?: string;
        reason?: string;
    };
    targetUserId: string;
    targetUserName: string;
};

export default function AdminBreakEditForm({ breakData, targetUserId, targetUserName }: AdminBreakEditFormProps) {
    const [startDate, setStartDate] = useState<Date | undefined>(
        breakData?.start ? dayjs(breakData.start).toDate() : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        breakData?.end ? dayjs(breakData.end).toDate() : undefined
    );
    const [reason, setReason] = useState(breakData?.reason || "");

    const handleStartDateChange = (date: Date | undefined) => {
        setStartDate(date);
        // Clear end date if it's before the new start date
        if (date && endDate && dayjs(endDate).isBefore(dayjs(date), 'day')) {
            setEndDate(undefined);
        }
    };

    const [state, formAction] = useActionState(
        updateBreakForUserAction.bind(null, breakData._id, targetUserId),
        initialState
    );

    useEffect(() => {
        if (state.success) {
            redirect("/admin/breaks");
        }
    }, [state.success]);

    return (
        <form className="flex flex-col gap-6" action={formAction}>
            <div className="flex flex-col gap-2">
                <Label>Felhasználó</Label>
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                    {targetUserName}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-1 items-center">
                    <Label htmlFor="start">Kezdő dátum</Label>
                    <span className="text-sm text-red-600">*</span>
                </div>
                <DatePicker
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    clearable={false}
                    dayDisableRule={(date) => {
                        return dayjs(date).isBefore(dayjs(), 'day');
                    }}
                />
                <input
                    type="hidden"
                    name="start"
                    value={startDate ? dayjs(startDate).format("YYYY-MM-DD") : ""}
                />
                {state.success === false && state.fieldErrors?.start?.length ? (
                    <p className="text-sm text-red-600">{state.fieldErrors.start[0]}</p>
                ) : null}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-1 items-center">
                    <Label htmlFor="end">Befejező dátum</Label>
                    <span className="text-sm text-muted-foreground">(opcionális)</span>
                </div>
                <DatePicker
                    selected={endDate}
                    onSelect={setEndDate}
                    clearable={true}
                    dayDisableRule={(date) => {
                        // Disable past dates
                        if (dayjs(date).isBefore(dayjs(), 'day')) return true;
                        // Disable dates before start date
                        if (startDate && dayjs(date).isBefore(dayjs(startDate), 'day')) return true;
                        return false;
                    }}
                />
                <input
                    type="hidden"
                    name="end"
                    value={endDate ? dayjs(endDate).format("YYYY-MM-DD") : ""}
                />
                {state.success === false && state.fieldErrors?.end?.length ? (
                    <p className="text-sm text-red-600">{state.fieldErrors.end[0]}</p>
                ) : null}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-1 items-center">
                    <Label htmlFor="reason">Indok</Label>
                    <span className="text-sm text-muted-foreground">(opcionális)</span>
                </div>
                <Input
                    id="reason"
                    name="reason"
                    placeholder="Szabadság, betegség, stb."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                {state.success === false && state.fieldErrors?.reason?.length ? (
                    <p className="text-sm text-red-600">{state.fieldErrors.reason[0]}</p>
                ) : null}
            </div>

            {state.success === false && state.message ? (
                <p className="text-sm text-red-600">{state.message}</p>
            ) : null}

            {state.success ? (
                <p className="text-sm text-green-600">Sikeresen mentve.</p>
            ) : null}

            <div className="flex flex-row gap-2 justify-end">
                <Button variant="outline" onClick={() => redirect("/admin/breaks")}>
                    Mégsem
                </Button>
                <Button type="submit">
                    Módosítás
                </Button>
            </div>
        </form>
    );
}
