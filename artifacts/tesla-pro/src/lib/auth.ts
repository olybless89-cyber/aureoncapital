// Must match the localStorage key custom-fetch.ts (lib/api-client-react) reads
// on every request -- it hardcodes "tesla_token" with no per-app override.
// This file used to read/write "stocktrade_token" (left over from an earlier
// rebrand), which meant registration/login successfully stored a token that
// no subsequent API call ever actually sent -- so any authenticated page
// (e.g. /dashboard) silently behaved as if the user was logged out, with no
// error shown, just a blank screen.
export const getToken = () => typeof window !== "undefined" ? localStorage.getItem("tesla_token") : null;
export const setToken = (t: string) => typeof window !== "undefined" && localStorage.setItem("tesla_token", t);
export const clearToken = () => typeof window !== "undefined" && localStorage.removeItem("tesla_token");
