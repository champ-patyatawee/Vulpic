/**
 * Apply CSS filter string to ImageData pixel by pixel.
 * Supports: brightness, contrast, saturate, sepia, grayscale, hue-rotate.
 */
export function applyFilter(imageData: ImageData, filterCss: string): ImageData {
  if (!filterCss) return imageData;

  const data = new Uint8ClampedArray(imageData.data);
  const w = imageData.width;
  const h = imageData.height;

  // Parse filter string into operations
  const ops = parseFilters(filterCss);

  // Process each pixel
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const a = data[i + 3];

      for (const op of ops) {
        switch (op.name) {
          case "brightness": {
            const v = op.args[0] ?? 1;
            r *= v; g *= v; b *= v;
            break;
          }
          case "contrast": {
            const v = op.args[0] ?? 1;
            r = (r - 128) * v + 128;
            g = (g - 128) * v + 128;
            b = (b - 128) * v + 128;
            break;
          }
          case "saturate": {
            const v = op.args[0] ?? 1;
            const lumR = 0.2126, lumG = 0.7152, lumB = 0.0722;
            const gray = r * lumR + g * lumG + b * lumB;
            r = gray + (r - gray) * v;
            g = gray + (g - gray) * v;
            b = gray + (b - gray) * v;
            break;
          }
          case "sepia": {
            const v = clamp(op.args[0] ?? 1, 0, 1);
            const sr = r * (1 - v * 0.607) + g * 0.769 * v + b * 0.189 * v;
            const sg = r * 0.349 * v + g * (1 - v * 0.314) + b * 0.168 * v;
            const sb = r * 0.272 * v + g * 0.534 * v + b * (1 - v * 0.869);
            r = sr; g = sg; b = sb;
            break;
          }
          case "grayscale": {
            const v = clamp(op.args[0] ?? 1, 0, 1);
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            r = r + (gray - r) * v;
            g = g + (gray - g) * v;
            b = b + (gray - b) * v;
            break;
          }
          case "hue-rotate": {
            const deg = op.args[0] ?? 0;
            const rad = (deg * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            // Rotation matrix
            const m00 = 0.213 + cos * 0.787 - sin * 0.213;
            const m01 = 0.715 - cos * 0.715 - sin * 0.715;
            const m02 = 0.072 - cos * 0.072 + sin * 0.928;
            const m10 = 0.213 - cos * 0.213 + sin * 0.143;
            const m11 = 0.715 + cos * 0.285 + sin * 0.140;
            const m12 = 0.072 - cos * 0.072 - sin * 0.283;
            const m20 = 0.213 - cos * 0.213 - sin * 0.787;
            const m21 = 0.715 - cos * 0.715 + sin * 0.715;
            const m22 = 0.072 + cos * 0.928 + sin * 0.072;
            const hr = r * m00 + g * m01 + b * m02;
            const hg = r * m10 + g * m11 + b * m12;
            const hb = r * m20 + g * m21 + b * m22;
            r = hr; g = hg; b = hb;
            break;
          }
        }
      }

      data[i]     = clamp(r, 0, 255);
      data[i + 1] = clamp(g, 0, 255);
      data[i + 2] = clamp(b, 0, 255);
      data[i + 3] = a;
    }
  }

  return new ImageData(data, w, h);
}

interface FilterOp {
  name: string;
  args: number[];
}

function parseFilters(css: string): FilterOp[] {
  const ops: FilterOp[] = [];
  const re = /(\w+)\s*\(([^)]*)\)/g;
  let match;
  while ((match = re.exec(css)) !== null) {
    const name = match[1].toLowerCase();
    const args = match[2]
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((s) => {
        // Handle deg, px, etc by stripping non-numeric
        const num = parseFloat(s);
        // hue-rotate uses degrees; convert to numeric
        if (s.includes("deg")) return num;
        return isNaN(num) ? 0 : num;
      });
    ops.push({ name, args });
  }
  return ops;
}

function clamp(v: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, v)));
}
