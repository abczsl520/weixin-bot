/**
 * Terminal QR code renderer — zero dependencies.
 * Uses Unicode block characters for compact display.
 */

const BLACK = '█';
const WHITE = ' ';
const TOP_HALF = '▀';
const BOTTOM_HALF = '▄';

/**
 * Render a QR code URL as a scannable terminal image.
 * Falls back to URL if terminal is too narrow.
 */
export function renderQR(url) {
  // Generate QR matrix using a minimal QR encoder
  const matrix = encodeQR(url);
  if (!matrix) return null;

  const size = matrix.length;
  const lines = [];

  // Use half-block characters: 2 rows per line
  for (let y = 0; y < size; y += 2) {
    let line = '';
    for (let x = 0; x < size; x++) {
      const top = matrix[y][x];
      const bottom = y + 1 < size ? matrix[y + 1][x] : false;

      if (top && bottom) line += BLACK;
      else if (top && !bottom) line += TOP_HALF;
      else if (!top && bottom) line += BOTTOM_HALF;
      else line += WHITE;
    }
    lines.push(line);
  }

  return lines.join('\n');
}

// ── Minimal QR Code encoder (Mode: byte, ECC: L, Version: auto 1-10) ──

function encodeQR(text) {
  const data = Buffer.from(text, 'utf-8');
  const version = pickVersion(data.length);
  if (!version) return null;

  const size = version * 4 + 17;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  // Place finder patterns
  placeFinder(matrix, reserved, 0, 0);
  placeFinder(matrix, reserved, size - 7, 0);
  placeFinder(matrix, reserved, 0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = matrix[i][6] = i % 2 === 0;
    reserved[6][i] = reserved[i][6] = true;
  }

  // Alignment patterns (version >= 2)
  if (version >= 2) {
    const positions = getAlignmentPositions(version);
    for (const r of positions) {
      for (const c of positions) {
        if (reserved[r]?.[c]) continue;
        placeAlignment(matrix, reserved, r, c);
      }
    }
  }

  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    reserved[8][i] = reserved[i][8] = true;
    reserved[8][size - 1 - i] = reserved[size - 1 - i][8] = true;
  }
  reserved[8][8] = true;
  matrix[size - 8][8] = true; // dark module
  reserved[size - 8][8] = true;

  // Version info (version >= 7)
  if (version >= 7) {
    const vInfo = getVersionInfo(version);
    for (let i = 0; i < 18; i++) {
      const bit = (vInfo >> i) & 1;
      const r = Math.floor(i / 3);
      const c = size - 11 + (i % 3);
      matrix[r][c] = matrix[c][r] = !!bit;
      reserved[r][c] = reserved[c][r] = true;
    }
  }

  // Encode data
  const encoded = encodeData(data, version);

  // Place data bits
  placeData(matrix, reserved, encoded, size);

  // Apply mask 0 (checkerboard) and format info
  applyMask(matrix, reserved, size, 0);
  placeFormatInfo(matrix, size, 0); // ECC L, mask 0

  // Add quiet zone (2 modules)
  const quiet = 2;
  const final = Array.from({ length: size + quiet * 2 }, () => Array(size + quiet * 2).fill(false));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      final[y + quiet][x + quiet] = matrix[y][x];
    }
  }

  return final;
}

function pickVersion(byteLen) {
  // Byte mode capacity at ECC L
  const caps = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271];
  for (let v = 1; v <= 10; v++) {
    if (byteLen <= caps[v]) return v;
  }
  return null;
}

function placeFinder(m, r, row, col) {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const y = row + dy, x = col + dx;
      if (y < 0 || x < 0 || y >= m.length || x >= m.length) continue;
      const outer = dy === -1 || dy === 7 || dx === -1 || dx === 7;
      const ring = dy === 0 || dy === 6 || dx === 0 || dx === 6;
      const inner = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
      m[y][x] = !outer && (ring || inner);
      r[y][x] = true;
    }
  }
}

