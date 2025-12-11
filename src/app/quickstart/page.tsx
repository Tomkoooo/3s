import Container from '@/components/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '@/components/RegisterForm';
import { registerAction } from './actions';

export default async function Quickstart() {
	// Auth check már a layout-ban lefutott, itt nem kell

	return (
		<Container className="flex-1 flex flex-col items-center justify-center">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Üdvözöljük!</CardTitle>
					<CardDescription>
						Kezdésnek hozzunk létre egy adminisztrátori fiókot.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<RegisterForm registerAction={registerAction} redirectTo={`/admin`} isLogin={true} />
				</CardContent>
			</Card>
		</Container>
	);
}