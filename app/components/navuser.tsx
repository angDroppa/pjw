"use client"

type NavUserProps = {
  user: {
    firstName: string
    lastName: string
    email: string
    roleName: string
  }
}

export default function NavUser({ user }: NavUserProps) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
        {user.firstName} {user.lastName}
        <span className="badge badge-sm badge-primary ml-1">{user.roleName}</span>
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow">
        <li className="menu-title text-xs opacity-50">{user.email}</li>
        <li><button onClick={handleLogout}>Logout</button></li>
      </ul>
    </div>
  )
}