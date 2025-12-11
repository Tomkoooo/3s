"use client";

import { useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

type AuditorSelectProps = {
    auditors: Array<{ _id: string; fullName: string; email: string }>;
    name: string;
    value?: string[];
    onChange?: (value: string[]) => void;
    min?: number;
};

export default function AuditorSelect({ 
    auditors, 
    name, 
    value = [], 
    onChange,
    min = 1 
}: AuditorSelectProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(value);

    const handleToggle = (auditorId: string) => {
        const newSelection = selectedIds.includes(auditorId)
            ? selectedIds.filter(id => id !== auditorId)
            : [...selectedIds, auditorId];
        
        setSelectedIds(newSelection);
        onChange?.(newSelection);
    };

    return (
        <div className="space-y-3">
            {auditors.map((auditor) => (
                <div key={auditor._id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`auditor-${auditor._id}`}
                        name={name}
                        value={auditor._id}
                        checked={selectedIds.includes(auditor._id)}
                        onCheckedChange={() => handleToggle(auditor._id)}
                    />
                    <Label 
                        htmlFor={`auditor-${auditor._id}`}
                        className="text-sm font-normal cursor-pointer"
                    >
                        {auditor.fullName} ({auditor.email})
                    </Label>
                </div>
            ))}
            {min > 0 && selectedIds.length < min && (
                <p className="text-sm text-red-600">
                    Legalább {min} auditor kiválasztása kötelező
                </p>
            )}
        </div>
    );
}



