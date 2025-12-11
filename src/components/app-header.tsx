"use client"

import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "./ui/breadcrumb";
import { SidebarTrigger } from "./ui/sidebar";
import { usePathname } from "next/navigation";
import Container from "@/components/container";
import { useLayoutEffect, useRef } from "react";

export const translateSegment = (segment: string) => {
    switch (segment) {
        case 'login':
            return 'Bejelentkezés';
        case 'settings':
            return 'Felhasználói beállítások';
        case 'admin':
            return 'Adminisztráció';
        case 'holidays':
            return 'Munkaszünetek';
        case 'calendar':
            return 'Naptár';
        case 'audits':
            return 'Ellenőrzések';
        case 'users':
            return 'Felhasználók';
        case 'password':
            return 'Jelszó változtatás';
        case 'create':
            return 'Létrehozás';
        case 'invite':
            return 'Meghívás';
        case 'my-account':
            return 'Fiókbeállítások';
        case 'breaks':
            return 'Szünetek';
        case 'quickstart':
            return 'Első lépések';
        default:
            return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    }
}

export default function AppHeader() {
    const pathname = usePathname()
    const pathnameSegments = pathname.split('/').filter(segment => segment !== '');

    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        // on resize, scroll to the end of the breadcrumb
        const el = ref.current;
        if (el) {
            el.scrollLeft = el.scrollWidth;
            window.addEventListener('resize', () => {
                el.scrollLeft = el.scrollWidth;
            });
            return () => {
                window.removeEventListener('resize', () => {
                    el.scrollLeft = el.scrollWidth;
                });
            }
        }
    }, [pathnameSegments.length]);

    return (
        <Container className="sticky top-0 z-10 bg-background pb-0">
            <div className="flex flex-row gap-2 items-center">
                <SidebarTrigger />
                <Breadcrumb className="overflow-x-auto invis-scroll" ref={ref}>
                    <BreadcrumbList className="flex flex-row gap-2 items-center flex-nowrap">
                        {pathnameSegments.length > 0 ? pathnameSegments.map((segment, index) => (
                            <div key={`item-${index}`} className="flex flex-row gap-2 items-center">
                                {index > 0 && <BreadcrumbSeparator />}
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={`/${pathnameSegments.slice(0, index + 1).join('/')}`}>
                                            {translateSegment(segment)}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </div>
                        )) : <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/">Irányítópult</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <hr className="mt-4" />
        </Container>
    )
}