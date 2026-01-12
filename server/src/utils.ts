/**
 * Returns the current date in YYYY-MM-DD format based on local time.
 * This ensures that "today" means the calendar day for the user, not UTC.
 */
export function getLocalDate(): string {
    // We use 'sv-SE' (Sweden) locale because it formats as YYYY-MM-DD which is ISO-8601 compliant
    // and consistent for sorting/indexing.
    return new Date().toLocaleDateString('sv-SE');
}
