import Link from "next/link";

export default function Home() {
  return (
    <div>
      home funziona
      <Link href="/login" className="btn btn-sm btn-primary">
        Login
      </Link>
    </div>
  );
}
