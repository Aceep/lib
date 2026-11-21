import yauzl from "yauzl";

export type ZipArchive = {
  readEntry(entryPath: string): Promise<Buffer | null>;
  close(): void;
};

function openZipFile(filePath: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    // lazyEntries + autoClose false: we index every entry once, then read only the few we need.
    yauzl.open(filePath, { lazyEntries: true, autoClose: false }, (error, zipFile) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(zipFile);
    });
  });
}

function indexEntries(zipFile: yauzl.ZipFile): Promise<Map<string, yauzl.Entry>> {
  return new Promise((resolve, reject) => {
    const entries = new Map<string, yauzl.Entry>();
    zipFile.on("entry", (entry: yauzl.Entry) => {
      entries.set(entry.fileName, entry);
      zipFile.readEntry();
    });
    zipFile.on("end", () => resolve(entries));
    zipFile.on("error", reject);
    zipFile.readEntry();
  });
}

function readEntryContent(zipFile: yauzl.ZipFile, entry: yauzl.Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error) {
        reject(error);
        return;
      }
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  });
}

export async function openZipArchive(filePath: string): Promise<ZipArchive> {
  const zipFile = await openZipFile(filePath);
  try {
    const entries = await indexEntries(zipFile);
    return {
      async readEntry(entryPath) {
        const entry = entries.get(entryPath);
        if (!entry) {
          return null;
        }
        return readEntryContent(zipFile, entry);
      },
      close() {
        zipFile.close();
      },
    };
  } catch (error) {
    zipFile.close();
    throw error;
  }
}
