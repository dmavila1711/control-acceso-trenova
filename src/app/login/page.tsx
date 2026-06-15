import { redirectIfAuthenticated } from "@/lib/auth/session";
import { LoginForm } from "@/features/auth/login-form";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-primary">Control de Acceso Trenova</p>
        <h1 className="mt-2 text-2xl font-semibold">Acceso seguro para tu fraccionamiento</h1>
      </div>
      <LoginForm />
    </main>
  );
}
