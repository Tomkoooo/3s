"use client"

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useState, useCallback, createContext, useContext } from "react";
import dayjs from "@/lib/dayjs";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

export interface useDateRangeInputProps {
    prompt: () => void,
    $open: boolean
    $setOpen: (open: boolean) => void
}

export interface DateRangeInputProviderProps {
    children: React.ReactNode
    onPush?: ({ startDate, endDate }: {
        startDate: dayjs.Dayjs
        endDate?: dayjs.Dayjs
    }) => void
}

const DateRangeInputContextRoot = createContext<useDateRangeInputProps>({
    prompt: () => { },
    $open: false,
    $setOpen: () => { },
});

const DateRangeInputDrawer = ({
    open,
    onOpenChange,
    onPush
}: {
    open: boolean
    onOpenChange: (open: boolean) => void,
    onPush?: (date: {
        startDate: dayjs.Dayjs
        endDate?: dayjs.Dayjs
    }) => void
}) => {
    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="max-w-lg mx-auto">
                    <DrawerTitle>
                        Dátum tartomány beállítása
                    </DrawerTitle>
                    <DrawerDescription>
                        Ha csak egy napra szeretnéd beállítani a dátumot, akkor nyugodtan hagyd üresen a vég dátumot.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto p-4 w-full">
                    <div className="flex flex-col gap-2 w-full">
                        <Label>
                            Kezdő dátum
                        </Label>
                        <DatePicker selected={startDate?.toDate()} onSelect={(date) => {
                            setStartDate(dayjs(date));
                        }} />
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <Label>
                            Vég dátum
                        </Label>
                        <DatePicker disabled={!startDate} selected={endDate?.toDate()} onSelect={(date) => {
                            if (!date) {
                                setEndDate(null);
                                return;
                            }
                            const d = dayjs(date);
                            if (d.isAfter(startDate, "day")) {
                                setEndDate(d);
                            }
                        }} clearable
                            dayDisableRule={(date) => {
                                return !dayjs(date).isAfter(startDate, "day");
                            }}
                        />
                    </div>
                </div>
                <DrawerFooter className="flex justify-end gap-2 flex-row max-w-md mx-auto">
                    <Button variant="outline" onClick={() => {
                        onOpenChange(false);
                        setStartDate(null);
                        setEndDate(null);
                    }}>
                        Mégse
                    </Button>
                    <Button
                        disabled={!startDate}
                        onClick={() => {
                            if (onPush && startDate) {
                                onPush({
                                    startDate,
                                    endDate: endDate ?? undefined
                                })
                                onOpenChange(false);
                                setStartDate(null);
                                setEndDate(null);
                            }
                        }}>
                        Mentés
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

const useDateRangeInputRoot = (): useDateRangeInputProps => {
    const [$open, $setOpen] = useState(false);

    const prompt = useCallback(() => {
        $setOpen(true);
    }, []);

    return {
        prompt,
        // Private
        $open,
        $setOpen,
    }
}

export const DateRangeInputProvider = ({
    children,
    onPush
}: DateRangeInputProviderProps) => {
    const value = useDateRangeInputRoot();
    return (
        <DateRangeInputContextRoot.Provider value={value}>
            <DateRangeInputDrawer open={value.$open} onOpenChange={value.$setOpen} onPush={onPush} />
            {children}
        </DateRangeInputContextRoot.Provider>
    )
}

export const useDateRangeInput = () => {
    return useContext(DateRangeInputContextRoot);
}