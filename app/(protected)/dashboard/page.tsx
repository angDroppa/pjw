"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth.store";
import Modal, { ModalHandle } from "@/app/components/modal";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const modalRef = useRef<ModalHandle>(null);

  //   useEffect(() => {
  //     permitApi
  //       .getAll()
  //       .then(setPermits)
  //       .catch(() => router.push("/login"));
  //   }, [router]);

  const stateLabel = (state: boolean | null) => {
    if (state === null)
      return <span className="badge badge-warning">In attesa</span>;
    if (state === true)
      return <span className="badge badge-success">Approvato</span>;
    return <span className="badge badge-error">Rifiutato</span>;
  };

  return (<div className="p-6 space-y-6">dashvora works</div>);
}
