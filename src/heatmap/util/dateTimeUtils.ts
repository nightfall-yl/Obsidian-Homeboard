export function isLuxonDateTime(value: unknown): boolean {
    if (value == null || value == undefined) {
        return false;
    }
    if (
        typeof value === "object" &&
        value !== null &&
        "isLuxonDateTime" in value &&
        (value as Record<string, unknown>).isLuxonDateTime === true
    ) {
        return true;
    }
    return false;
}
