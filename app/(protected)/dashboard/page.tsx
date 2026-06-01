// export default function Dashboard() {
//   return (
//     <div>dashboard works</div>
//   )
// }

"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { authApi } from "@/lib/axios/auth";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
};
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  const fetchMe = async () => {
    const user = await authApi.me();
    setUser(user);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <button className="btn btn-primary" onClick={fetchMe}>
        Chi sono?
      </button>
      {user && (
        <div className="mt-4">
          <p>
            {user.firstName} {user.lastName}
          </p>
          <p>{user.email}</p>
          <p>{user.roleName}</p>
        </div>
      )}
    </div>
  );
}
