'use client';

import { useState } from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface NavBarProps {
  lastIngested?: string;
}

export function NavBar({ lastIngested }: NavBarProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/ingest', { method: 'POST' });
      const data = await res.json();
      setSyncMsg(`Synced ${data.total} events`);
      // Refresh the page to show new data
      window.location.reload();
    } catch {
      setSyncMsg('Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  const syncedAgo = lastIngested
    ? formatRelative(new Date(lastIngested))
    : null;

  return (
    <header className="bg-nexus-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <span
              className="text-2xl font-bold tracking-tight text-white"
              style={{ fontFamily: "'Helvetica Now', Arial, sans-serif", letterSpacing: '-0.02em' }}
            >
              NEXUS
            </span>
            <div className="hidden sm:block w-px h-6 bg-white/20" />
            <div className="hidden sm:block">
              <p className="text-nexus-amber text-sm font-semibold leading-none">Conference Intelligence Radar</p>
              <p className="text-white/50 text-xs mt-0.5">Crypto BD Intelligence · Powered by AI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {syncedAgo && (
              <span className="hidden sm:block text-white/50 text-xs">
                Last synced {syncedAgo}
              </span>
            )}
            {syncMsg && (
              <span className="text-xs text-teal-300">{syncMsg}</span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold bg-nexus-amber text-nexus-navy hover:bg-amber-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {syncing ? <LoadingSpinner size={12} /> : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 8V3M21 8h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 16v5M3 16h5" />
                </svg>
              )}
              {syncing ? 'Syncing…' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
