import React from 'react';
import { analyzeMorphology } from '../utils/morphology';
import { Layers, ArrowRight, Sparkles } from 'lucide-react';

interface MorphologyAnalyzerProps {
  query: string;
  onSearchStem: (stem: string) => void;
}

export const MorphologyAnalyzer: React.FC<MorphologyAnalyzerProps> = ({ query, onSearchStem }) => {
  const analysis = analyzeMorphology(query);

  if (!analysis) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(21, 26, 36, 0.95))',
      border: '1px solid var(--border-gold)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 18px',
      margin: '12px auto 0 auto',
      maxWidth: '920px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="var(--accent-gold)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Morphological Grammar Deconstruction
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Click any constituent to search its root
        </span>
      </div>

      {/* Segmented tokens */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
        {analysis.tokens.map((token, index) => (
          <React.Fragment key={index}>
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: `1px solid ${token.color}66`,
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                cursor: token.dictionaryQuery ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onClick={() => token.dictionaryQuery && onSearchStem(token.dictionaryQuery)}
              title={token.dictionaryQuery ? `Search "${token.surface}" in dictionary` : undefined}
            >
              <span style={{ fontFamily: 'var(--font-coptic)', fontSize: '16px', fontWeight: 'bold', color: token.color }}>
                {token.surface}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                {token.label}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {token.gloss}
              </span>
            </div>

            {index < analysis.tokens.length - 1 && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px' }}>+</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Sparkles size={13} color="var(--accent-gold)" />
        <span><strong>Literal Meaning: </strong>{analysis.explanation}</span>
      </div>
    </div>
  );
};
