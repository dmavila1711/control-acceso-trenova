export type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
};

export type ServerEnv = PublicEnv & {
  supabaseServiceRoleKey: string;
  qrSecret: string;
  numericCodeSecret: string;
};

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta configurar la variable de entorno ${name}`);
  }

  return value;
}

// Importante: las variables NEXT_PUBLIC_* deben leerse con acceso literal
// (process.env.NEXT_PUBLIC_X). Next.js solo reemplaza estas referencias en el
// bundle del cliente cuando la clave es un literal, no con acceso dinamico.
export function getPublicEnv(): PublicEnv {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    appUrl: process.env.APP_URL ?? "http://localhost:3000"
  };
}

export function getServerEnv(): ServerEnv {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    qrSecret: required("QR_SECRET", process.env.QR_SECRET),
    numericCodeSecret: required("NUMERIC_CODE_SECRET", process.env.NUMERIC_CODE_SECRET)
  };
}
