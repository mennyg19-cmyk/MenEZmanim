import * as fs from 'fs';

export interface RichTextNode {
  type: 'paragraph' | 'text';
  content?: string;
  children?: RichTextNode[];
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface RichTextContent {
  type: 'doc';
  content: RichTextNode[];
  rawText: string;
  rawRtf: string;
}

/**
 * Strips RTF control codes and extracts plain text with basic formatting.
 * Handles: \par, \line, \'XX, \uNNNN, \b, \i, \ul, fonttbl, colortbl, \*\ groups.
 */
function stripRtfToText(rtf: string): { text: string; nodes: RichTextNode[] } {
  let s = rtf;
  const nodes: RichTextNode[] = [];
  let currentParagraph = '';
  let currentText = '';
  let bold = false;
  let italic = false;
  let underline = false;
  const formatStack: Array<{ bold: boolean; italic: boolean; underline: boolean }> = [];

  // Remove {\rtf1... header - we'll process the rest
  s = s.replace(/^\s*\{\s*\\rtf\d*\s*/i, '');

  // Remove {\fonttbl...} groups (including nested braces)
  s = s.replace(/\{\s*\\fonttbl\s*[^{]*(?:\{[^{}]*\}[^{]*)*\}/gi, '');
  // Remove {\colortbl...} groups
  s = s.replace(/\{\s*\\colortbl\s*[^{]*(?:\{[^{}]*\}[^{]*)*\}/gi, '');
  // Remove {\*\...} groups (destination groups)
  s = s.replace(/\{\s*\\\*\\[^}]*\}/g, '');
  // More aggressive: {\*\...} with nested
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\{\s*\\\*[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
  }

  // Process character by character to handle braces and escapes
  let i = 0;
  const flushText = (withFormat?: boolean) => {
    if (currentText) {
      if (withFormat && (bold || italic || underline)) {
        currentParagraph += currentText;
        // We could push a formatted node here; for simplicity we append to paragraph
      } else {
        currentParagraph += currentText;
      }
      currentText = '';
    }
  };

  const flushParagraph = () => {
    flushText();
    if (currentParagraph.trim()) {
      nodes.push({
        type: 'paragraph',
        content: currentParagraph.trim(),
      });
    }
    currentParagraph = '';
  };

  while (i < s.length) {
    const c = s[i];

    if (c === '\\') {
      flushText();
      i++;
      if (i >= s.length) break;

      // \'XX - hex character
      if (s[i] === "'" && i + 2 < s.length) {
        const hex = s.slice(i + 1, i + 3);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          currentText += String.fromCharCode(parseInt(hex, 16));
          i += 3;
          continue;
        }
      }

      // \uNNNN? - unicode (optional replacement char for non-unicode readers)
      const uMatch = s.slice(i).match(/^u(-?\d+)(\s*[0-9a-fA-F]{2})?\s*/);
      if (uMatch) {
        const code = parseInt(uMatch[1], 10);
        if (code >= 0 && code <= 0x10ffff) {
          currentText += String.fromCodePoint(code);
        } else if (code < 0) {
          currentText += String.fromCodePoint(code + 0x10000);
        }
        i += uMatch[0].length;
        continue;
      }

      // \par, \line -> newline
      if (s.slice(i).match(/^(?:par|line)\b/)) {
        flushParagraph();
        i += s.slice(i).match(/^(?:par|line)\b/)![0].length;
        continue;
      }

      // \tab
      if (s.slice(i).match(/^tab\b/)) {
        currentText += '\t';
        i += 3;
        continue;
      }

      // \b, \b0 - bold
      if (s.slice(i).match(/^b\s*(\d*)\b/)) {
        const m = s.slice(i).match(/^b\s*(\d*)\b/)!;
        bold = m[1] !== '0' && m[1] !== '';
        i += m[0].length;
        continue;
      }
      // \i, \i0 - italic
      if (s.slice(i).match(/^i\s*(\d*)\b/)) {
        const m = s.slice(i).match(/^i\s*(\d*)\b/)!;
        italic = m[1] !== '0' && m[1] !== '';
        i += m[0].length;
        continue;
      }
      // \ul, \ul0 - underline
      if (s.slice(i).match(/^ul\s*(\d*)\b/)) {
        const m = s.slice(i).match(/^ul\s*(\d*)\b/)!;
        underline = m[1] !== '0' && m[1] !== '';
        i += m[0].length;
        continue;
      }

      // Skip other control words: \keyword or \keyword123
      const ctrlMatch = s.slice(i).match(/^[a-z]+\-?\d*\s*/i);
      if (ctrlMatch) {
        i += ctrlMatch[0].length;
        continue;
      }

      // Escaped character: \{ \} \\
      if (s[i] === '{' || s[i] === '}' || s[i] === '\\') {
        currentText += s[i];
        i++;
        continue;
      }

      i++;
      continue;
    }

    if (c === '{') {
      formatStack.push({ bold, italic, underline });
      i++;
      continue;
    }

    if (c === '}') {
      const prev = formatStack.pop();
      if (prev) {
        bold = prev.bold;
        italic = prev.italic;
        underline = prev.underline;
      }
      i++;
      continue;
    }

    // Regular character
    currentText += c;
    i++;
  }

  flushParagraph();

  const text = nodes.map((n) => n.content ?? '').join('\n');
  return { text, nodes };
}

/**
 * Simpler fallback: regex-based strip when full parse isn't needed.
 */
function stripRtfSimple(rtf: string): string {
  let text = rtf;

  // Remove groups we don't need
  text = text.replace(/\{\\fonttbl[^}]*(?:\{[^{}]*\}[^}]*)*\}/gi, '');
  text = text.replace(/\{\\colortbl[^}]*(?:\{[^{}]*\}[^}]*)*\}/gi, '');
  text = text.replace(/\{\\*\\[^}]*(?:\{[^{}]*\}[^}]*)*\}/g, '');
  text = text.replace(/\{\s*\\\*[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');

  // Hex escapes
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  // Unicode escapes
  text = text.replace(/\\u(-?\d+)\s*([0-9a-fA-F]{2})?\s*/g, (_, num, _repl) => {
    const code = parseInt(num, 10);
    const c = code >= 0 ? code : code + 0x10000;
    return c >= 0 && c <= 0x10ffff ? String.fromCodePoint(c) : '';
  });

  text = text.replace(/\\par\b/g, '\n');
  text = text.replace(/\\line\b/g, '\n');
  text = text.replace(/\\tab\b/g, '\t');

  // Remove remaining control words
  text = text.replace(/\\[a-z]+\-?\d*\s*/gi, '');
  text = text.replace(/[{}]/g, '');

  return text.replace(/\s+/g, ' ').trim();
}

export function convertRtfToJson(filePath: string): RichTextContent {
  const rawRtf = fs.readFileSync(filePath, 'utf-8');
  const { text: rawText, nodes } = stripRtfToText(rawRtf);

  // If we got minimal content, try simple strip as fallback
  const plainText = rawText.trim() || stripRtfSimple(rawRtf);
  const content =
    nodes.length > 0
      ? nodes
      : plainText
          .split('\n')
          .filter((p) => p.trim())
          .map((p) => ({ type: 'paragraph' as const, content: p.trim() }));

  return {
    type: 'doc',
    content,
    rawText: plainText,
    rawRtf,
  };
}
