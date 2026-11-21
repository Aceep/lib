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

export function authorsLabel(authors: string[]): string {
  return authors.length > 0 ? authors.join(", ") : "Auteur inconnu";
}
