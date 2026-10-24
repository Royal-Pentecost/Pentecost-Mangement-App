import { Member } from "./data";

/**
 * How the app addresses a member.
 *
 * The church's rule, in order of precedence:
 *
 * 1. **An office outranks everything.** An elder is "Elder Akomeah" whatever
 *    their age, because that is how the congregation addresses them.
 * 2. **An adult gets an honorific** — "Mr" or "Mrs" with their surname, from 23.
 * 3. **Everyone else gets their first name.**
 *
 * The fallbacks matter as much as the rule. Two members have no sex recorded
 * and two hundred have no birth date, so anything that cannot be established is
 * left out rather than guessed: being called by your first name is ordinary,
 * being called "Mr" when you are a fourteen-year-old girl is not.
 */

/** Age at which the honorific applies. */
const ADULT_FROM = 23;

/** Offices the congregation uses in place of Mr or Mrs. */
const OFFICE_TITLES = ["Presiding Elder", "Elder", "Deaconess", "Deacon"];

export function ageFrom(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  // Not yet had this year's birthday.
  const monthDiff = now.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age -= 1;

  return age >= 0 && age < 130 ? age : null;
}

export function surnameOf(fullName: string): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? "";
}

export function firstNameOf(fullName: string): string {
  return (fullName ?? "").trim().split(/\s+/).filter(Boolean)[0] ?? "";
}

/** Normalises the free-text title the office typed into a known rank. */
function officeTitle(title: string | undefined): string | null {
  const t = (title ?? "").trim().toLowerCase();
  if (!t) return null;
  // Longest first, so "Presiding Elder" is not matched as "Elder".
  return OFFICE_TITLES.find((o) => t.includes(o.toLowerCase())) ?? null;
}

export interface Addressable {
  name: string;
  /** "M" | "F", or empty when the roll does not record it. */
  sex?: string;
  dateOfBirth?: string | null;
  /** The office they hold, if any — "Elder", "Deaconess", and so on. */
  churchTitle?: string;
}

/**
 * The name to greet this member by.
 *
 * Returns a first name when nothing more respectful can be established, which
 * is the safe direction to fail in.
 */
export function addressOf(person: Addressable): string {
  const office = officeTitle(person.churchTitle);
  if (office) return `${office} ${surnameOf(person.name)}`;

  const age = ageFrom(person.dateOfBirth);
  const sex = (person.sex ?? "").trim().toUpperCase();

  if (age !== null && age >= ADULT_FROM && (sex === "M" || sex === "F")) {
    return `${sex === "M" ? "Mr" : "Mrs"} ${surnameOf(person.name)}`;
  }

  return firstNameOf(person.name);
}

/** Convenience for the app's own `Member` shape. */
export function addressOfMember(m: Member | null | undefined): string {
  if (!m) return "";
  return addressOf({
    name: m.name,
    sex: m.sex,
    dateOfBirth: m.dateOfBirth,
    churchTitle: m.churchTitle,
  });
}
