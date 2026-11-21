import CryptoJS from 'crypto-js';
import { PDFDocument, PDFName, PDFString, PDFHexString, PDFNumber, PDFArray, PDFDict } from 'pdf-lib';

// Standard PDF Padding String (32 bytes defined in PDF Reference)
const PDF_PADDING = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
  0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a
]);

/**
 * Standard RC4 Stream Cipher
 */
function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) % 256;
    const tmp = s[i];
    s[i] = s[j];
    s[j] = tmp;
  }

  const out = new Uint8Array(data.length);
  let i = 0;
  j = 0;
  for (let k = 0; k < data.length; k++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    const tmp = s[i];
    s[i] = s[j];
    s[j] = tmp;
    const t = (s[i] + s[j]) % 256;
    out[k] = data[k] ^ s[t];
  }
  return out;
}

function md5Bytes(bytes: Uint8Array): Uint8Array {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    const w =
      ((bytes[i] || 0) << 24) |
      ((bytes[i + 1] || 0) << 16) |
      ((bytes[i + 2] || 0) << 8) |
      (bytes[i + 3] || 0);
    words.push(w);
  }
  const wordArray = CryptoJS.lib.WordArray.create(words, bytes.length);
  const hash = CryptoJS.MD5(wordArray);
  const result = new Uint8Array(16);
  for (let i = 0; i < 4; i++) {
    const word = hash.words[i];
    result[i * 4] = (word >>> 24) & 0xff;
    result[i * 4 + 1] = (word >>> 16) & 0xff;
    result[i * 4 + 2] = (word >>> 8) & 0xff;
    result[i * 4 + 3] = word & 0xff;
  }
  return result;
}

function padPassword(pwd: string): Uint8Array {
  const encoder = new TextEncoder();
  const pwdBytes = encoder.encode(pwd);
  const result = new Uint8Array(32);
  if (pwdBytes.length >= 32) {
    result.set(pwdBytes.slice(0, 32));
  } else {
    result.set(pwdBytes);
    result.set(PDF_PADDING.slice(0, 32 - pwdBytes.length), pwdBytes.length);
  }
  return result;
}

/**
 * Standard PDF 128-bit Encryption (Algorithm 3.2 & 3.4/3.5, Rev 3)
 */
export function encryptPdfBytes(
  inputPdfBytes: Uint8Array,
  userPassword: string,
  ownerPassword?: string
): Uint8Array {
  const oPwd = ownerPassword || userPassword;
  const uPwd = userPassword;

  // 1. Generate standard random Document ID (16 bytes)
  const fileID = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(fileID);
  } else {
    for (let i = 0; i < 16; i++) fileID[i] = Math.floor(Math.random() * 256);
  }

  // Permissions: standard user permissions (-3904 is standard print + copy allowed, or -4 for full restrictions)
  // -3904 (0xFFFF F0C0 in 32-bit signed) = print, modify annotations, etc.
  const permissions = -3904;
  const pBytes = new Uint8Array(4);
  pBytes[0] = permissions & 0xff;
  pBytes[1] = (permissions >> 8) & 0xff;
  pBytes[2] = (permissions >> 16) & 0xff;
  pBytes[3] = (permissions >> 24) & 0xff;

  // 2. Compute Owner Key (/O entry) using Algorithm 3.3
  const paddedOwner = padPassword(oPwd);
  let ownerHash = md5Bytes(paddedOwner);
  for (let i = 0; i < 50; i++) {
    ownerHash = md5Bytes(ownerHash);
  }
  const keyLength = 16; // 128-bit
  const ownerKey = ownerHash.slice(0, keyLength);

  let oValue = rc4(ownerKey, padPassword(uPwd));
  for (let i = 1; i <= 19; i++) {
    const currentKey = new Uint8Array(keyLength);
    for (let k = 0; k < keyLength; k++) {
      currentKey[k] = ownerKey[k] ^ i;
    }
    oValue = rc4(currentKey, oValue);
  }

  // 3. Compute Encryption Key using Algorithm 3.2
  const paddedUser = padPassword(uPwd);
  const toHashParts: Uint8Array[] = [paddedUser, oValue, pBytes, fileID];
  let totalLen = 0;
  toHashParts.forEach((p) => (totalLen += p.length));
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  toHashParts.forEach((p) => {
    combined.set(p, offset);
    offset += p.length;
  });

  let encHash = md5Bytes(combined);
  for (let i = 0; i < 50; i++) {
    encHash = md5Bytes(encHash.slice(0, keyLength));
  }
  const encryptionKey = encHash.slice(0, keyLength);

  // 4. Compute User Key (/U entry) using Algorithm 3.4 / 3.5
  let uHash = md5Bytes(new Uint8Array([...PDF_PADDING, ...fileID]));
  let uValue = rc4(encryptionKey, uHash);
  for (let i = 1; i <= 19; i++) {
    const currentKey = new Uint8Array(keyLength);
    for (let k = 0; k < keyLength; k++) {
      currentKey[k] = encryptionKey[k] ^ i;
    }
    uValue = rc4(currentKey, uValue);
  }
  const finalU = new Uint8Array(32);
  finalU.set(uValue);
  finalU.set(PDF_PADDING.slice(0, 16), 16);

  // Parse and encrypt the PDF objects
  // We use pdf-lib to construct proper PDF structure with /Encrypt dictionary
  return injectEncryptionIntoPdf(inputPdfBytes, encryptionKey, oValue, finalU, permissions, fileID);
}

