export interface ScreenshotOptions {
  width: number;
  height: number;
  format: 'png' | 'jpeg';
  quality: number;
}

/**
 * Placeholder for display screenshot capture.
 *
 * Actual screenshot capture requires platform-specific APIs:
 * - **Electron**: Call from the main process using `desktopCapturer` or
 *   `webContents.capturePage()` and pass the result to the renderer.
 * - **Browser**: Use `html2canvas` or similar library to capture DOM elements.
 *
 * This function returns null to indicate that screenshot capture is not
 * available in this lightweight package context.
 */
export async function captureDisplayScreenshot(
  _options: ScreenshotOptions,
): Promise<Buffer | null> {
  return null;
}
