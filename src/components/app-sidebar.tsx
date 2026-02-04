"use client";
import Link from "next/link"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { AvatarFallback, Avatar } from "./ui/avatar"
import {
    CalendarIcon,
    ClipboardListIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    VolleyballIcon,
    UsersIcon,
    FactoryIcon,
    SendIcon,
    UserIcon,
    CalendarClockIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth"
import { redirect } from "next/navigation"
import { Skeleton } from "./ui/skeleton"
import { getInitials, getRoleTranslation } from "@/lib/utils"
import { useCallback } from "react";

export const MenuItem = ({ href, icon, label, onClick }: { href: string, icon: React.ReactNode, label: string, onClick?: () => void }) => {
    return (
        <SidebarMenuItem>
            <Link href={href} onClick={onClick} className="flex rounded-md bg-muted flex-row items-center gap-2 px-2 py-1.5 md:py-1 hover:tracking-wider transition-all duration-300">
                {icon}
                {label}
            </Link>
        </SidebarMenuItem>
    )
}

export function AppSidebar() {
    const { user, isLoading } = useAuth();
    const {
        setOpenMobile
    } = useSidebar()

    const linkClick = useCallback(() => {
        setOpenMobile(false);
    }, [setOpenMobile]);

    return (
        <Sidebar className="max-w-full">
            <SidebarHeader className="p-4 flex flex-row items-center gap-2">
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium truncate leading-none">General-Plastics Kft</span>
                    <span className="text-xs text-muted-foreground truncate">3S Ellenörző Rendszer</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Általános
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <MenuItem href="/" icon={<LayoutDashboardIcon className="w-4 h-4" />} label="Irányítópult" onClick={linkClick} />
                            <MenuItem href="/audits" icon={<ClipboardListIcon className="w-4 h-4" />} label="Ellenőrzések" onClick={linkClick} />
                            <MenuItem href="/my-account/calendar" icon={<CalendarIcon className="w-4 h-4" />} label="Naptár" onClick={linkClick} />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Beállítások
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <MenuItem href="/my-account/breaks" icon={<VolleyballIcon className="w-4 h-4" />} label="Munkaszünet" onClick={linkClick} />
                            <MenuItem href="/my-account" icon={<UserIcon className="w-4 h-4" />} label="Fiókbeállítások" onClick={linkClick} />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {
                    user?.role === "admin" && (
                        <SidebarGroup>
                            <SidebarGroupLabel>
                                Adminisztráció
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <MenuItem href="/admin/calendar" icon={<CalendarIcon className="w-4 h-4" />} label="Globális naptár" onClick={linkClick} />
                                    <MenuItem href="/admin/audits" icon={<ClipboardListIcon className="w-4 h-4" />} label="Ellenőrzések kezelése" onClick={linkClick} />
                                    <MenuItem href="/admin/audits/schedule" icon={<CalendarClockIcon className="w-4 h-4" />} label="Ellenőrzés Ütemezése" onClick={linkClick} />
                                    <MenuItem href="/admin/users" icon={<UsersIcon className="w-4 h-4" />} label="Felhasználók kezelése" onClick={linkClick} />
                                    <MenuItem href="/admin/users/invite" icon={<SendIcon className="w-4 h-4" />} label="Meghívók kezelése" onClick={linkClick} />
                                    <MenuItem href="/admin/breaks" icon={<VolleyballIcon className="w-4 h-4" />} label="Munkaszünetek kezelése" onClick={linkClick} />
                                    <MenuItem href="/admin/sites" icon={<FactoryIcon className="w-4 h-4" />} label="Területek kezelése" onClick={linkClick} />
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )
                }
            </SidebarContent>
            <SidebarFooter>
                {isLoading ? (
                    <div className="flex flex-row justify-between items-center w-full h-9">
                        <div className="flex flex-row gap-2 items-center w-full h-full">
                            <Skeleton className="w-9 aspect-square bg-zinc-400 rounded-full" />
                            <div className="flex flex-col gap-2 w-full">
                                <Skeleton className="w-38 h-2 bg-zinc-400" />
                                <Skeleton className="w-16 h-2 bg-zinc-400" />
                            </div>
                        </div>
                    </div>
                ) : user ? (
                    <div className="flex flex-row justify-between items-center">
                        <div className="flex flex-row gap-2 items-center">
                            <Avatar>
                                <AvatarFallback className="bg-primary text-primary-foreground lowercase">
                                    {user.fullName ? getInitials(user.fullName, 2) : user.email.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5 text-sm">
                                <span className="font-medium truncate leading-none">{user.fullName || user.email}</span>
                                <span className="text-xs text-muted-foreground truncate">{getRoleTranslation(user.role)}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => {
                            linkClick();
                            window.dispatchEvent(new Event('auth-anticipate'));
                            fetch('/logout', {
                                method: 'GET',
                                credentials: 'include',
                            }).then(() => {
                                window.dispatchEvent(new Event('auth-change'));
                                redirect('/login');
                            });
                        }}>
                            <LogOutIcon className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <Button asChild>
                        <Link href="/login" onClick={linkClick}>Bejelentkezés</Link>
                    </Button>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}