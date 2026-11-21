import { useState } from "react";
import { confirmUpload, fetchSubmittedUploads, rejectUpload, updateUpload } from "../api/client.js";
import type { UploadPreview } from "../api/types.js";
import { dateTimeLabel, fileSizeLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { useDocumentTitle } from "../shared/use-document-title.js";
import { DuplicateWarning, MetadataForm, type MetadataDraft } from "../upload/UploadPage.js";

function SubmittedUpload({ upload, onDecided }: { upload: UploadPreview; onDecided: (message: string) => void }) {
  const [preview, setPreview] = useState(upload);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setIsBusy(false);
    }
  }

  function handleMetadataChange(draft: MetadataDraft) {
    void run(async () => {
      setPreview(await updateUpload(preview.id, draft));
      setIsBusy(false);
    });
  }

  function handleApprove() {
    void run(async () => {
      await confirmUpload(preview.id);
      onDecided(`« ${preview.title} » est ajouté à la bibliothèque.`);
    });
  }

  function handleReject() {
    const reason = window.prompt(`Refuser « ${preview.title} » ? Motif affiché à ${preview.uploadedBy} (facultatif) :`);
    // Cancelling the prompt gives null: the upload stays in the queue.
    if (reason !== null) {
      void run(async () => {
        await rejectUpload(preview.id, reason.trim());
        onDecided(`« ${preview.title} » est refusé, le fichier est supprimé.`);
      });
    }
  }

  const hasDuplicates = preview.duplicates.length > 0;
  return (
    <li className="upload-item">
      <h2 className="upload-file-name">{preview.originalName}</h2>
      <p className="upload-status">
        Envoyé par <strong>{preview.uploadedBy}</strong>
        {preview.submittedAt ? ` le ${dateTimeLabel(preview.submittedAt)}` : null}
      </p>
      <MetadataForm preview={preview} disabled={isBusy} onChange={handleMetadataChange} />
      <dl className="upload-facts">
        <dt>Sera rangé sous</dt>
        <dd>
          <code>{preview.targetPath}</code>
        </dd>
        <dt>Taille</dt>
        <dd>{fileSizeLabel(preview.fileSize)}</dd>
      </dl>
      <DuplicateWarning duplicates={preview.duplicates} />
      <div className="upload-actions">
        <button type="button" className={hasDuplicates ? "button" : "button primary"} onClick={handleApprove} disabled={isBusy}>
          {hasDuplicates ? "Ajouter quand même" : "Valider et ajouter"}
        </button>
        <button type="button" onClick={handleReject} disabled={isBusy}>
          Refuser
        </button>
      </div>
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </li>
  );
}

export function ReviewUploadsPage({ onDecided }: { onDecided: () => void }) {
  useDocumentTitle("Envois à valider");
  const uploads = useAsync((signal) => fetchSubmittedUploads(signal), []);
  const [message, setMessage] = useState<string | null>(null);

  function handleDecided(text: string) {
    setMessage(text);
    uploads.reload();
    onDecided();
  }

  return (
    <>
      <header className="page-header">
        <h1>Envois à valider</h1>
        <p className="page-subtitle">Les livres envoyés par les membres attendent ici. Rien n'entre dans la bibliothèque sans validation.</p>
      </header>
      {uploads.status === "error" ? (
        <p className="error" role="alert">
          Impossible de charger les envois : {uploads.error.message}
        </p>
      ) : null}
      {message ? (
        <p className="form-success" role="status">
          {message}
        </p>
      ) : null}
      {uploads.data && uploads.data.length === 0 ? <p className="empty-state">Aucun envoi en attente.</p> : null}
      <ul className="upload-list">
        {(uploads.data ?? []).map((upload) => (
          <SubmittedUpload key={upload.id} upload={upload} onDecided={handleDecided} />
        ))}
      </ul>
    </>
  );
}
