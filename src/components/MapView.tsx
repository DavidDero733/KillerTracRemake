import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Sighting, Zone, Route } from '../types';
import { formatDistanceToNow } from 'date-fns';

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

export default function MapView({ sightings, zones, routes, mode, setMode, setPendingLoc, setActiveModal, zoneType }: MapViewProps) {
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

      {/* Sightings */}
      {sightings.map(s => (
        <Marker 
          key={s.id} 
          position={[s.lat, s.lng]}
          icon={L.divIcon({
            className: '',
            html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${s.color};border:2.5px solid rgba(255,255,255,0.22);box-shadow:0 3px 12px ${s.color}88;display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:1.05rem;display:block;line-height:1;">${s.em}</span></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -40],
          })}
        >
          <Popup>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-3xl leading-none">{s.em}</span>
              <div>
                <div className="font-serif text-sm font-semibold text-amber-halloween">{s.name}</div>
                <div className="text-[10px] text-muted-halloween">{formatDistanceToNow(new Date(s.ts))} ago</div>
              </div>
            </div>
            {s.note && <div className="text-xs text-warm-halloween leading-relaxed pt-2 border-t border-orange-halloween/20">"{s.note}"</div>}
          </Popup>
        </Marker>
      ))}

      {/* Zones */}
      {zones.map(z => {
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
                    <div className="font-serif text-sm font-semibold text-amber-halloween">{z.name}</div>
                    <div className="text-[10px] text-muted-halloween">{formatDistanceToNow(new Date(z.ts))} ago</div>
                  </div>
                </div>
                {z.note && <div className="text-xs text-warm-halloween leading-relaxed pt-2 border-t border-orange-halloween/20">{z.note}</div>}
              </Popup>
            </Marker>
          </div>
        );
      })}

      {/* Routes */}
      {routes.map(r => (
        <Polyline 
          key={r.id}
          positions={r.points}
          pathOptions={{
            color: r.color,
            weight: 3.5,
            opacity: 0.85,
            dashArray: r.routeType === 'patrol' ? undefined : '8, 6'
          }}
        >
          <Popup>
            <div className="font-serif text-sm font-semibold text-amber-halloween">{r.name}</div>
            <div className="text-[10px] text-muted-halloween mb-1">{formatDistanceToNow(new Date(r.ts))} ago</div>
            {r.note && <div className="text-xs text-warm-halloween leading-relaxed pt-2 border-t border-orange-halloween/20">{r.note}</div>}
          </Popup>
        </Polyline>
      ))}
    </MapContainer>
  );
}
