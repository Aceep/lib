import { toSortKey } from "../db/sort-key.js";

/**
 * EPUB subjects are whatever the publisher or Calibre put there: "SF", "Science-Fiction", "FICTION / Science
 * Fiction / Général", "Policier/Thriller", "lu", "Lang:fr"… This maps them onto a short list of shelves and drops
 * the rest, so a genre filter stays readable. Unknown subjects are ignored on purpose: a shelf of one book helps
 * nobody.
 */

export const GENRES = [
  "Littérature",
  "Policier & thriller",
  "Science-fiction",
  "Fantasy",
  "Fantastique",
  "Horreur",
  "Romance",
  "Jeunesse",
  "Histoire",
  "Biographie & témoignage",
  "Essai",
  "Nouvelles",
  "Poésie",
  "Théâtre",
  "BD & manga",
  "Humour",
  "Classiques",
] as const;

export type Genre = (typeof GENRES)[number];

// Keys are sort keys (lower case, no accents) of one subject segment.
const SYNONYMS: Record<string, Genre> = {
  "science fiction": "Science-fiction",
  "science-fiction": "Science-fiction",
  sf: "Science-fiction",
  "sci-fi": "Science-fiction",
  scifi: "Science-fiction",
  anticipation: "Science-fiction",
  "post-apocalyptique": "Science-fiction",
  "post apocalyptique": "Science-fiction",
  dystopie: "Science-fiction",
  "space opera": "Science-fiction",
  "roman science fiction": "Science-fiction",
  fantasy: "Fantasy",
  "heroic fantasy": "Fantasy",
  "dark fantasy": "Fantasy",
  "urban fantasy": "Fantasy",
  fantastique: "Fantastique",
  paranormal: "Fantastique",
  horreur: "Horreur",
  horror: "Horreur",
  epouvante: "Horreur",
  policier: "Policier & thriller",
  policiers: "Policier & thriller",
  polar: "Policier & thriller",
  polars: "Policier & thriller",
  "roman policier": "Policier & thriller",
  "romans policiers": "Policier & thriller",
  thriller: "Policier & thriller",
  thrillers: "Policier & thriller",
  "policier thriller": "Policier & thriller",
  crime: "Policier & thriller",
  mystery: "Policier & thriller",
  suspense: "Policier & thriller",
  detective: "Policier & thriller",
  espionnage: "Policier & thriller",
  noir: "Policier & thriller",
  romance: "Romance",
  "romance contemporaine": "Romance",
  "new adult": "Romance",
  "roman d'amour": "Romance",
  jeunesse: "Jeunesse",
  "young adult": "Jeunesse",
  ya: "Jeunesse",
  enfants: "Jeunesse",
  ado: "Jeunesse",
  historique: "Histoire",
  "roman historique": "Histoire",
  histoire: "Histoire",
  history: "Histoire",
  biographie: "Biographie & témoignage",
  biographies: "Biographie & témoignage",
  biography: "Biographie & témoignage",
  autobiographie: "Biographie & témoignage",
  memoires: "Biographie & témoignage",
  temoignage: "Biographie & témoignage",
  "document et temoignage": "Biographie & témoignage",
  recit: "Biographie & témoignage",
  essai: "Essai",
  essais: "Essai",
  essay: "Essai",
  essays: "Essai",
  philosophie: "Essai",
  philosophy: "Essai",
  psychologie: "Essai",
  psychology: "Essai",
  sociologie: "Essai",
  "social science": "Essai",
  politique: "Essai",
  "developpement personnel": "Essai",
  "self-help": "Essai",
  spiritualite: "Essai",
  nouvelles: "Nouvelles",
  nouvelle: "Nouvelles",
  "short stories": "Nouvelles",
  "literary collections": "Nouvelles",
  poesie: "Poésie",
  poetry: "Poésie",
  theatre: "Théâtre",
  drama: "Théâtre",
  bd: "BD & manga",
  "bande dessinee": "BD & manga",
  "bandes dessinees": "BD & manga",
  comics: "BD & manga",
  manga: "BD & manga",
  "graphic novel": "BD & manga",
  humour: "Humour",
  humor: "Humour",
  classics: "Classiques",
  classique: "Classiques",
  classiques: "Classiques",
  litterature: "Littérature",
  literature: "Littérature",
  literary: "Littérature",
  roman: "Littérature",
  romans: "Littérature",
  novel: "Littérature",
  fiction: "Littérature",
  "roman contemporain": "Littérature",
  "litterature contemporaine": "Littérature",
  "litterature generale": "Littérature",
  "general fiction": "Littérature",
  "literary fiction": "Littérature",
};

// "Littérature française", "littérature étrangère", "Littérature Japonaise"… all land on the same shelf.
const LITERATURE_PATTERN = /^(litterature|literature|fiction|roman|romans)( [a-z-]+){1,2}$/;
// Segments that only qualify another one ("Général" in "FICTION / Science Fiction / Général").
const NOISE = new Set(["general", "generale", "generales", "divers", "autres", "other", "lang:fr", "lu", "nouveaux"]);

function segmentsOf(subject: string): string[] {
  return subject
    .replace(/­/g, "") // soft hyphens inside "Thril­ler"
    .split(/\s*(?:\/|;|--|&|\||,)\s*/)
    .map((segment) => toSortKey(segment).replace(/\s+/g, " "))
    .filter((segment) => segment !== "" && !NOISE.has(segment));
}

export function genreOfSubject(subject: string): Genre[] {
  const genres: Genre[] = [];
  for (const segment of segmentsOf(subject)) {
    const genre = SYNONYMS[segment] ?? (LITERATURE_PATTERN.test(segment) ? "Littérature" : null);
    if (genre && !genres.includes(genre)) {
      genres.push(genre);
    }
  }
  return genres;
}

/** The shelves a book belongs to, in a stable order, from its raw subjects. */
export function normalizeGenres(subjects: string[]): Genre[] {
  const found = new Set<Genre>();
  for (const subject of subjects) {
    for (const genre of genreOfSubject(subject)) {
      found.add(genre);
    }
  }
  // "Littérature" is the catch-all: it only stays when nothing more specific was found.
  if (found.size > 1) {
    found.delete("Littérature");
  }
  return GENRES.filter((genre) => found.has(genre));
}
