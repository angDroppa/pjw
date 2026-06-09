import Link from "next/link";
import NavUser from "./navuser";
import { headers } from "next/headers";
import { NAVBAR_HIDDEN_PATHS } from "@/proxy";

type NavbarProps = {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    roleName: string;
  } | null;
};

export default async function Navbar({ user }: NavbarProps) {
  // se user è null non mostrare la navbar
  //commentare e decommentare a seconda dei caso d'uso
  //se si vuole solo se autenticati decommentare
  // if (!user) return null

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // nascondi la navbar sui path definiti in NAVBAR_HIDDEN_PATHS
  if (NAVBAR_HIDDEN_PATHS.some((p) => pathname === p)) return null;

  return (
    <div className="w-full">
      <div className="fixed top-0 left-0 w-full z-50 bg-base-200 px-0 md:px-20">
        <div className="h-16 flex items-center justify-between px-4">
          <div className="flex-1">
            <Link href="/" className="text-xl font-bold">
              BikeStore
            </Link>
            
          </div>
          <div className="ml-auto">
            {user ? (
              <NavUser user={user} />
            ) : (
              <a href="/login" className="btn btn-sm btn-primary">
                Login
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="h-16 border"></div>
    </div>
  );
}
