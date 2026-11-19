import Link from "next/link";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TeamAccounts } from "@/components/dashboard/team-accounts";
import { Icon, type IconName } from "@/components/ui/icon";
import type { Role } from "@/types/auth";

type WorkspaceItem = { title: string; description: string; icon: IconName; href?: string };

const workspaces: Record<Exclude<Role, "admin">, WorkspaceItem[]> = {
  guest: [
    { title: "Explore rooms", description: "Browse rooms and find availability for your next stay.", icon: "bed", href: "/rooms" },
    { title: "My bookings", description: "View your confirmed reservations.", icon: "calendar", href: "/guest/bookings" },
    { title: "Digital check-in", description: "Submit your arrival details before you travel.", icon: "key", href: "/guest/check-in" },
    { title: "Concierge", description: "Contact hotel staff with questions about your stay.", icon: "chat", href: "/guest/concierge" },
    { title: "Service requests", description: "Request hotel assistance and track its progress.", icon: "list", href: "/guest/services" },
    { title: "Room access", description: "View the temporary access code after check-in approval.", icon: "key", href: "/guest/access" },
  ],
  staff: [
    { title: "Reservations", description: "View guest reservations and upcoming arrivals.", icon: "calendar", href: "/staff/bookings" },
    { title: "Check-in queue", description: "Review guest check-in submissions.", icon: "key", href: "/staff/check-ins" },
    { title: "Service requests", description: "Manage and update guest service requests.", icon: "list", href: "/staff/services" },
    { title: "Concierge", description: "Respond to guest enquiries.", icon: "chat", href: "/staff/concierge" },
  ],
  manager: [
    { title: "Bookings & payments", description: "Monitor reservations and payment activity.", icon: "chart", href: "/manager/bookings" },
    { title: "Room management", description: "Manage room inventory, prices and availability.", icon: "bed" },
    { title: "Service performance", description: "Review hotel service delivery.", icon: "list" },
    { title: "Loyalty", description: "Manage loyalty rules and review completed stays.", icon: "people" },
  ],
};

function WorkspaceCards({ role }: { role: Exclude<Role, "admin"> }) {
  return <section className="workspace-section"><div><h2>Your workspace</h2><p className="muted">Features are introduced as each development milestone is completed.</p></div>
    <div className="workspace-grid">{workspaces[role].map(item => <article className="panel workspace-card" key={item.title}><span className="feature-icon"><Icon name={item.icon} width={24} height={24} /></span><h3>{item.title}</h3><p>{item.description}</p>{item.href ? <Link className="text-link" href={item.href}>Explore <Icon name="arrow" /></Link> : <span className="upcoming-label">Coming in a later milestone</span>}</article>)}</div>
  </section>;
}

export function RoleHome({ role }: { role: Role }) {
  return <RoleGuard role={role}><DashboardShell>{role === "admin" ? <TeamAccounts /> : <WorkspaceCards role={role} />}</DashboardShell></RoleGuard>;
}
