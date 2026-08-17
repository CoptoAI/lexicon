import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { isOfflineReady, syncOfflineDatabase } from '../services/offlineDb';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineReady, setOfflineReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    isOfflineReady().then((ready) => {
      setOfflineReady(ready);
      // If online and not yet cached, start background sync
      if (!ready && navigator.onLine) {
        startSync(true);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startSync = async (silent = false) => {
    if (syncing) return;
    setSyncing(true);
    if (!silent) setShowBanner(true);

    const res = await syncOfflineDatabase((percent) => {
      setProgress(percent);
    });

    setSyncing(false);
    if (res.success) {
      setOfflineReady(true);
      if (!silent) {
        setTimeout(() => setShowBanner(false), 3000);
      }
    }
  };

  return (
    <>
      <div className="offline-status-pill" onClick={() => setShowBanner(!showBanner)} title="Offline Database Status">
        {syncing ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-amber)' }}>
            <RefreshCw size={12} className="spin-animate" />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Syncing {progress}%</span>
          </span>
        ) : !isOnline ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#f87171' }}>
            <WifiOff size={12} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Offline Mode</span>
          </span>
        ) : offlineReady ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={12} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Offline Ready</span>
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-gold)' }}>
            <Database size={12} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Sync Offline</span>
          </span>
        )}
      </div>

      {showBanner && (
        <div className="offline-banner-modal" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--accent-gold)" />
              <strong style={{ fontSize: '14px' }}>Offline Lexicon Storage</strong>
            </div>
            <button className="btn-clear" onClick={() => setShowBanner(false)}>✕</button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            {offlineReady
              ? 'All 11,272 entries, Egyptian roots, and IPA pronunciations are fully stored on your device for instant offline use.'
              : 'Download the complete dictionary dataset (~2 MB) for instant zero-network offline searching.'}
          </p>

          {syncing && (
            <div className="sync-progress-bar-container">
              <div className="sync-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            {!offlineReady && !syncing && (
              <button className="btn-nav" onClick={() => startSync(false)} style={{ borderColor: 'var(--border-gold)' }}>
                <RefreshCw size={13} />
                <span>Download Offline DB</span>
              </button>
            )}
            {offlineReady && (
              <button className="btn-nav" onClick={() => startSync(false)} style={{ fontSize: '11px', padding: '4px 8px' }}>
                <RefreshCw size={11} />
                <span>Re-sync</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
