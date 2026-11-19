export type Role = "guest" | "staff" | "manager" | "admin";

export type Account = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Credentials = {
  email: string;
  password: string;
};

export type Registration = Credentials & {
  name: string;
};

export type TeamRegistration = Registration & {
  role: "staff" | "manager";
};

export const roleLabels: Record<Role, string> = {
  guest: "Guest",
  staff: "Staff",
  manager: "Manager",
  admin: "Super admin",
};

export const roleRoutes: Record<Role, string> = {
  guest: "/guest",
  staff: "/staff",
  manager: "/manager",
  admin: "/admin",
};
