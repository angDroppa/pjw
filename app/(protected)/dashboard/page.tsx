"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth.store";
import Modal, { ModalHandle } from "@/app/components/modal";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-6 space-y-6">
        <div>dashboard</div>
        <div>dashboard</div>
        <div>dashboard</div>
        <div>dashboard</div>
        <div>dashboard</div>
        <div>dashboard</div>
        <div>dashboard</div>
        <div>dashboard</div>


    </div>
  );
}