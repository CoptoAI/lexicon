import React from 'react';
import { X, Info, ExternalLink, ShieldCheck, Award, Globe, Sparkles } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={26} color="var(--accent-gold)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>About CoptoLex (Copto.org)</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.6' }}>
          <p>
            <strong>CoptoLex</strong> (<a href="https://lexicon.copto.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)' }}>lexicon.copto.org</a>) is an open-access lexical database and digital research platform for the Coptic language, developed and maintained by <strong>Copto.org</strong>. Powered by modern edge infrastructure on Cloudflare Pages and D1 SQLite with real-time FTS5 trigram search and AI-ready linguistic indexing.
          </p>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '16px', marginBottom: '8px' }}>Lexicon Sources &amp; Foundations</h3>
            <p>
              CoptoLex integrates foundational academic lexical resources:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li>
                <strong>BBAW Lexicon of Coptic Egyptian</strong> (<em>Strukturen und Transformationen des Wortschatzes der ägyptischen Sprache</em> at the Berlin-Brandenburg Academy of Sciences and Humanities).
              </li>
              <li>
                <strong>DDGLC Lexicon of Greek Loanwords in Coptic</strong> (<em>Database and Dictionary of Greek Loanwords in Coptic</em> at Freie Universität Berlin).
              </li>
              <li>
                <strong>Thesaurus Linguae Aegyptiae (TLA)</strong>: 2,311 Ancient Egyptian and Demotic roots mapped to Gardiner hieroglyphic classifications.
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '16px', marginBottom: '8px' }}>Institutional Partners &amp; Contributing Projects</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <a href="https://copto.org" target="_blank" rel="noopener noreferrer" className="btn-nav" style={{ justifyContent: 'space-between', borderColor: 'var(--border-gold)' }}>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>Copto.org Initiative</span>
                <ExternalLink size={14} />
              </a>
              <a href="https://copticscriptorium.org" target="_blank" rel="noopener noreferrer" className="btn-nav" style={{ justifyContent: 'space-between' }}>
                <span>Coptic Scriptorium</span>
                <ExternalLink size={14} />
              </a>
              <a href="https://thesaurus-linguae-aegyptiae.de" target="_blank" rel="noopener noreferrer" className="btn-nav" style={{ justifyContent: 'space-between' }}>
                <span>Thesaurus Linguae Aegyptiae</span>
                <ExternalLink size={14} />
              </a>
              <a href="http://kellia.uni-goettingen.de/" target="_blank" rel="noopener noreferrer" className="btn-nav" style={{ justifyContent: 'space-between' }}>
                <span>KELLIA Project</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={18} color="var(--accent-emerald)" />
              <strong style={{ color: 'var(--text-primary)' }}>License &amp; Citation</strong>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Lexicon data is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)' }}>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</a>.
              Software platform by <strong>Copto.org</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
