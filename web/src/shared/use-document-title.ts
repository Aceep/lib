import { useEffect } from "react";

const APP_NAME = "Kyle Lib";

/** Browser tab and history entries read "Dune · Kyle Lib" rather than all the same name. */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
