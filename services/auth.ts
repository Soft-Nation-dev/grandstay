import { demoAccounts, demoPassword, initialAccountPolicies } from "@/data/mock";
import type { Account, AccountPolicy, Credentials, Registration, Role, TeamAccess, TeamRegistration } from "@/types/auth";

type StoredAccount = Account & { salt: string; digest: string };
type Session = { id: string; revision: string };

const accountsKey = "grandstay.demo.accounts.v1";
const policiesKey = "grandstay.demo.account-policies.v1";
const sessionKey = "grandstay.demo.session.v1";
const changeEvent = "grandstay:auth";

function storedAccounts(): StoredAccount[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(accountsKey) ?? "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function policies(): Record<string, AccountPolicy> {
  try {
    const value = JSON.parse(localStorage.getItem(policiesKey) ?? "null");
    return value && typeof value === "object" && !Array.isArray(value) ? value : initialAccountPolicies;
  } catch {
    return initialAccountPolicies;
  }
}

function publicAccount(account: Account, policy?: AccountPolicy): Account {
  const { id, name, email } = account;
  return { id, name, email, role: policy?.role ?? account.role, active: policy?.active ?? account.active ?? true };
}

function revision(id: string) {
  return policies()[id]?.revision ?? "";
}

function storedSession(): Session | null {
  const raw = sessionStorage.getItem(sessionKey);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    return session && typeof session.id === "string" && typeof session.revision === "string" ? session : null;
  } catch {
    return { id: raw, revision: "" };
  }
}

export function getAccounts(): Account[] {
  const access = policies();
  return [...demoAccounts, ...storedAccounts()].map(account => publicAccount(account, access[account.id]));
}

export function getSession(): Account | null {
  const session = storedSession();
  if (!session || session.revision !== revision(session.id)) return null;
  return getAccounts().find(account => account.id === session.id && account.active) ?? null;
}

function announce() {
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeAuth(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

function startSession(id: string) {
  const account = getAccounts().find(item => item.id === id);
  if (!account?.active) throw new Error("This account is inactive. Contact the super admin.");
  sessionStorage.setItem(sessionKey, JSON.stringify({ id, revision: revision(id) }));
  announce();
  return account;
}

export function signOut() {
  sessionStorage.removeItem(sessionKey);
  announce();
}

async function passwordDigest(password: string, salt: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function requireAdmin() {
  if (getSession()?.role !== "admin") throw new Error("Only a super admin can manage team accounts.");
}

export async function signIn({ email, password }: Credentials) {
  const normalized = normalizeEmail(email);
  const demo = demoAccounts.find(account => account.email === normalized.replace(/@grandstay\.example$/, "@guestly.example"));
  if (demo && (password === demoPassword || password === "GrandStay123!")) return startSession(demo.id);
  const account = storedAccounts().find(item => item.email === normalized);
  if (!account || await passwordDigest(password, account.salt) !== account.digest) throw new Error("Incorrect email or password.");
  return startSession(account.id);
}

async function createAccount({ name, email, password }: Registration, role: Role) {
  const normalized = normalizeEmail(email);
  if (name.trim().length < 2 || name.trim().length > 100) throw new Error("Enter a name between two and 100 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Use at least eight characters for the password.");
  if (getAccounts().some(item => item.email === normalized)) throw new Error("An account already exists with this email.");
  const salt = crypto.randomUUID();
  const digest = await passwordDigest(password, salt);
  if (role !== "guest") requireAdmin();
  const account: StoredAccount = { id: crypto.randomUUID(), name: name.trim(), email: normalized, role, active: true, salt, digest };
  const current = storedAccounts();
  if (current.some(item => item.email === normalized)) throw new Error("An account already exists with this email.");
  localStorage.setItem(accountsKey, JSON.stringify([...current, account]));
  announce();
  return publicAccount(account);
}

export async function registerGuest(input: Registration) {
  return startSession((await createAccount(input, "guest")).id);
}

export async function provisionTeamAccount(input: TeamRegistration) {
  requireAdmin();
  if (input.role !== "staff" && input.role !== "manager") throw new Error("Choose a staff or manager role.");
  return createAccount(input, input.role);
}

export function updateTeamAccess(id: string, access: TeamAccess) {
  requireAdmin();
  const account = getAccounts().find(item => item.id === id);
  if (!account || (account.role !== "staff" && account.role !== "manager")) throw new Error("Only staff and manager accounts can be modified here.");
  if ((access.role !== "staff" && access.role !== "manager") || typeof access.active !== "boolean") throw new Error("Choose valid account permissions.");
  if (account.role === access.role && account.active === access.active) return account;
  const policy: AccountPolicy = { ...access, revision: crypto.randomUUID() };
  localStorage.setItem(policiesKey, JSON.stringify({ ...policies(), [id]: policy }));
  announce();
  return publicAccount(account, policy);
}
