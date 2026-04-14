import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { getDbInstance, OperationType, getFirestoreErrorInfo } from '../firebase';
import { CustomKiller, Killer } from '../types';
import { cn } from '../lib/utils';
import { FirebaseError } from 'firebase/app';

const DEFAULT_KILLERS: Killer[] = [
  { id: 'michael', name: 'Michael Myers', short: 'Michael', em: '🎭', color: '#f97316' },
  { id: 'jason', name: 'Jason Voorhees', short: 'Jason', em: '🪓', color: '#6366f1' },
  { id: 'ghostface', name: 'Ghostface', short: 'Ghostface', em: '👻', color: '#a855f7' },
  { id: 'leatherface', name: 'Leatherface', short: 'Leather.', em: '🪚', color: '#ef4444' },
  { id: 'freddy', name: 'Freddy Krueger', short: 'Freddy', em: '💤', color: '#eab308' },
  { id: 'chucky', name: 'Chucky', short: 'Chucky', em: '🪆', color: '#22c55e' },
  { id: 'pennywise', name: 'Pennywise', short: 'Penny.', em: '🤡', color: '#ec4899' },
  { id: 'unknown', name: 'Unknown Figure', short: 'Unknown', em: '🎃', color: '#f59e0b' },
];

const KILLER_COLORS = ['#f97316', '#6366f1', '#a855f7', '#ef4444', '#eab308', '#22c55e', '#ec4899', '#06b6d4', '#f59e0b', '#8b5cf6', '#14b8a6', '#e879f9'];
const EMOJI_SUGGESTIONS = ['🧟', '🧛', '🧙', '🦇', '💀', '🩸', '🕷️', '🐺', '👁️', '🌕', '🔮', '⚰️', '🗡️', '☠️', '👺', '👹', '🤖', '🤕', '🦴', '🕸️', '🩻', '🪄'];

interface ModalProps {
  onClose: () => void;
  user: User | null;
  onLogin: () => void;
  showToast: (msg: string) => void;
}

