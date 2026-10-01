import zlib from 'zlib';

/**
 * Lightweight, zero-dependency PDF and document text extractor.
 * Extracts text from PDF binary buffers (decoding FlateDecode streams and Tj/TJ text operators)
 * as well as plain text and markdown documents.
 */

function decodePdfString(str: string): string {
  // Handle octal escapes like \040 -> ' '
  let res = str.replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
  // Handle standard escape sequences
  res = res
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
  return res;
}

function decodeHexString(hex: string): string {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  if (cleanHex.length === 0) return '';
  const bytes = new Uint8Array(Math.floor(cleanHex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  // Check for UTF-16BE BOM (FE FF)
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let out = '';
    for (let i = 2; i < bytes.length; i += 2) {
      if (i + 1 < bytes.length) {
        out += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
      }
    }
    return out;
  }
  // If bytes look like utf-16 with zero bytes alternating
  if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[2] === 0x00) {
    let out = '';
    for (let i = 2; i < bytes.length; i += 2) {
      out += String.fromCharCode(bytes[i + 1]);
    }
    return out;
  }
  // ASCII / Latin1 fallback
  return String.fromCharCode(...bytes);
}

/**
 * Extracts readable text from a decompressed PDF content stream
 */
function extractTextFromStream(content: string): string {
  const lines: string[] = [];
  // PDF operators are not required to be separated by source newlines. The
  // old line-based parser therefore merged adjacent visual lines whenever a
  // `Td`/`Tm` appeared after a Tj on the same stream line. Walk operators in
  // document order instead and use text-position operators as hard breaks.
  for (const blockMatch of content.matchAll(/BT\b([\s\S]*?)ET\b/g)) {
    let currentLine = '';
    const block = blockMatch[1];
    const operatorPattern =
      /(\[(?:[\s\S]*?)\])\s*TJ\b|(\((?:[^\\()]|\\.)*\)|<[0-9a-fA-F\s]+>)\s*Tj\b|(\((?:[^\\()]|\\.)*\)|<[0-9a-fA-F\s]+>)\s*'\s*|(?:-?[\d.]+\s+){1,6}-?[\d.]+\s+(T\*|Td|TD|Tm)\b/g;

    const appendText = (raw: string) => {
      const value = raw.startsWith('(')
        ? decodePdfString(raw.slice(1, -1))
        : decodeHexString(raw.slice(1, -1));
      currentLine += value;
    };

    for (const match of block.matchAll(operatorPattern)) {
      if (match[4]) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = '';
        continue;
      }
      if (match[1]) {
        const items = match[1].slice(1, -1).matchAll(/\((?:[^\\()]|\\.)*\)|<[0-9a-fA-F\s]+>/g);
        for (const item of items) appendText(item[0]);
      } else if (match[2]) {
        appendText(match[2]);
      } else if (match[3]) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = '';
        appendText(match[3]);
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
  }

  return lines.join('\n');
}

/**
 * Extracts plain text from a raw PDF buffer
 */
export function extractTextFromPdfBuffer(buffer: Buffer): string {
  const extractedPieces: string[] = [];

  // 1. Locate all stream objects
  const pdfString = buffer.toString('latin1');
  const streamRegex = /<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)endstream/g;

  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(pdfString)) !== null) {
    const dict = match[1];
    const streamStart = match.index + match[0].indexOf('stream') + 6;
    // Skip optional \r\n or \n
    let actualStart = streamStart;
    if (pdfString[actualStart] === '\r') actualStart++;
    if (pdfString[actualStart] === '\n') actualStart++;

    const endPos = match.index + match[0].lastIndexOf('endstream');
    if (endPos <= actualStart) continue;

    const rawStreamBuffer = buffer.subarray(actualStart, endPos);
    const isFlate = /\/FlateDecode\b/i.test(dict);

    let decodedString = '';
    if (isFlate) {
      try {
        const decompressed = zlib.inflateSync(rawStreamBuffer);
        decodedString = decompressed.toString('latin1');
      } catch {
        try {
          const decompressed = zlib.inflateRawSync(rawStreamBuffer);
          decodedString = decompressed.toString('latin1');
        } catch {
          // Skip corrupt or unsupported stream
        }
      }
    } else {
      decodedString = rawStreamBuffer.toString('latin1');
    }

    if (decodedString && /BT\b/i.test(decodedString)) {
      const text = extractTextFromStream(decodedString);
      if (text.trim()) {
        extractedPieces.push(text);
      }
    }
  }

  // 2. Fallback if streams were encrypted or non-standard: extract all text between parentheses in BT/ET or plain chunks
  if (extractedPieces.length === 0) {
    const directMatches = pdfString.matchAll(/\(([^\\()]{3,})\)\s*Tj/g);
    const directLines: string[] = [];
    for (const m of directMatches) {
      const decoded = decodePdfString(m[1]).trim();
      if (decoded.length > 2 && /[a-zA-Z0-9]/.test(decoded)) {
        directLines.push(decoded);
      }
    }
    if (directLines.length > 0) {
      extractedPieces.push(directLines.join('\n'));
    }
  }

  return extractedPieces.join('\n\n').trim();
}

/**
 * Extracts plain text from an uploaded document payload
 */
export function extractTextFromDocument(doc: { base64: string; mimeType: string; name: string }): string {
  if (!doc || !doc.base64) return '';

  const buffer = Buffer.from(doc.base64, 'base64');
  const name = (doc.name || '').toLowerCase();
  const mime = (doc.mimeType || '').toLowerCase();

  if (mime.includes('text') || name.endsWith('.txt') || name.endsWith('.md')) {
    return buffer.toString('utf-8').trim();
  }

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    try {
      const pdfText = extractTextFromPdfBuffer(buffer);
      if (pdfText && pdfText.length > 20) {
        return pdfText;
      }
    } catch (err) {
      console.warn('PDF extraction encountered an issue:', err);
    }
  }

  // Fallback utf-8 attempt if ASCII text is embedded
  try {
    const rawUtf8 = buffer.toString('utf-8');
    if (/[\w\s]{20,}/.test(rawUtf8) && !rawUtf8.includes('\u0000')) {
      return rawUtf8.trim();
    }
  } catch {
    // Ignore
  }

  return '';
}
