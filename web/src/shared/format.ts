const languageNames = new Intl.DisplayNames(["fr"], { type: "language" });

/** "fr" → "Français"; unknown codes are shown as-is rather than hidden. */
export function languageLabel(code: string): string {
  try {
    const name = languageNames.of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code;
  }
}

const fileSizeFormat = new Intl.NumberFormat("fr", { maximumFractionDigits: 1 });

export function fileSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${fileSizeFormat.format(bytes / 1024)} Ko`;
  }
  return `${fileSizeFormat.format(bytes / (1024 * 1024))} Mo`;
}

const dateTimeFormat = new Intl.DateTimeFormat("fr", { dateStyle: "medium", timeStyle: "short" });

export function dateTimeLabel(isoDate: string): string {
  return dateTimeFormat.format(new Date(isoDate));
}

const relativeTimeFormat = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

/** "il y a 3 min", "hier"… for a past or future instant. */
export function relativeTimeLabel(isoDate: string, now = Date.now()): string {
  const minutes = Math.round((new Date(isoDate).getTime() - now) / 60_000);
  if (Math.abs(minutes) < 1) {
    return "à l'instant";
  }
  if (Math.abs(minutes) < 60) {
    return relativeTimeFormat.format(minutes, "minute");
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return relativeTimeFormat.format(hours, "hour");
  }
  return relativeTimeFormat.format(Math.round(hours / 24), "day");
}

export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count > 1 ? plural : singular}`;
}

export function authorsLabel(authors: string[]): string {
  return authors.length > 0 ? authors.join(", ") : "Auteur inconnu";
}
