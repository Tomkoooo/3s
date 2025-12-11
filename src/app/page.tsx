import Container from "@/components/container";
import { getDashboardStats } from "./audits/actions";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { 
  CalendarIcon, 
  CheckCircle2Icon, 
  ClockIcon, 
  ListIcon, 
  TrendingUpIcon,
  BarChartIcon,
  PlusIcon,
  UsersIcon,
  MapPinIcon,
  CalendarClockIcon
} from "lucide-react";

export default async function Home() {
  const [currentUser, stats] = await Promise.all([
    getCurrentUser(),
    getDashboardStats(),
  ]);

  if (!currentUser || !stats) {
    return (
      <Container className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Irányítópult</h1>
        <p className="text-muted-foreground">Töltés...</p>
      </Container>
    );
  }


  const isAdmin = currentUser.role === 'admin';
  const isFixer = currentUser.role === 'fixer';

  return (
    <Container className="flex flex-col gap-4 md:gap-6 max-w-6xl pb-20">
      <div>
        <h1 className="text-3xl font-bold">Üdvözlünk, {currentUser.fullName}!</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Admin irányítópult' : isFixer ? 'Karbantartó (Fixer) irányítópult' : 'Auditor irányítópult'}
        </p>
      </div>

      {/* Statisztika kártyák */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Összes ellenőrzés' : 'Saját ellenőrzések'}
            </CardTitle>
            <ListIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAudits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mai ellenőrzések</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAudits}</div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Folyamatban</CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ütemezett</CardTitle>
                <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduled}</div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Befejezett</CardTitle>
                <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Következő ellenőrzés</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {stats.nextAuditDate 
                    ? new Date(stats.nextAuditDate).toLocaleDateString('hu-HU')
                    : 'Nincs'}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Teljesítmény kártya */}
      {stats.totalAudits > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              {isAdmin ? 'Rendszerteljesítmény' : 'Saját teljesítmény'}
            </CardTitle>
            <CardDescription>
              Befejezett ellenőrzések aránya
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Befejezett</span>
                <span className="text-sm text-muted-foreground">
                  {stats.completed} / {stats.totalAudits}
                </span>
              </div>
              <Progress 
                value={(stats.completed! / stats.totalAudits) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.completed! / stats.totalAudits) * 100)}% teljesítve
              </p>
            </div>
            {isAdmin && (
              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                    <p className="text-xs text-muted-foreground">Ütemezett</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                    <p className="text-xs text-muted-foreground">Folyamatban</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Befejezett</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gyors műveletek */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListIcon className="h-5 w-5" />
              Ellenőrzések
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={isAdmin ? "/admin/audits" : "/audits"}>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <ListIcon className="h-4 w-4 mr-2" />
                {isAdmin ? 'Összes ellenőrzés' : 'Saját ellenőrzések'}
              </Button>
            </Link>
            <Link href={isAdmin ? "/admin/calendar" : "/my-account/calendar"}>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Naptár nézet
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin/audits/create">
                  <Button variant="default" className="w-full justify-start" size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Új ellenőrzés
                  </Button>
                </Link>
                <Link href="/admin/audits/schedule">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <CalendarClockIcon className="h-4 w-4 mr-2" />
                    Ütemezés
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPinIcon className="h-5 w-5" />
                Területek
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/sites">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  Területek kezelése
                </Button>
              </Link>
              <Link href="/admin/sites/create">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Új terület
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersIcon className="h-5 w-5" />
              {isAdmin ? 'Felhasználók' : 'Beállítások'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isAdmin && (
              <>
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Felhasználók
                  </Button>
                </Link>
                <Link href="/admin/users/invite">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Meghívás
                  </Button>
                </Link>
              </>
            )}
            <Link href="/my-account">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <UsersIcon className="h-4 w-4 mr-2" />
                Saját fiók
              </Button>
            </Link>
            <Link href="/my-account/breaks">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Munkaszünetek
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}