import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import User from "@/lib/db/models/User";
import BulkBreakForm from "./BulkBreakForm";

export default async function AdminBulkBreaksPage() {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  const users = await User.find({}, "fullName email").lean().exec();
  const serializedUsers = users.map((u: any) => ({
    _id: u._id.toString(),
    fullName: u.fullName,
    email: u.email,
  }));

  return (
    <Container className="flex-1 flex flex-col gap-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Tömeges szünet rögzítése</h1>
        <p className="text-sm text-muted-foreground">
          Válaszd ki a felhasználókat, majd add meg a dátumtartományt (pl. Húsvét).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Szünet adatai</CardTitle>
          <CardDescription>
            A rendszer létrehozza a szünetet minden kiválasztott felhasználónak, és megpróbálja feloldani az audit
            ütközéseket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkBreakForm users={serializedUsers} />
        </CardContent>
      </Card>
    </Container>
  );
}

