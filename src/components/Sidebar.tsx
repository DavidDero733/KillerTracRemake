import React, { useState } from 'react';
import { Sighting, Zone, Route, CustomKiller } from '../types';
import { DEFAULT_KILLERS } from '../constants';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  sightings: Sighting[];
  zones: Zone[];
  routes: Route[];
  customKillers: CustomKiller[];
  user: User | null;
  onDeleteKiller: (id: string) => void;
}

type Tab = 'all' | 'sightings' | 'safe' | 'hot' | 'routes' | 'killers';

export default function Sidebar({ open, onClose, sightings, zones, routes, customKillers, user, onDeleteKiller }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const filteredItems = () => {
    const all = [
      ...sightings.map(s => ({ ...s, _type: 'sighting' as const })),
      ...zones.map(z => ({ ...z, _type: 'zone' as const })),
      ...routes.map(r => ({ ...r, _type: 'route' as const })),
    ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    if (activeTab === 'all') return all;
    if (activeTab === 'sightings') return all.filter(i => i._type === 'sighting');
    if (activeTab === 'safe') return all.filter(i => i._type === 'zone' && i.type === 'safe');
    if (activeTab === 'hot') return all.filter(i => i._type === 'zone' && i.type === 'hot');
    if (activeTab === 'routes') return all.filter(i => i._type === 'route');
    return [];
  };

  return (
    <div className={cn(
      "fixed top-14 right-0 bottom-0 w-80 bg-bg-dark/95 backdrop-blur-md border-l border-border-halloween z-[700] flex flex-col transition-transform duration-300 ease-in-out",
      open ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="p-4 border-b border-border-halloween flex items-center justify-between">
        <h2 className="font-serif text-sm font-bold text-amber-halloween tracking-wide">🕯️ THE NIGHT LOG</h2>
        <button onClick={onClose} className="text-muted-halloween hover:text-cream-halloween transition-colors">✕</button>
      </div>

      <div className="flex border-b border-border-halloween">
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')}>All</TabButton>
        <TabButton active={activeTab === 'sightings'} onClick={() => setActiveTab('sightings')}>🔦</TabButton>
        <TabButton active={activeTab === 'safe'} onClick={() => setActiveTab('safe')}>🛡️</TabButton>
        <TabButton active={activeTab === 'hot'} onClick={() => setActiveTab('hot')}>⚠️</TabButton>
        <TabButton active={activeTab === 'routes'} onClick={() => setActiveTab('routes')}>🗺️</TabButton>
        <TabButton active={activeTab === 'killers'} onClick={() => setActiveTab('killers')}>👾</TabButton>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {activeTab === 'killers' ? (
          <>
            <div className="text-[10px] font-bold text-muted-halloween uppercase tracking-widest mb-1 mt-2">Custom Roster</div>
            {customKillers.length === 0 && <div className="text-xs text-muted-halloween italic p-2">No custom killers added yet.</div>}
            {customKillers.map(k => (
              <div key={k.id} className="bg-bg-card border border-border-halloween rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl border-2" style={{ borderColor: k.color, backgroundColor: `${k.color}22` }}>
                  {k.em}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-cream-halloween truncate">{k.name}</h3>
                  <div className="text-[10px] text-muted-halloween">Added by {k.uid === 'anonymous' ? 'Anonymous' : 'User'}</div>
                </div>
                {(user && user.uid === k.uid) && (
                  <button 
                    onClick={() => onDeleteKiller(k.id)}
                    className="p-2 text-muted-halloween hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete custom killer"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
            
            <div className="text-[10px] font-bold text-muted-halloween uppercase tracking-widest mb-1 mt-4">Default Roster</div>
            {DEFAULT_KILLERS.map(k => (
              <div key={k.id} className="bg-bg-card border border-border-halloween rounded-xl p-3 flex items-center gap-3 opacity-70">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl border-2" style={{ borderColor: k.color, backgroundColor: `${k.color}22` }}>
                  {k.em}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-cream-halloween truncate">{k.name}</h3>
                  <div className="text-[10px] text-muted-halloween">System Default</div>
                </div>
              </div>
            ))}
          </>
        ) : filteredItems().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
            <div className="text-4xl mb-2">🎃</div>
            <p className="text-xs text-muted-halloween">Nothing reported yet.</p>
          </div>
        ) : (
          filteredItems().map(item => (
            <div key={item.id} className="bg-bg-card border border-border-halloween rounded-xl p-3 hover:bg-bg-hover hover:border-orange-halloween transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center text-xl border border-border-halloween",
                  item._type === 'sighting' && "bg-orange-halloween/10",
                  item._type === 'zone' && item.type === 'safe' && "bg-green-500/10 border-green-500/30",
                  item._type === 'zone' && item.type === 'hot' && "bg-red-500/10 border-red-500/30",
                  item._type === 'route' && "bg-blue-500/10 border-blue-500/30"
                )}>
                  {'em' in item ? item.em : (item._type === 'zone' ? (item.type === 'safe' ? '🛡️' : '⚠️') : '🗺️')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-cream-halloween truncate">{item.name}</h3>
                  <div className="text-[10px] text-muted-halloween">{formatDistanceToNow(new Date(item.ts))} ago</div>
                </div>
              </div>
              {'note' in item && item.note && (
                <div className="mt-2 pt-2 border-t border-border-halloween text-[11px] text-warm-halloween leading-relaxed italic">
                  "{item.note}"
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-2 text-[11px] font-bold transition-all border-b-2",
        active ? "text-cream-halloween border-orange-halloween" : "text-muted-halloween border-transparent hover:text-warm-halloween"
      )}
    >
      {children}
    </button>
  );
}
