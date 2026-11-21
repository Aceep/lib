import { type ChangeEvent, useRef, useState } from "react";
import { Link } from "react-router";
import { cancelUpload, confirmUpload, stageUpload } from "../api/client.js";
import type { UploadDuplicate, UploadPreview, UploadResult } from "../api/types.js";
import { fileSizeLabel } from "../shared/format.js";

type PreviewItem = { step: "preview"; preview: UploadPreview; busy: boolean; error: string | null };

type UploadStep =
  | { step: "uploading" }
  | PreviewItem
  | { step: "added"; title: string; result: UploadResult }
  | { step: "cancelled" }
  | { step: "error"; message: string };

type UploadItem = { key: number; fileName: string } & UploadStep;

const DUPLICATE_LABELS: Record<UploadDuplicate["reason"], string> = {
  identical: "fichier strictement identique",
  "same-book": "même titre et mêmes auteurs",
  "same-path": "un fichier porte déjà ce nom",
};

function DuplicateWarning({ duplicates }: { duplicates: UploadDuplicate[] }) {
  if (duplicates.length === 0) {
    return null;
  }
  return (
    <div className="upload-warning" role="alert">
      <strong>Ce livre semble déjà dans la bibliothèque :</strong>
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

function PreviewCard({ item, onConfirm, onCancel }: { item: PreviewItem; onConfirm: () => void; onCancel: () => void }) {
  const { preview } = item;
  const hasDuplicates = preview.duplicates.length > 0;
  return (
    <>
      <dl className="upload-facts">
        <dt>Titre</dt>
        <dd>{preview.title}</dd>
        <dt>Auteur{preview.authors.length > 1 ? "s" : ""}</dt>
        <dd>{preview.authors.length > 0 ? preview.authors.join(", ") : "inconnu"}</dd>
        <dt>Sera rangé sous</dt>
        <dd>
          <code>{preview.targetPath}</code>
        </dd>
        <dt>Taille</dt>
        <dd>{fileSizeLabel(preview.fileSize)}</dd>
      </dl>
      <DuplicateWarning duplicates={preview.duplicates} />
      <div className="upload-actions">
        <button type="button" className={hasDuplicates ? "button" : "button primary"} onClick={onConfirm} disabled={item.busy}>
          {hasDuplicates ? "Ajouter quand même" : "Confirmer l'ajout"}
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

/** Lets either of us add EPUBs: each file is previewed (destination, possible duplicates) and confirmed one by one. */
export function UploadPage({ onLibraryChanged }: { onLibraryChanged: () => void }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const nextKey = useRef(0);

  function replaceItem(key: number, next: UploadStep) {
    setItems((current) => current.map((item) => (item.key === key ? { key, fileName: item.fileName, ...next } : item)));
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    for (const file of files) {
      const key = nextKey.current++;
      setItems((current) => [...current, { key, fileName: file.name, step: "uploading" }]);
      try {
        const preview = await stageUpload(file);
        replaceItem(key, { step: "preview", preview, busy: false, error: null });
      } catch (error) {
        replaceItem(key, { step: "error", message: (error as Error).message });
      }
    }
  }

  async function handleConfirm(key: number, item: PreviewItem) {
    replaceItem(key, { ...item, busy: true, error: null });
    try {
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
    <main className="upload-page">
      <Link to="/" className="back-link">
        ← Retour au catalogue
      </Link>
      <h1>Ajouter des livres</h1>
      <p className="upload-help">
        Chaque EPUB est renommé d'après ses métadonnées, rangé dans <code>Books/Lettre/Auteur/</code> et envoyé sur MEGA. Rien n'est
        ajouté avant confirmation.
      </p>
      <label className="button primary upload-choose">
        <input type="file" accept=".epub,application/epub+zip" multiple onChange={(event) => void handleFiles(event)} />
        Choisir des fichiers EPUB
      </label>
      <ul className="upload-list">
        {items.map((item) => (
          <li key={item.key} className={`upload-item is-${item.step}`}>
            <h2 className="upload-file-name">{item.fileName}</h2>
            {item.step === "preview" ? (
              <PreviewCard item={item} onConfirm={() => void handleConfirm(item.key, item)} onCancel={() => void handleCancel(item.key, item)} />
            ) : (
              <ItemStatus item={item} />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
