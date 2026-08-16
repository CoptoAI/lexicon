import React from 'react';
import { X, Info, ExternalLink, ShieldCheck, Award } from 'lucide-react';

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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>About the Coptic Dictionary Online</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.6' }}>
          <p>
            The <strong>Coptic Dictionary Online</strong> is a digital lexicon offering freely accessible lexical data and translations in English, French, and German across all Coptic dialects, powered by modern edge technologies on <strong>Cloudflare Pages &amp; D1 SQLite</strong>.
          </p>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '16px', marginBottom: '8px' }}>Lexicon Sources &amp; Compilation</h3>
            <p>
              The <em>Comprehensive Coptic Lexicon</em> combines two major foundational academic resources:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li>
                <strong>BBAW Lexicon of Coptic Egyptian</strong> (<em>Strukturen und Transformationen des Wortschatzes der ägyptischen Sprache</em> at the Berlin-Brandenburg Academy of Sciences and Humanities).
              </li>
              <li>
                <strong>DDGLC Lexicon of Greek Loanwords in Coptic</strong> (<em>Database and Dictionary of Greek Loanwords in Coptic</em> at Freie Universität Berlin).
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '16px', marginBottom: '8px' }}>Contributing Projects &amp; Partners</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
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
              Software interface is licensed under the Apache 2.0 License.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
