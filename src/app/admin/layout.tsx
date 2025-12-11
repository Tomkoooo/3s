import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect('/login');
    }

    if (currentUser.role !== 'admin') {
        notFound();
    }

    return (
        <>
            {children}
        </>
    )
}