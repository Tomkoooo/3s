import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DvhVarSetter from "@/components/dvhVarSetter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import AppHeader from "@/components/app-header";
import { Toaster } from "@/components/ui/sonner"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { OfflineIndicator } from "@/components/offline-indicator"
import { redirect } from "next/navigation";
import { getCurrentUser, adminExists } from "@/lib/auth";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "3SGP - General Plastics Kft. 3S Ellenőrzó Rendszer",
  description: "General Plastics Kft. 3S Ellenőrzó Rendszer - Break Management System",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "3SGP",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "3SGP",
    title: "3SGP - General Plastics Kft. 3S Ellenőrzó Rendszer",
    description: "General Plastics Kft. 3S Ellenőrzó Rendszer - Break Management System",
  },
  twitter: {
    card: "summary",
    title: "3SGP - General Plastics Kft. 3S Ellenőrzó Rendszer",
    description: "General Plastics Kft. 3S Ellenőrzó Rendszer - Break Management System",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

async function checkAuth(pathname: string) {
  // Public routes - skip auth
  const publicRoutes = ['/quickstart', '/login', '/invite'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return { needsAuth: false, redirectTo: null };
  }

  try {
    // Check if admin exists (cached)
    const hasAdmin = await adminExists();
    if (!hasAdmin) {
      return { needsAuth: false, redirectTo: '/quickstart' };
    }

    // If on quickstart but admin exists, redirect
    if (pathname === '/quickstart') {
      return { needsAuth: false, redirectTo: '/' };
    }

    // Check if user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { needsAuth: true, redirectTo: '/login' };
    }

    return { needsAuth: false, redirectTo: null };
  } catch (error) {
    console.error('Auth check error:', error);
    return { needsAuth: true, redirectTo: '/login' };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const url = headersList.get('x-url') || '';
  
  // Extract pathname from full URL
  let pathname = '/';
  try {
    const parsedUrl = new URL(url);
    pathname = parsedUrl.pathname;
  } catch {
    // If URL parsing fails, default to /
    pathname = '/';
  }
  
  // Run auth check once in layout
  const authResult = await checkAuth(pathname);
  if (authResult.redirectTo) {
    redirect(authResult.redirectTo);
  }

  return (<>
    <html lang="hu">
      <head>
        <meta name="application-name" content="3SGP" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="3SGP" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <DvhVarSetter />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased smart-min-dvh flex flex-col`}
      >
        <SidebarProvider className="w-full max-w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              <AppHeader />
              <main className="flex-1 pb-4">
                {children}
              </main>
            </div>
          </SidebarInset>
          <Toaster position="bottom-right" />
          <PWAInstallPrompt />
          <OfflineIndicator />
        </SidebarProvider>
      </body>
    </html>
  </>);
}
