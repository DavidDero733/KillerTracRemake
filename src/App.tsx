/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, getDocFromServer, doc } from 'firebase/firestore';
import { getAuthInstance, getDbInstance, OperationType, handleFirestoreError } from './firebase';
import { Sighting, Zone, Route, CustomKiller } from './types';
import Header from './components/Header';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import { SightingModal, ZoneModal, RouteModal, CustomKillerModal } from './components/Modals';
import { Toast } from './components/Toast';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [customKillers, setCustomKillers] = useState<CustomKiller[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'sighting' | 'zone' | 'route' | 'killer' | null>(null);
  const [mode, setMode] = useState<'idle' | 'picking_sighting' | 'picking_zone' | 'route'>('idle');
  const [zoneType, setZoneType] = useState<'safe' | 'hot'>('safe');
  const [pendingLoc, setPendingLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Test connection
  useEffect(() => {
    async function testConnection() {
      try {
        const db = getDbInstance();
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    try {
      const auth = getAuthInstance();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setIsAuthReady(true);
      });
      return unsubscribe;
    } catch (error) {
      console.error("Auth initialization failed", error);
      setIsAuthReady(true); // Still ready, just not logged in
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    try {
      const db = getDbInstance();
      const qSightings = query(collection(db, 'sightings'), orderBy('ts', 'desc'));
      const unsubSightings = onSnapshot(qSightings, (snapshot) => {
        setSightings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sighting)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'sightings'));

      const qZones = query(collection(db, 'zones'), orderBy('ts', 'desc'));
      const unsubZones = onSnapshot(qZones, (snapshot) => {
        setZones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Zone)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'zones'));

      const qRoutes = query(collection(db, 'routes'), orderBy('ts', 'desc'));
      const unsubRoutes = onSnapshot(qRoutes, (snapshot) => {
        setRoutes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'routes'));

      const qKillers = query(collection(db, 'killers'));
      const unsubKillers = onSnapshot(qKillers, (snapshot) => {
        setCustomKillers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomKiller)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'killers'));

      return () => {
        unsubSightings();
        unsubZones();
        unsubRoutes();
        unsubKillers();
      };
    } catch (error) {
      console.error("Firestore initialization failed", error);
    }
  }, [isAuthReady]);

  const login = async () => {
    try {
      const auth = getAuthInstance();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      showToast("Login failed. Check if popups are blocked.");
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  if (!isAuthReady) return null;

  return (
    <div className="h-screen flex flex-col bg-bg-deep overflow-hidden">
      <Header 
        totalCount={sightings.length + zones.length + routes.length} 
        user={user}
        onLogin={login}
      />
      
      <main className="flex-1 relative">
        <MapView 
          sightings={sightings}
          zones={zones}
          routes={routes}
          mode={mode}
          setMode={setMode}
          setPendingLoc={setPendingLoc}
          setActiveModal={setActiveModal}
          zoneType={zoneType}
          showToast={showToast}
        />

        {/* Mode Banners */}
        {mode === 'picking_sighting' && (
          <div className="absolute top-0 left-0 right-0 z-[800] flex items-center justify-center gap-4 p-3 bg-gradient-to-r from-orange-halloween to-amber-halloween text-bg-deep font-bold shadow-lg">
            <span>📍 Click the map to mark the location</span>
            <button onClick={() => setMode('idle')} className="bg-black/20 px-3 py-1 rounded-full text-sm hover:bg-black/30 transition-colors">Cancel</button>
          </div>
        )}

        {(mode === 'picking_zone') && (
          <div className="absolute top-0 left-0 right-0 z-[800] flex items-center justify-center gap-4 p-3 bg-gradient-to-r from-orange-halloween to-amber-halloween text-bg-deep font-bold shadow-lg">
            <span>{zoneType === 'safe' ? '🛡️' : '⚠️'} Click the map to place the {zoneType === 'safe' ? 'Safe Zone' : 'Hot Spot'}</span>
            <button onClick={() => setMode('idle')} className="bg-black/20 px-3 py-1 rounded-full text-sm hover:bg-black/30 transition-colors">Cancel</button>
          </div>
        )}

        {/* Tool Panel */}
        <div className="absolute bottom-5 left-5 z-[800] bg-bg-dark/95 backdrop-blur-md border border-border-halloween rounded-2xl p-3 flex flex-col gap-2 shadow-2xl">
          <div className="text-[10px] font-bold text-muted-halloween uppercase tracking-widest text-center">Add to map</div>
          <div className="flex gap-2">
            <ToolButton icon="🔦" label="Sighting" active={mode === 'picking_sighting'} onClick={() => { setMode('picking_sighting'); setSidebarOpen(false); }} />
            <ToolButton icon="🛡️" label="Safe Zone" active={mode === 'picking_zone' && zoneType === 'safe'} onClick={() => { setMode('picking_zone'); setZoneType('safe'); setSidebarOpen(false); }} />
            <ToolButton icon="⚠️" label="Hot Spot" active={mode === 'picking_zone' && zoneType === 'hot'} onClick={() => { setMode('picking_zone'); setZoneType('hot'); setSidebarOpen(false); }} />
            <ToolButton icon="🗺️" label="Route" active={mode === 'route'} onClick={() => { setMode('route'); setSidebarOpen(false); }} />
          </div>
          <div className="h-px bg-border-halloween mx-1" />
          <button 
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-bg-card border border-border-halloween rounded-xl text-warm-halloween font-bold text-sm hover:bg-bg-hover hover:border-orange-halloween transition-all"
          >
            🕯️ View Night Log
          </button>
        </div>

        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          sightings={sightings}
          zones={zones}
          routes={routes}
        />
      </main>

      {/* Modals */}
      {activeModal === 'sighting' && (
        <SightingModal 
          onClose={() => setActiveModal(null)}
          pendingLoc={pendingLoc}
          setPendingLoc={setPendingLoc}
          customKillers={customKillers}
          onOpenKillerCreator={() => setActiveModal('killer')}
          onPickOnMap={() => { setActiveModal(null); setMode('picking_sighting'); }}
          user={user}
          onLogin={login}
          showToast={showToast}
        />
      )}

      {activeModal === 'zone' && (
        <ZoneModal 
          type={zoneType}
          onClose={() => setActiveModal(null)}
          pendingLoc={pendingLoc}
          setPendingLoc={setPendingLoc}
          onPickOnMap={() => { setActiveModal(null); setMode('picking_zone'); }}
          user={user}
          onLogin={login}
          showToast={showToast}
        />
      )}

      {activeModal === 'killer' && (
        <CustomKillerModal 
          onClose={() => setActiveModal('sighting')}
          user={user}
          showToast={showToast}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}

function ToolButton({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all min-w-[56px] ${
        active 
          ? 'bg-orange-halloween/15 border-orange-halloween text-cream-halloween' 
          : 'bg-bg-card border-transparent text-muted-halloween hover:bg-bg-hover hover:text-warm-halloween hover:border-border-halloween'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

