import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Sighting, Zone, Route } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

// Fix for Leaflet default icon issues in production
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  sightings: Sighting[];
  zones: Zone[];
  routes: Route[];
  mode: 'idle' | 'picking_sighting' | 'picking_zone' | 'route';
  setMode: (mode: 'idle' | 'picking_sighting' | 'picking_zone' | 'route') => void;
  setPendingLoc: (loc: { lat: number; lng: number } | null) => void;
  setActiveModal: (modal: 'sighting' | 'zone' | 'route' | 'killer' | null) => void;
  zoneType: 'safe' | 'hot';
  showToast: (msg: string) => void;
  userLocation: { lat: number; lng: number } | null;
  isTracking: boolean;
  setIsTracking: (tracking: boolean) => void;
}

function MapEvents({ mode, setMode, setPendingLoc, setActiveModal }: any) {
  useMapEvents({
    click(e) {
      if (mode === 'picking_sighting') {
        setPendingLoc({ lat: e.latlng.lat, lng: e.latlng.lng });
        setMode('idle');
        setActiveModal('sighting');
      } else if (mode === 'picking_zone') {
        setPendingLoc({ lat: e.latlng.lat, lng: e.latlng.lng });
        setMode('idle');
        setActiveModal('zone');
      }
    },
  });
  return null;
}

function MapController({ center, shouldFly }: { center: { lat: number; lng: number } | null, shouldFly: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (center && shouldFly) {
      map.flyTo([center.lat, center.lng], 16, { animate: true, duration: 1 });
    }
  }, [center, shouldFly, map]);
  return null;
}

export default function MapView({ sightings, zones, routes, mode, setMode, setPendingLoc, setActiveModal, zoneType, userLocation, isTracking, setIsTracking }: MapViewProps) {
  const [shouldFly, setShouldFly] = useState(false);

  // Ensure we don't crash if data is missing
  const validSightings = sightings.filter(s => s && typeof s.lat === 'number' && typeof s.lng === 'number');
  const validZones = zones.filter(z => z && typeof z.lat === 'number' && typeof z.lng === 'number');
  const validRoutes = routes.filter(r => r && Array.isArray(r.points) && r.points.length > 0);

  return (
    <MapContainer 
      center={[39.5, -98.35]} 
      zoom={5} 
      zoomControl={false}
      className="w-full h-full"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      <MapEvents mode={mode} setMode={setMode} setPendingLoc={setPendingLoc} setActiveModal={setActiveModal} />
      <MapController center={userLocation} shouldFly={shouldFly} />

      {/* GPS Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => {
            if (!isTracking) {
              setIsTracking(true);
              setShouldFly(true);
            } else {
              setShouldFly(true); // Recenter if already tracking
              // Reset shouldFly after a moment so it doesn't lock the user's pan
              setTimeout(() => setShouldFly(false), 1500);
            }
          }}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all border-2 ${isTracking ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-bg-card border-border-halloween text-muted-halloween hover:border-orange-halloween hover:text-orange-halloween'}`}
          title="Locate Me"
        >
          📍
        </button>
      </div>

      {/* User Location Marker */}
      {userLocation && (
        <Marker 
          position={[userLocation.lat, userLocation.lng]}
          icon={L.divIcon({
            className: '',
            html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 15px #3b82f6;animation:pulse 2s infinite;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        >
          <Popup>You are here</Popup>
        </Marker>
      )}

      {/* Sightings */}
      {validSightings.map(s => (
        <Marker 
          key={s.id} 
          position={[s.lat, s.lng]}
          icon={L.divIcon({
            className: '',
            html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${s.color || '#f97316'};border:2.5px solid rgba(255,255,255,0.22);box-shadow:0 3px 12px ${s.color || '#f97316'}88;display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:1.05rem;display:block;line-height:1;">${s.em || '🎃'}</span></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -40],
          })}
        >
          <Popup>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-3xl leading-none">{s.em || '🎃'}</span>
              <div>
                <div className="font-serif text-sm font-semibold text-amber-halloween">{s.name || 'Unknown'}</div>
                <div className="text-[10px] text-muted-halloween">{s.ts ? formatDistanceToNow(new Date(s.ts)) : 'some time'} ago</div>
              </div>
            </div>
            {s.note && <div className="text-xs text-warm-halloween leading-relaxed pt-2 border-t border-orange-halloween/20">"{s.note}"</div>}
          </Popup>
        </Marker>
      ))}

      {/* Zones */}
      {validZones.map(z => {
        const isSafe = z.type === 'safe';
        const color = isSafe ? '#22c55e' : '#ef4444';
        const em = isSafe ? '🛡️' : '⚠️';
        return (
          <div key={z.id}>
            <Circle 
              center={[z.lat, z.lng]}
              radius={isSafe ? 300 : 220}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.13,
                color: color,
                weight: isSafe ? 2 : 2.5,
                className: isSafe ? '' : 'pulse-path'
              }}
            />
            <Marker 
              position={[z.lat, z.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="width:32px;height:32px;border-radius:50%;background:${color}2e;border:2px solid ${color}a6;display:flex;align-items:center;justify-content:center;font-size:1rem;">${em}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                popupAnchor: [0, -20],
              })}
            >
              <Popup>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-2xl leading-none">{em}</span>
                  <div>
                    <div className="font-serif text-sm font-semibold text-amber-halloween">{z.name || 'Zone'}</div>
                    <div className="text-[10px] text-muted-halloween">{z.ts ? formatDistanceToNow(new Date(z.ts)) : 'some time'} ago</div>
                  </div>
                </div>
                {z.note && <div className="text-xs text-warm-halloween leading-relaxed pt-2 border-t border-orange-halloween/20">{z.note}</div>}
              </Popup>
            </Marker>
          </div>
        );
      })}

      {/* Routes */}
      {validRoutes.map(r => (
        <Polyline 
          key={r.id}
          positions={r.points}
          pathOptions={{
            color: r.color || '#3b82f6',
            weight: 3.5,
            opacity: 0.85,
            dashArray: r.routeType === 'patrol' ? undefined : '8, 6'
          }}
        >
          <Popup>
            <div className="font-serif text-sm font-semibold text-amber-halloween">{r.name || 'Route'}</div>
            <div className="text-[10px] text-muted-halloween mb-1">{r.ts ? formatDistanceToNow(new Date(r.ts)) : 'some time'} ago</div>
            {r.note && <div className="text-xs text-warm-halloween leading-relaxed pt-2 border-t border-orange-halloween/20">{r.note}</div>}
          </Popup>
        </Polyline>
      ))}
    </MapContainer>
  );
}

