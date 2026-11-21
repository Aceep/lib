import { writeFile } from "node:fs/promises";
import JSZip from "jszip";

export type EpubFixtureFile = {
  path: string;
  content: string | Buffer;
};

const DEFAULT_CONTAINER = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

export function opfDocument(metadata: string, manifest: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/"
         xmlns:opf="http://www.idpf.org/2007/opf" version="3.0">
  <metadata>${metadata}</metadata>
  <manifest>${manifest}</manifest>
</package>`;
}

export async function writeEpub(
  filePath: string,
  files: EpubFixtureFile[],
  options: { container?: string | null } = {},
): Promise<void> {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip");
  const container = options.container === undefined ? DEFAULT_CONTAINER : options.container;
  if (container !== null) {
    zip.file("META-INF/container.xml", container);
  }
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  await writeFile(filePath, await zip.generateAsync({ type: "nodebuffer" }));
}
