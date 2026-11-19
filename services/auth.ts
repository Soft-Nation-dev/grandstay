import { demoAccounts, demoPassword } from "@/data/mock";
import type { Account, Credentials, Registration, Role, TeamRegistration } from "@/types/auth";

type StoredAccount = Account & { salt: string; digest: string };

const accountsKey = "grandstay.demo.accounts.v1";
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

function publicAccount(account: Account): Account {
  const { id, name, email, role } = account;
  return { id, name, email, role };
}

export function getAccounts(): Account[] {
  return [...demoAccounts, ...storedAccounts()].map(publicAccount);
}

export function getSession(): Account | null {
  const id = sessionStorage.getItem(sessionKey);
  return getAccounts().find((account) => account.id === id) ?? null;
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

function startSession(account: Account) {
  sessionStorage.setItem(sessionKey, account.id);
  announce();
  return publicAccount(account);
}

export function signOut() {
  sessionStorage.removeItem(sessionKey);
  announce();
}

async function passwordDigest(password: string, salt: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function signIn({ email, password }: Credentials) {
  const normalized = normalizeEmail(email);
  const demo = demoAccounts.find((account) => account.email === normalized);
  if (demo && password === demoPassword) return startSession(demo);
  const account = storedAccounts().find((item) => item.email === normalized);
  if (!account || await passwordDigest(password, account.salt) !== account.digest) throw new Error("Incorrect email or password.");
  return startSession(account);
}

async function createAccount({ name, email, password }: Registration, role: Role) {
  const normalized = normalizeEmail(email);
  if (name.trim().length < 2) throw new Error("Enter a name with at least two characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Use at least eight characters for the demo password.");
  if (getAccounts().some((item) => item.email === normalized)) throw new Error("An account already exists with this email.");
  const salt = crypto.randomUUID();
  const digest = await passwordDigest(password, salt);
  const account: StoredAccount = { id: crypto.randomUUID(), name: name.trim(), email: normalized, role, salt, digest };
  const current = storedAccounts();
  if (current.some((item) => item.email === normalized)) throw new Error("An account already exists with this email.");
  localStorage.setItem(accountsKey, JSON.stringify([...current, account]));
  announce();
  return publicAccount(account);
}

export async function registerGuest(input: Registration) {
  return startSession(await createAccount(input, "guest"));
}

export async function provisionTeamAccount(input: TeamRegistration) {
  if (getSession()?.role !== "admin") throw new Error("Only a super admin can create team accounts.");
  if (input.role !== "staff" && input.role !== "manager") throw new Error("Choose a staff or manager role.");
  return createAccount(input, input.role);
}
