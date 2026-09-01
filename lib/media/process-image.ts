import "server-only";

import sharp from "sharp";

/**
 * Re-encodes an uploaded image so nothing but the picture survives.
 *
 * A photo straight off a phone carries EXIF: the camera, the timestamp, and
 * very often the GPS coordinates where it was taken. Storing the original file
 * would mean a stranger sending a kind message could also, without realising,
 * hand over their home address. Echoes strips it.
 *
 * Sharp drops all metadata unless explicitly asked to keep it, so decoding and
 * re-encoding removes EXIF, IPTC and XMP in one step. `rotate()` is called
 * first so the EXIF orientation flag is baked into the pixels before it is
 * discarded, otherwise portrait photos would come out sideways.
 *
 * Re-encoding also caps the dimensions, which keeps storage and the recipient's
 * data bill sane.
 */

const MAX_EDGE = 2048;

export type ProcessedImage = {
  buffer: Buffer;
  contentType: string;
  extension: string;
  width: number | null;
  height: number | null;
};

export async function processImage(input: ArrayBuffer): Promise<ProcessedImage | null> {
  try {
    const source = Buffer.from(input);
    const probe = sharp(source, { animated: true });
    const meta = await probe.metadata();

    // Animated GIFs stay GIFs, or they would lose their animation.
    const isAnimatedGif = meta.format === "gif" && (meta.pages ?? 1) > 1;
    // PNG keeps its alpha channel; everything else becomes JPEG.
    const target = isAnimatedGif ? "gif" : meta.hasAlpha || meta.format === "png" ? "png" : "jpeg";

    let pipeline = sharp(source, { animated: isAnimatedGif })
      // Bake in EXIF orientation before the metadata is dropped.
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      });

    if (target === "gif") pipeline = pipeline.gif();
    else if (target === "png") pipeline = pipeline.png({ compressionLevel: 9 });
    else pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      contentType: target === "gif" ? "image/gif" : target === "png" ? "image/png" : "image/jpeg",
      extension: target === "gif" ? "gif" : target === "png" ? "png" : "jpg",
      width: info.width ?? null,
      height: info.height ?? null,
    };
  } catch (error) {
    // An image we cannot decode is an image we cannot strip. Refuse it rather
    // than storing the original with its metadata intact.
    console.error("[media] image processing failed", error);
    return null;
  }
}
