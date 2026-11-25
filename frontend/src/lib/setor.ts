export const PRICE = 2500;
export const DAILY_LIMIT = 20;
export const MIN_WITHDRAW = 5000;
export const REF_TARGET = 20;
export const REF_BONUS = 15000;

/** Same rule as the original prototype: starts with "get", 3–27 chars, ends @gmail.com */
export const EMAIL_RULE = /^get[a-z0-9.]{3,27}@gmail\.com$/;
/** Looser rule used by the bulk checker */
export const CHECKER_RULE = /^get[^@\s]*@gmail\.com$/i;

export const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