export function SightingModal({ onClose, pendingLoc, setPendingLoc, customKillers, onOpenKillerCreator, onPickOnMap, user, onLogin, showToast }: ModalProps & { pendingLoc: any; setPendingLoc: any; customKillers: CustomKiller[]; onOpenKillerCreator: () => void; onPickOnMap: () => void }) {
  const [selKillerId, setSelKillerId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allKillers = [...DEFAULT_KILLERS, ...customKillers];

  const handleSubmit = async () => {
    if (!user) { onLogin(); return; }
    if (!selKillerId) { showToast('👻 Choose who you spotted!'); return; }
    if (!pendingLoc) { showToast('📍 Mark a location on the map.'); return; }

    setIsSubmitting(true);
    const k = allKillers.find(k => k.id === selKillerId)!;
    
    try {
      const db = getDbInstance();
      await addDoc(collection(db, 'sightings'), {
        kid: k.id,
        name: k.name,
        em: k.em,
        color: k.color,
        lat: pendingLoc.lat,
        lng: pendingLoc.lng,
        note: note.trim() || null,
        ts: new Date().toISOString(),
        uid: user.uid
      });
      showToast(`${k.em} Sighting logged! Stay safe.`);
      onClose();
    } catch (error) {
      const errInfo = getFirestoreErrorInfo(error, OperationType.CREATE, 'sightings');
      showToast(`Error: ${errInfo.error}`);
      console.error(errInfo);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper title="🔦 Report a Sighting" sub="Help the neighborhood stay informed tonight" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[10px] font-bold text-muted-halloween uppercase tracking-wider mb-2">Who did you spot?</label>
          <div className="grid grid-cols-4 gap-2">
            {allKillers.map(k => (
              <button 
                key={k.id}
                onClick={() => setSelKillerId(k.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center",
                  selKillerId === k.id ? "bg-orange-halloween/15 border-orange-halloween" : "bg-bg-card border-transparent hover:bg-bg-hover"
                )}
              >
                <span className="text-2xl">{k.em}</span>
                <span className="text-[9px] font-bold text-warm-halloween leading-tight">{k.short}</span>
              </button>
            ))}
            <button 
              onClick={onOpenKillerCreator}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 border-dashed border-border-halloween hover:bg-bg-hover hover:border-purple-500 transition-all"
            >
              <span className="text-xl">➕</span>
              <span className="text-[9px] font-bold text-muted-halloween">Add yours</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-muted-halloween uppercase tracking-wider mb-2">Location</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-bg-card border border-border-halloween rounded-xl px-3 py-2 text-xs text-warm-halloween">
              {pendingLoc ? `📍 ${pendingLoc.lat.toFixed(4)}°, ${pendingLoc.lng.toFixed(4)}°` : 'No location set'}
            </div>
            <button onClick={onPickOnMap} className="px-3 py-2 bg-bg-card border border-border-halloween rounded-xl text-[11px] font-bold text-warm-halloween hover:border-orange-halloween transition-all">📍 Pick</button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-muted-halloween uppercase tracking-wider mb-2">Notes (optional)</label>
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Spotted on Elm St, moving slowly toward the park..."
            className="w-full bg-bg-card border border-border-halloween rounded-xl px-3 py-2 text-sm text-cream-halloween outline-none focus:border-orange-halloween transition-all resize-none"
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-bg-card border border-border-halloween rounded-xl text-warm-halloween font-bold hover:bg-bg-hover transition-all">Never mind</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gradient-to-br from-orange-halloween to-amber-halloween text-bg-deep font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Sighting'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

export function ZoneModal({ type, onClose, pendingLoc, setPendingLoc, onPickOnMap, user, onLogin, showToast }: ModalProps & { type: 'safe' | 'hot'; pendingLoc: any; setPendingLoc: any; onPickOnMap: () => void }) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSafe = type === 'safe';

  const handleSubmit = async () => {
    if (!user) { onLogin(); return; }
    if (!name.trim()) { showToast('Please give this location a name.'); return; }
    if (!pendingLoc) { showToast('📍 Mark a location on the map.'); return; }

    setIsSubmitting(true);
    try {
      const db = getDbInstance();
      await addDoc(collection(db, 'zones'), {
        type,
        name: name.trim(),
        lat: pendingLoc.lat,
        lng: pendingLoc.lng,
        note: note.trim() || null,
        ts: new Date().toISOString(),
        uid: user.uid
      });
      showToast(`${isSafe ? '🛡️' : '⚠️'} ${name} added to the map!`);
      onClose();
    } catch (error) {
      const errInfo = getFirestoreErrorInfo(error, OperationType.CREATE, 'zones');
      showToast(`Error: ${errInfo.error}`);
      console.error(errInfo);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper 
      title={isSafe ? "🛡️ Mark a Safe Zone" : "⚠️ Mark a Hot Spot"} 
      sub={isSafe ? "Let people know where it's safe tonight" : "Flag a dangerous or high-activity area"} 
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold",
          isSafe ? "bg-green-500/10 border-green-500/25 text-green-400" : "bg-red-500/10 border-red-500/25 text-red-400"
        )}>
          {isSafe ? '🛡️ Safe Zone — shown as a green area on the map' : '⚠️ Hot Spot — shown as a pulsing red area on the map'}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-muted-halloween uppercase tracking-wider mb-2">Name this location</label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Community Center, Brightly Lit Porch..."
            className="w-full bg-bg-card border border-border-halloween rounded-xl px-3 py-2 text-sm text-cream-halloween outline-none focus:border-orange-halloween transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-muted-halloween uppercase tracking-wider mb-2">Location</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-bg-card border border-border-halloween rounded-xl px-3 py-2 text-xs text-warm-halloween">
              {pendingLoc ? `📍 ${pendingLoc.lat.toFixed(4)}°, ${pendingLoc.lng.toFixed(4)}°` : 'No location set'}
            </div>
            <button onClick={onPickOnMap} className="px-3 py-2 bg-bg-card border border-border-halloween rounded-xl text-[11px] font-bold text-warm-halloween hover:border-orange-halloween transition-all">📍 Pick</button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-muted-halloween uppercase tracking-wider mb-2">Notes (optional)</label>
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Lights on all night, candy available..."
            className="w-full bg-bg-card border border-border-halloween rounded-xl px-3 py-2 text-sm text-cream-halloween outline-none focus:border-orange-halloween transition-all resize-none"
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-bg-card border border-border-halloween rounded-xl text-warm-halloween font-bold hover:bg-bg-hover transition-all">Never mind</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gradient-to-br from-orange-halloween to-amber-halloween text-bg-deep font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add to Map'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

export function CustomKillerModal({ onClose, user, showToast }: { onClose: () => void; user: User | null; showToast: (msg: string) => void }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎃');
  const [color, setColor] = useState(KILLER_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim()) { showToast('Give your killer a name!'); return; }
    
    setIsSubmitting(true);
    try {
      const db = getDbInstance();
      await addDoc(collection(db, 'killers'), {
        name: name.trim(),
        short: name.trim().split(' ')[0].substring(0, 8),
        em: emoji,
        color,
        uid: user.uid
      });
      showToast(`${emoji} ${name} added to the roster!`);
      onClose();
    } catch (error) {
      const errInfo = getFirestoreErrorInfo(error, OperationType.CREATE, 'killers');
      showToast(`Error: ${errInfo.error}`);
      console.error(errInfo);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper title="👾 Add a Custom Killer" sub="Create your own for the roster" onClose={onClose} zIndex={1100}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[10px] font-bold text-muted-halloween uppercase tracking-wider mb-2">Name</label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Babadook, Candyman..."
            className="w-full bg-bg-card border border-border-halloween rounded-xl px-3 py-2 text-sm text-cream-halloween outline-none focus:border-orange-halloween transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-muted-halloween uppercase tracking-wider mb-2">Emoji icon</label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-bg-card border border-border-halloween rounded-xl flex items-center justify-center text-2xl">{emoji}</div>
            <input 
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
              className="flex-1 bg-bg-card border border-border-halloween rounded-xl px-3 py-2 text-sm text-cream-halloween outline-none focus:border-orange-halloween transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {EMOJI_SUGGESTIONS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} className="text-xl p-1 hover:bg-bg-hover rounded-lg transition-colors">{e}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-muted-halloween uppercase tracking-wider mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {KILLER_COLORS.map(c => (
              <button 
                key={c} 
                onClick={() => setColor(c)}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all",
                  color === c ? "border-white scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-bg-card border border-border-halloween rounded-xl text-warm-halloween font-bold hover:bg-bg-hover transition-all">Cancel</button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gradient-to-br from-orange-halloween to-amber-halloween text-bg-deep font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Killer'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

export function RouteModal({ onClose }: { onClose: () => void }) {
  return null; // Simplified for now
}

function ModalWrapper({ title, sub, children, onClose, zIndex = 1000 }: { title: string; sub: string; children: React.ReactNode; onClose: () => void; zIndex?: number }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex }}>
      <div className="bg-bg-dark border border-border-halloween rounded-[20px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-border-halloween">
          <h2 className="font-serif text-lg font-bold text-amber-halloween">{title}</h2>
          <p className="text-xs text-muted-halloween mt-0.5">{sub}</p>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
