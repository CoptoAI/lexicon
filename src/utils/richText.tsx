import React from 'react';

/**
 * Strips HTML tags and # markdown markers for compact text-only preview
 */
export function stripHtmlAndTags(text?: string): string {
  if (!text) return '';
  return text
    .replace(/<span style="color:darkred">(.*?)<\/span>/gi, '$1')
    .replace(/<span style="color:grey">(.*?)<\/span>/gi, '$1')
    .replace(/<[^>]*>?/gm, '')
    .replace(/#/g, '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

interface RichEtymologyProps {
  etym: string;
  onSearchWord?: (word: string) => void;
}

/**
 * Renders etymology and cross-reference strings with safe rich formatting:
 * - Styles Greek loanword labels (cf. Gr.) with custom badges
 * - Styles Greek headwords with proper serif typography
 * - Formats glosses and LSJ/Preisigke citations
 * - Turns #coptic_word# into interactive clickable links
 */
export const RichEtymology: React.FC<RichEtymologyProps> = ({ etym, onSearchWord }) => {
  if (!etym) return null;

  // 1. Split by # for Coptic cross-reference links
  const hashSegments = etym.split('#');

  return (
    <span className="rich-etymology">
      {hashSegments.map((segment, segIdx) => {
        // Odd index means it was inside #...#
        if (segIdx % 2 === 1) {
          const word = segment.trim();
          return (
            <span
              key={segIdx}
              className="etym-coptic-link"
              onClick={() => onSearchWord?.(word)}
              title={`Search related word "${word}" in CoptoLex`}
            >
              {word}
            </span>
          );
        }

        // Even index: could contain HTML markup like <span style="color:darkred">cf. Gr.</span>
        return <EtymHtmlSegment key={segIdx} html={segment} />;
      })}
    </span>
  );
};

/**
 * Parses and formats an HTML-bearing substring without unsafe dangerouslySetInnerHTML
 */
const EtymHtmlSegment: React.FC<{ html: string }> = ({ html }) => {
  if (!html) return null;

  // Clean common HTML entities
  let clean = html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  // Tokenize by HTML tags: <span ...>...</span>, <i>...</i>
  const tagRegex = /(<span style="[^"]*">.*?<\/span>|<i>.*?<\/i>|<span[^>]*>.*?<\/span>)/gi;
  const parts = clean.split(tagRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // 1. Match <span style="color:darkred">cf. Gr.</span>
        if (/color:\s*darkred/i.test(part)) {
          const content = part.replace(/<[^>]*>/g, '').trim();
          return (
            <span key={i} className="etym-badge-origin">
              {content}
            </span>
          );
        }

        // 2. Match <span style="color:grey">citation/pos</span>
        if (/color:\s*grey/i.test(part)) {
          const content = part.replace(/<[^>]*>/g, '').trim();
          return (
            <span key={i} className="etym-badge-ref">
              {content}
            </span>
          );
        }

        // 3. Match <i>definition</i>
        if (/^<i>.*<\/i>$/i.test(part)) {
          const content = part.replace(/<[^>]*>/g, '').trim();
          return (
            <span key={i} className="etym-italic-gloss">
              “{content}”
            </span>
          );
        }

        // 4. Regular text (Greek lemma or citation text)
        // Detect if text contains Greek characters
        if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(part)) {
          return (
            <span key={i} className="etym-greek-text">
              {part}
            </span>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
};