function placeAlignment(m, r, centerR, centerC) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const y = centerR + dy, x = centerC + dx;
      if (y < 0 || x < 0 || y >= m.length || x >= m.length) continue;
      if (r[y][x]) continue;
      m[y][x] = Math.abs(dy) === 2 || Math.abs(dx) === 2 || (dy === 0 && dx === 0);
      r[y][x] = true;
    }
  }
}

function getAlignmentPositions(version) {
  const table = [
    [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  ];
  return table[version] || [];
}

function getVersionInfo(version) {
  const table = [0, 0, 0, 0, 0, 0, 0,
    0x07C94, 0x085BC, 0x09A99, 0x0A4D3];
  return table[version] || 0;
}

// Data encoding (byte mode, ECC level L)
function encodeData(data, version) {
  const totalCodewords = getTotalCodewords(version);
  const eccCodewords = getEccCodewords(version);
  const dataCodewords = totalCodewords - eccCodewords;

  // Mode indicator (0100 = byte) + character count
  const bits = [];
  pushBits(bits, 0b0100, 4); // byte mode
  const ccLen = version <= 9 ? 8 : 16;
  pushBits(bits, data.length, ccLen);

  for (const b of data) pushBits(bits, b, 8);

  // Terminator
  const totalBits = dataCodewords * 8;
  const termLen = Math.min(4, totalBits - bits.length);
  pushBits(bits, 0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad codewords
  const pads = [0xEC, 0x11];
  let pi = 0;
  while (bits.length < totalBits) {
    pushBits(bits, pads[pi % 2], 8);
    pi++;
  }

  // Convert to bytes
  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
    dataBytes.push(byte);
  }

  // Generate ECC
  const eccBytes = generateECC(dataBytes, eccCodewords);

  // Interleave (single block for versions 1-10 ECC L)
  const allBytes = [...dataBytes, ...eccBytes];

  // Convert to bit array
  const result = [];
  for (const b of allBytes) {
    for (let i = 7; i >= 0; i--) result.push((b >> i) & 1);
  }

  return result;
}

function pushBits(arr, value, count) {
  for (let i = count - 1; i >= 0; i--) arr.push((value >> i) & 1);
}

function getTotalCodewords(v) {
  const t = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
  return t[v] || 0;
}

function getEccCodewords(v) {
  // ECC Level L
  const t = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18];
  return t[v] || 0;
}

// Reed-Solomon ECC
function generateECC(data, eccCount) {
  const gen = rsGeneratorPoly(eccCount);
  const msg = [...data, ...Array(eccCount).fill(0)];

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j++) {
      msg[i + j] ^= gfMul(gen[j], coef);
    }
  }

  return msg.slice(data.length);
}

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11D : 0);
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const ng = Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], GF_EXP[i]);
    }
    g = ng;
  }
  return g;
}

function placeData(matrix, reserved, bits, size) {
  let bitIdx = 0;
  let upward = true;

  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5; // skip timing column

    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (c < 0 || reserved[row][c]) continue;
        if (bitIdx < bits.length) {
          matrix[row][c] = !!bits[bitIdx];
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }
}

function applyMask(matrix, reserved, size, maskNum) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (reserved[y][x]) continue;
      let flip = false;
      switch (maskNum) {
        case 0: flip = (y + x) % 2 === 0; break;
        case 1: flip = y % 2 === 0; break;
        case 2: flip = x % 3 === 0; break;
        case 3: flip = (y + x) % 3 === 0; break;
      }
      if (flip) matrix[y][x] = !matrix[y][x];
    }
  }
}

function placeFormatInfo(matrix, size, mask) {
  // ECC L = 01, mask pattern
  const formatBits = getFormatBits(0b01, mask);

  for (let i = 0; i < 15; i++) {
    const bit = !!((formatBits >> (14 - i)) & 1);

    // Around top-left finder
    if (i < 6) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Around other finders
    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }
}

function getFormatBits(ecc, mask) {
  let data = (ecc << 3) | mask;
  let bits = data << 10;
  // BCH(15,5) with generator 0x537
  for (let i = 4; i >= 0; i--) {
    if (bits & (1 << (i + 10))) bits ^= 0x537 << i;
  }
  bits = (data << 10) | bits;
  return bits ^ 0x5412; // XOR mask
}
