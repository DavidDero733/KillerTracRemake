export interface Sighting {
  id: string;
  kid: string;
  name: string;
  em: string;
  color: string;
  lat: number;
  lng: number;
  note?: string;
  ts: string;
  uid: string;
}

export interface Zone {
  id: string;
  type: 'safe' | 'hot';
  name: string;
  lat: number;
  lng: number;
  note?: string;
  ts: string;
  uid: string;
}

export interface Route {
  id: string;
  name: string;
  routeType: 'escape' | 'patrol' | 'treats' | 'avoid';
  color: string;
  points: [number, number][];
  note?: string;
  ts: string;
  uid: string;
}

export interface CustomKiller {
  id: string;
  name: string;
  short: string;
  em: string;
  color: string;
  uid: string;
}

export interface Killer {
  id: string;
  name: string;
  short: string;
  em: string;
  color: string;
}
