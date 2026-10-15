/** The API takes at most this many images per batch upload request. */
export const MAX_BATCH_FILES = 20;
/** And at most this many ids per batch delete request. */
export const MAX_BATCH_DELETE = 100;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface UploadFailure {
  filename: string;
  message: string;
}

/** Turns one batch response into failures that name the file, using the position in the request when the API has no name. */
export function uploadFailures(files: { name: string }[], failed: { index: number; filename: string; message: string }[]): UploadFailure[] {
  return failed.map((f) => ({ filename: f.filename || files[f.index]?.name || "An image", message: f.message }));
}

/** One line for a toast: "3 images uploaded" or "2 of 5 images uploaded". */
export function uploadSummary(done: number, total: number): string {
  const noun = total === 1 ? "image" : "images";
  return done === total ? `${done} ${noun} uploaded` : `${done} of ${total} ${noun} uploaded`;
}

export function deleteSummary(deleted: number, total: number): string {
  const noun = total === 1 ? "image" : "images";
  return deleted === total ? `${deleted} ${noun} deleted` : `${deleted} of ${total} ${noun} deleted`;
}
