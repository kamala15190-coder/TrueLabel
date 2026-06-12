// Ambient-Typen für Browser-APIs, die (noch) nicht in der Standard-DOM-lib sind:
//   - BarcodeDetector  (Chrome/Android nativ, sehr schnell & zuverlässig)
//   - Torch / focusMode auf MediaStreamTrack-Constraints & -Capabilities

export {};

declare global {
  type BarcodeFormatName =
    | "aztec" | "code_128" | "code_39" | "code_93" | "codabar"
    | "data_matrix" | "ean_13" | "ean_8" | "itf" | "pdf417"
    | "qr_code" | "upc_a" | "upc_e" | "unknown";

  interface DetectedBarcode {
    rawValue: string;
    format: BarcodeFormatName;
    boundingBox: DOMRectReadOnly;
    cornerPoints: ReadonlyArray<{ x: number; y: number }>;
  }

  interface BarcodeDetectorOptions {
    formats?: BarcodeFormatName[];
  }

  class BarcodeDetector {
    constructor(options?: BarcodeDetectorOptions);
    static getSupportedFormats(): Promise<BarcodeFormatName[]>;
    detect(
      source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap | Blob | ImageData
    ): Promise<DetectedBarcode[]>;
  }

  // Torch (Taschenlampe) & Autofokus werden von der Standard-lib noch nicht typisiert.
  interface MediaTrackCapabilities {
    torch?: boolean;
    focusMode?: string[];
  }
  interface MediaTrackConstraintSet {
    torch?: boolean;
    focusMode?: string;
  }
}
