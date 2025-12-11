"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type SiteSelectProps = {
    sites: Array<{ _id: string; name: string; fullPath: string }>;
    name: string;
    value?: string;
    onChange?: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
};

export default function SiteSelect({ 
    sites, 
    name, 
    value, 
    onChange, 
    required,
    disabled 
}: SiteSelectProps) {
    return (
        <Select 
            name={name} 
            value={value} 
            onValueChange={onChange}
            required={required}
            disabled={disabled}
        >
            <SelectTrigger>
                <SelectValue placeholder="Válassz területet..." />
            </SelectTrigger>
            <SelectContent>
                {sites.map((site) => (
                    <SelectItem key={site._id} value={site._id}>
                        {site.fullPath}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}