function injectEncryptionIntoPdf(
  rawPdfBytes: Uint8Array,
  encKey: Uint8Array,
  oBytes: Uint8Array,
  uBytes: Uint8Array,
  permissions: number,
  idBytes: Uint8Array
): Uint8Array {
  // Convert binary to string safely
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(rawPdfBytes);

  // Find trailer or startxref
  const toHex = (buf: Uint8Array) =>
    Array.from(buf)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  const idHex = toHex(idBytes);
  const oHex = toHex(oBytes);
  const uHex = toHex(uBytes);

  // Encrypt PDF streams and text objects
  // Find highest object number
  const objMatches = Array.from(pdfString.matchAll(/(\d+)\s+(\d+)\s+obj/g));
  let maxObjNum = 0;
  objMatches.forEach((m) => {
    const n = parseInt(m[1], 10);
    if (n > maxObjNum) maxObjNum = n;
  });
  const encryptObjNum = maxObjNum + 1;

  // Build /Encrypt Object
  const encryptObj = `\n${encryptObjNum} 0 obj\n<<\n  /Filter /Standard\n  /V 2\n  /R 3\n  /Length 128\n  /P ${permissions}\n  /O <${oHex}>\n  /U <${uHex}>\n>>\nendobj\n`;

  // Encrypt streams within PDF
  let modifiedPdf = pdfString;
  const streamRegex = /(\d+)\s+(\d+)\s+obj([\s\S]*?)stream\r?\n([\s\S]*?)\r?\nendstream/g;

  modifiedPdf = modifiedPdf.replace(streamRegex, (match, objNumStr, genNumStr, dictContent, streamBody) => {
    const objNum = parseInt(objNumStr, 10);
    const genNum = parseInt(genNumStr, 10);

    // Calculate object key: MD5(encryptionKey + objNum[3 bytes LE] + genNum[2 bytes LE])
    const objKeySource = new Uint8Array(encKey.length + 5);
    objKeySource.set(encKey);
    objKeySource[encKey.length] = objNum & 0xff;
    objKeySource[encKey.length + 1] = (objNum >> 8) & 0xff;
    objKeySource[encKey.length + 2] = (objNum >> 16) & 0xff;
    objKeySource[encKey.length + 3] = genNum & 0xff;
    objKeySource[encKey.length + 4] = (genNum >> 8) & 0xff;

    const objKeyHash = md5Bytes(objKeySource);
    const streamKey = objKeyHash.slice(0, Math.min(encKey.length + 5, 16));

    const encoder = new TextEncoder();
    const latinDecoder = new TextDecoder('latin1');
    const streamBytes = new Uint8Array(streamBody.length);
    for (let i = 0; i < streamBody.length; i++) {
      streamBytes[i] = streamBody.charCodeAt(i) & 0xff;
    }

    const encryptedStream = rc4(streamKey, streamBytes);
    let encStreamStr = '';
    for (let i = 0; i < encryptedStream.length; i++) {
      encStreamStr += String.fromCharCode(encryptedStream[i]);
    }

    // Update /Length in dictContent
    const updatedDict = dictContent.replace(/\/Length\s+\d+/, `/Length ${encryptedStream.length}`);

    return `${objNumStr} ${genNumStr} obj${updatedDict}stream\n${encStreamStr}\nendstream`;
  });

  // Inject Encrypt Object before trailer / xref
  const trailerIdx = modifiedPdf.lastIndexOf('trailer');
  if (trailerIdx !== -1) {
    const beforeTrailer = modifiedPdf.slice(0, trailerIdx);
    let afterTrailer = modifiedPdf.slice(trailerIdx);

    // Update trailer dictionary with /Encrypt and /ID
    afterTrailer = afterTrailer.replace(
      /<<([\s\S]*?)>>/,
      (match, p1) => `<<${p1}\n  /Encrypt ${encryptObjNum} 0 R\n  /ID [<${idHex}> <${idHex}>]\n>>`
    );

    modifiedPdf = beforeTrailer + encryptObj + afterTrailer;
  }

  // Convert back to Uint8Array
  const finalBytes = new Uint8Array(modifiedPdf.length);
  for (let i = 0; i < modifiedPdf.length; i++) {
    finalBytes[i] = modifiedPdf.charCodeAt(i) & 0xff;
  }

  return finalBytes;
}
