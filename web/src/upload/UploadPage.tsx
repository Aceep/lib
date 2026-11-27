import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { cancelUpload, confirmUpload, fetchMySubmissions, stageUpload, submitUpload, updateUpload } from "../api/client.js";
import type { UploadDoubt, UploadDuplicate, UploadPreview, UploadResult, UploadSubmission, User } from "../api/types.js";
import { authorsLabel, dateTimeLabel, fileSizeLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { useDebouncedValue } from "../shared/use-debounced-value.js";
import { KyleSays } from "../shared/KyleSays.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

type PreviewItem = { step: "preview"; preview: UploadPreview; busy: boolean; error: string | null };

type UploadStep =
  | { step: "uploading" }
  | PreviewItem
  | { step: "added"; title: string; result: UploadResult }
  | { step: "submitted"; title: string }
  | { step: "cancelled" }
  | { step: "error"; message: string };

type UploadItem = { key: number; fileName: string } & UploadStep;

const DUPLICATE_LABELS: Record<UploadDuplicate["reason"], string> = {
  identical: "fichier strictement identique",
  "same-book": "même titre et mêmes auteurs",
  "same-path": "un fichier porte déjà ce nom",
};

// "duplicate" has its own warning, with the books it duplicates.
const DOUBT_LABELS: Record<Exclude<UploadDoubt, "duplicate">, string> = {
  "no-title": "le fichier n'a pas de vrai titre",
  "no-author": "le fichier n'indique pas d'auteur",
  swapped: "le titre et l'auteur semblent inversés",
  "author-field": "le nom d'auteur est mal formé (ordre, majuscules ou plusieurs personnes dans un seul champ)",
};

const METADATA_DEBOUNCE_MS = 500;

export function DuplicateWarning({ duplicates }: { duplicates: UploadDuplicate[] }) {
  if (duplicates.length === 0) {
    return null;
  }
  return (
    <div className="upload-warning" role="alert">
      <strong>Je connais déjà celui-là :</strong>
      <ul>
        {duplicates.map((duplicate) => (
          <li key={duplicate.bookId}>
            <Link to={`/books/${duplicate.bookId}`}>{duplicate.title}</Link>
            {duplicate.authors.length > 0 ? ` — ${duplicate.authors.join(", ")}` : null}{" "}
            <span className="upload-reason">({DUPLICATE_LABELS[duplicate.reason]})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type MetadataDraft = { title: string; authors: string[] };

function sameDraft(left: MetadataDraft, right: MetadataDraft): boolean {
  return left.title === right.title && left.authors.length === right.authors.length && left.authors.every((author, index) => author === right.authors[index]);
}

/** Title and authors can be corrected; the destination and the duplicates follow after a short pause in typing. */
export function MetadataForm({ preview, disabled, onChange }: { preview: UploadPreview; disabled: boolean; onChange: (draft: MetadataDraft) => void }) {
  const [draft, setDraft] = useState<MetadataDraft>({ title: preview.title, authors: preview.authors.length > 0 ? preview.authors : [""] });
  const debouncedDraft = useDebouncedValue(draft, METADATA_DEBOUNCE_MS);

  useEffect(() => {
    const cleaned = { title: debouncedDraft.title.trim(), authors: debouncedDraft.authors.map((author) => author.trim()).filter(Boolean) };
    if (cleaned.title !== "" && !sameDraft(cleaned, { title: preview.title, authors: preview.authors })) {
      onChange(cleaned);
    }
    // Only a settled edit should trigger a request, not every change of the server-side preview.
  }, [debouncedDraft]);

  function setAuthor(index: number, value: string) {
    setDraft((current) => ({ ...current, authors: current.authors.map((author, position) => (position === index ? value : author)) }));
  }

  return (
    <div className="upload-form">
      <label className="filter">
        Titre
        <input type="text" value={draft.title} disabled={disabled} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
      </label>
      {draft.authors.map((author, index) => (
        <label className="filter" key={index}>
          {index === 0 ? "Auteur" : `Auteur ${index + 1}`}
          <span className="upload-author-row">
            <input type="text" value={author} disabled={disabled} onChange={(event) => setAuthor(index, event.target.value)} />
            {draft.authors.length > 1 ? (
              <button
                type="button"
                aria-label={`Retirer l'auteur ${index + 1}`}
                disabled={disabled}
                onClick={() => setDraft({ ...draft, authors: draft.authors.filter((_, position) => position !== index) })}
              >
                ×
              </button>
            ) : null}
          </span>
        </label>
      ))}
      <button type="button" className="link-button" disabled={disabled} onClick={() => setDraft({ ...draft, authors: [...draft.authors, ""] })}>
        + un auteur
      </button>
    </div>
  );
}

function PreviewCard({
  item,
  needsReview,
  onMetadataChange,
  onConfirm,
  onCancel,
}: {
  item: PreviewItem;
  /** Members submit for an admin to validate; admins add directly. */
  needsReview: boolean;
  onMetadataChange: (draft: MetadataDraft) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { preview } = item;
  const hasDuplicates = preview.duplicates.length > 0;
  const confirmLabel = needsReview
    ? hasDuplicates
      ? "Soumettre quand même"
      : "Soumettre pour validation"
    : hasDuplicates
      ? "Ajouter quand même"
      : "Confirmer l'ajout";
  return (
    <>
      <MetadataForm preview={preview} disabled={item.busy} onChange={onMetadataChange} />
      <dl className="upload-facts">
        <dt>Sera rangé sous</dt>
        <dd>
          <code>{preview.targetPath}</code>
        </dd>
        <dt>Taille</dt>
        <dd>{fileSizeLabel(preview.fileSize)}</dd>
      </dl>
      <DuplicateWarning duplicates={preview.duplicates} />
      <DoubtWarning doubts={preview.doubts} />
      <div className="upload-actions">
        <button type="button" className={hasDuplicates ? "button" : "button primary"} onClick={onConfirm} disabled={item.busy}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={item.busy}>
          Annuler
        </button>
      </div>
      {item.error ? (
        <p className="error" role="alert">
          {item.error}
        </p>
      ) : null}
    </>
  );
}

function DoubtWarning({ doubts }: { doubts: UploadDoubt[] }) {
  const reasons = doubts.flatMap((doubt) => (doubt === "duplicate" ? [] : [DOUBT_LABELS[doubt]]));
  if (reasons.length === 0) {
    return null;
  }
  return (
    <div className="upload-warning" role="alert">
      <strong>À vérifier avant l'ajout :</strong>
      <ul>
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}

function ItemStatus({ item }: { item: UploadItem }) {
  switch (item.step) {
    case "uploading":
      return <p className="upload-status">Envoi et lecture des métadonnées…</p>;
    case "added":
      return (
        <p className="upload-status upload-success" role="status">
          Ajouté : <Link to={`/books/${item.result.bookId}`}>{item.title}</Link> → <code>{item.result.filePath}</code>
        </p>
      );
    case "submitted":
      return (
        <p className="upload-status upload-success" role="status">
          « {item.title} » est envoyé. Il sera ajouté à la bibliothèque après validation par un administrateur.
        </p>
      );
    case "cancelled":
      return <p className="upload-status">Annulé, rien n'a été ajouté.</p>;
    case "error":
      return (
        <p className="error" role="alert">
          {item.message}
        </p>
      );
    default:
      return null;
  }
}

const SUBMISSION_STATUS_LABELS: Record<UploadSubmission["status"], string> = {
  pending: "En attente de validation",
  approved: "Ajouté",
  rejected: "Refusé",
};

function MySubmissions({ submissions }: { submissions: UploadSubmission[] }) {
  if (submissions.length === 0) {
    return null;
  }
  return (
    <section className="admin-section">
      <h2>Mes envois</h2>
      <ul className="record-list">
        {submissions.map((submission) => (
          <li key={submission.id}>
            <span className="record-main">
              {submission.bookId !== null ? <Link to={`/books/${submission.bookId}`}>{submission.title}</Link> : submission.title}
              <span className="record-secondary"> — {authorsLabel(submission.authors)}</span>
            </span>
            <span className={`status-tag is-${submission.status}`}>{SUBMISSION_STATUS_LABELS[submission.status]}</span>
            <span className="record-secondary">
              envoyé le {dateTimeLabel(submission.submittedAt)}
              {submission.reason ? ` · motif : ${submission.reason}` : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Each file is previewed (destination, possible duplicates) first. Admins then add it; members send it for review. */
export function UploadPage({ user, onLibraryChanged }: { user: User; onLibraryChanged: () => void }) {
  useDocumentTitle("Ajouter des livres");
  const needsReview = user.role !== "admin";
  const submissions = useAsync((signal) => (needsReview ? fetchMySubmissions(signal) : Promise.resolve([])), [needsReview]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const nextKey = useRef(0);

  function replaceItem(key: number, next: UploadStep) {
    setItems((current) => current.map((item) => (item.key === key ? { key, fileName: item.fileName, ...next } : item)));
  }

  function patchPreview(key: number, patch: (item: PreviewItem) => PreviewItem) {
    setItems((current) => current.map((item) => (item.key === key && item.step === "preview" ? { ...item, ...patch(item) } : item)));
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void handleFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    // Folders and non-EPUB files are left out quietly; the server would reject them anyway.
    void handleFiles(Array.from(event.dataTransfer.files).filter((file) => /\.epub$/i.test(file.name)));
  }

  async function handleFiles(files: File[]) {
    for (const file of files) {
      const key = nextKey.current++;
      setItems((current) => [...current, { key, fileName: file.name, step: "uploading" }]);
      try {
        const preview = await stageUpload(file);
        const item: PreviewItem = { step: "preview", preview, busy: false, error: null };
        replaceItem(key, item);
        // Nothing to check on this one: it goes in (or off to review) without waiting for a click.
        if (preview.doubts.length === 0) {
          await handleConfirm(key, item);
        }
      } catch (error) {
        replaceItem(key, { step: "error", message: (error as Error).message });
      }
    }
  }

  async function handleMetadataChange(key: number, uploadId: string, draft: MetadataDraft) {
    patchPreview(key, (item) => ({ ...item, busy: true, error: null }));
    try {
      const preview = await updateUpload(uploadId, draft);
      patchPreview(key, (item) => ({ ...item, preview, busy: false }));
    } catch (error) {
      patchPreview(key, (item) => ({ ...item, busy: false, error: (error as Error).message }));
    }
  }

  async function handleConfirm(key: number, item: PreviewItem) {
    replaceItem(key, { ...item, busy: true, error: null });
    try {
      if (needsReview) {
        await submitUpload(item.preview.id);
        replaceItem(key, { step: "submitted", title: item.preview.title });
        submissions.reload();
        return;
      }
      const result = await confirmUpload(item.preview.id);
      replaceItem(key, { step: "added", title: item.preview.title, result });
      onLibraryChanged();
    } catch (error) {
      // On a remote failure the server keeps the staged file, so confirming again is possible.
      replaceItem(key, { ...item, busy: false, error: (error as Error).message });
    }
  }

  async function handleCancel(key: number, item: PreviewItem) {
    replaceItem(key, { ...item, busy: true });
    try {
      await cancelUpload(item.preview.id);
    } finally {
      replaceItem(key, { step: "cancelled" });
    }
  }

  return (
    <main className="page upload-page">
      <header className="page-header">
        <h1>Ajouter des livres</h1>
        <p className="page-subtitle">
          Chaque EPUB est renommé d'après ses métadonnées (corrigeables si elles sont fausses), rangé dans <code>Books/Lettre/Auteur/</code> et
          envoyé sur MEGA. {needsReview
            ? "Un fichier dont la fiche ne pose aucun doute part directement en validation ; un administrateur valide chaque envoi avant qu'il n'entre dans la bibliothèque."
            : "Un fichier dont la fiche ne pose aucun doute est ajouté directement ; les autres attendent votre confirmation."}
        </p>
      </header>
      <div
        className={`upload-drop${isDragging ? " is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <KyleSays pose="carry">
          <strong>Glisse tes EPUB ici,</strong> je m'occupe du rangement.
        </KyleSays>
        <span className="upload-drop-or">ou</span>
        <label className="button primary upload-choose">
          <input type="file" accept=".epub,application/epub+zip" multiple onChange={handleInput} />
          Choisir des fichiers
        </label>
      </div>
      <ul className="upload-list">
        {items.map((item) => (
          <li key={item.key} className={`upload-item is-${item.step}`}>
            <h2 className="upload-file-name">{item.fileName}</h2>
            {item.step === "preview" ? (
              <PreviewCard
                item={item}
                needsReview={needsReview}
                onMetadataChange={(draft) => void handleMetadataChange(item.key, item.preview.id, draft)}
                onConfirm={() => void handleConfirm(item.key, item)}
                onCancel={() => void handleCancel(item.key, item)}
              />
            ) : (
              <ItemStatus item={item} />
            )}
          </li>
        ))}
      </ul>
      <MySubmissions submissions={submissions.data ?? []} />
    </main>
  );
}
