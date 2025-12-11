import { Badge } from "./ui/badge";

type StatusBadgeProps = {
    status: 'scheduled' | 'in_progress' | 'completed';
};

const statusConfig = {
    scheduled: { label: 'Ütemezve', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
    in_progress: { label: 'Folyamatban', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
    completed: { label: 'Befejezett', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = statusConfig[status];
    
    return (
        <Badge variant="outline" className={config.className}>
            {config.label}
        </Badge>
    );
}



