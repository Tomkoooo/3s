import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadCloudIcon, InfoIcon } from "lucide-react";

export default function InstallAppPage() {
    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-4xl pt-6">
            <div className="flex items-center gap-2 mb-4">
                <DownloadCloudIcon className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">Mobil alkalmazás telepítése</h1>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <InfoIcon className="w-5 h-5 text-blue-500" />
                        Mi az a PWA?
                    </CardTitle>
                    <CardDescription>Progresszív webalkalmazás telepítése</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                        A 3S Ellenőrző Rendszer egy modern webalkalmazás (PWA), amely úgy tud működni az eszközödön, mint egy letölthető natív alkalmazás. Mivel nem kell az App Store-ból vagy a Google Play áruházból letölteni, így azonnal, az alábbi egyszerű lépéseket követve hozzáadhatod a kezdőképernyődhöz, és offline módban, teljesképernyősként élvezheted a használatát.
                    </p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* iOS Telepítés */}
                <Card>
                    <CardHeader>
                        <CardTitle>🍎 Apple iOS (iPhone / iPad)</CardTitle>
                        <CardDescription>Safari böngésző használatával</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                            <li>
                                Nyisd meg a <strong>Safari</strong> böngészőt, és menj a rendszer weboldalára.
                            </li>
                            <li>
                                Koppints az alsó sávban található <strong>Megosztás</strong> (Share) ikonra.
                            </li>
                            <li>
                                Görgess le a menüben, és keresd meg a <strong>Főképernyőhöz adás</strong> (Add to Home Screen) opciót, majd koppints rá.
                            </li>
                            <li>
                                Ellenőrizd az alkalmazás nevét, majd koppints a <strong>Hozzáadás</strong> (Add) gombra a jobb felső sarokban.
                            </li>
                            <li>
                                Az alkalmazás ikonja mostantól megjelent a kezdőképernyők valamelyikén.
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                {/* Android Telepítés */}
                <Card>
                    <CardHeader>
                        <CardTitle>🤖 Android</CardTitle>
                        <CardDescription>Chrome böngésző használatával</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                            <li>
                                Nyisd meg a <strong>Chrome</strong> böngészőt, és menj a rendszer weboldalára.
                            </li>
                            <li>
                                Koppints a jobb felső sarokban található <strong>Menü</strong> ikonra (három pont).
                            </li>
                            <li>
                                A megjelenő listából válaszd a <strong>Telepítés alkalmazásként</strong> vagy <strong>Hozzáadás a kezdőképernyőhöz</strong> lehetőséget.
                            </li>
                            <li>
                                Erősítsd meg a felugró ablakban a <strong>Telepítés</strong> gomb megnyomásával.
                            </li>
                            <li>
                                Az alkalmazás ikonja hamarosan megjelenik a kezdőképernyőn vagy az alkalmazáslistában.
                            </li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
