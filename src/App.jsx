import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, ChevronLeft, Clock, Star, Home, X, Check, Calendar, Minus, ArrowRight, Heart, Share, Search, SlidersHorizontal, Car as CarIcon, Shield, Zap, Lock, Eye, Camera, Pencil, Trash2 } from 'lucide-react';
import { supabase } from './supabase';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const C = {
  white: '#FFFFFF',
  bg: '#FAFAFA',
  line: '#EBEBEB',
  lineLight: '#F5F5F5',
  ink: '#171717',
  inkSoft: '#525252',
  inkMute: '#8A8A8A',
  green: '#0F3A2E',
  greenMid: '#1F5340',
  greenLight: '#2D6B53',
  greenSoft: '#E8F0ED',
  amber: '#D97706',
  amberSoft: '#FEF3E2',
  amberBright: '#F59E0B',
  cream: '#F5F0E6',
  heart: '#EF4444',
  mapBg: '#F2EFE9',
  mapRoad: '#FFFFFF',
  mapRoadMajor: '#FFFFFF',
  mapRoadLine: '#E0DDD5',
  mapPark: '#CCE1C5',
  mapParkDark: '#B8D4B0',
  mapWater: '#A8D0E0',
  mapBuilding: '#E8E4DB',
  mapBuildingShadow: '#D8D4CB',
};

// ============================================================================
// DEMO DATA
// ============================================================================
const DEMO_SPOTS = [
  {
    id: 's1',
    title: 'Coal Harbour Underground',
    neighborhood: 'Coal Harbour',
    address: '1133 W Hastings St',
    distance: '0.2 km',
    rate: 4,
    type: 'Underground',
    rating: 4.98,
    reviews: 127,
    host: 'Marcus',
    hostYears: 2,
    description: "Secure underground parking in a modern Coal Harbour tower. Well-lit, security cameras, easy fob access. Walking distance to Stanley Park seawall and the Convention Centre.",
    available: 'Mon–Fri, 8am–6pm',
    perks: ['Covered', '24/7 security', 'EV charger nearby'],
    amenities: ['covered', 'security', 'lit', 'ev'],
    x: 245, y: 295,
  },
  {
    id: 's2',
    title: 'Private Driveway · West End',
    neighborhood: 'West End',
    address: '1200 W Pender St',
    distance: '0.4 km',
    rate: 5,
    type: 'Driveway',
    rating: 4.95,
    reviews: 89,
    host: 'Jennifer',
    hostYears: 1,
    description: 'Wide private driveway, fits an SUV comfortably. Steps from Burrard SkyTrain. Perfect for commuters or downtown events.',
    available: 'All day, every day',
    perks: ['SUV friendly', 'Transit nearby', 'Flexible'],
    amenities: ['suv', 'transit', 'flexible'],
    x: 140, y: 370,
  },
  {
    id: 's3',
    title: 'Convention Centre Condo',
    neighborhood: 'Coal Harbour',
    address: '999 Canada Place',
    distance: '0.5 km',
    rate: 7,
    type: 'Condo Stall',
    rating: 4.89,
    reviews: 203,
    host: 'David',
    hostYears: 3,
    description: 'Premium location steps from the Vancouver Convention Centre and Cruise Terminal. Covered, heated parkade with direct building access.',
    available: 'Weekends',
    perks: ['Heated', 'Direct access', 'Premium'],
    amenities: ['covered', 'heated', 'access', 'security'],
    x: 280, y: 220,
  },
  {
    id: 's4',
    title: 'Burrard Office Stall',
    neighborhood: 'Downtown',
    address: '555 Burrard St',
    distance: '0.7 km',
    rate: 4.5,
    type: 'Underground',
    rating: 4.82,
    reviews: 56,
    host: 'Priya',
    hostYears: 1,
    description: 'Office building parkade available evenings and weekends. Perfect for downtown nights out, Canucks games, or Theatre District shows.',
    available: 'After 6pm + weekends',
    perks: ['Evenings', 'Weekends', 'Budget'],
    amenities: ['covered', 'security', 'lit'],
    x: 195, y: 445,
  },
  {
    id: 's5',
    title: 'Bayshore Spot · Near Stanley Park',
    neighborhood: 'Coal Harbour',
    address: '1601 Bayshore Dr',
    distance: '0.8 km',
    rate: 6,
    type: 'Underground',
    rating: 5.0,
    reviews: 42,
    host: 'Liam',
    hostYears: 2,
    description: 'Quiet underground stall walking distance to the Stanley Park seawall. Ideal for weekend hikes and beach days.',
    available: 'Weekdays 9–5',
    perks: ['Near seawall', 'Quiet', 'Weekdays'],
    amenities: ['covered', 'security', 'lit'],
    x: 95, y: 260,
  },
  {
    id: 's6',
    title: 'Yaletown Stall',
    neighborhood: 'Yaletown',
    address: '850 Pacific Blvd',
    distance: '1.2 km',
    rate: 5.5,
    type: 'Condo Stall',
    rating: 4.91,
    reviews: 134,
    host: 'Sophie',
    hostYears: 2,
    description: 'Quiet residential stall in the heart of Yaletown. Walk to Rogers Arena, BC Place, and the seawall. Great for game nights.',
    available: 'Anytime',
    perks: ['Arena nearby', 'Flexible', 'Walkable'],
    amenities: ['covered', 'access', 'flexible'],
    x: 305, y: 520,
  },
];

const SPOT_TYPES = ['Underground', 'Driveway', 'Condo Stall', 'Curbside', 'Garage'];

const AMENITY_META = {
  covered: { label: 'Covered parking', Icon: Home },
  security: { label: '24/7 security', Icon: Shield },
  lit: { label: 'Well-lit', Icon: Eye },
  ev: { label: 'EV charging nearby', Icon: Zap },
  heated: { label: 'Heated', Icon: Home },
  access: { label: 'Direct building access', Icon: Lock },
  suv: { label: 'SUV friendly', Icon: CarIcon },
  transit: { label: 'Transit nearby', Icon: MapPin },
  flexible: { label: 'Flexible hours', Icon: Clock },
};

const TYPE_COLORS = {
  'Underground': { from: '#1F3A5C', to: '#0F2438', accent: '#F5C842', label: '#FEF3C7' },
  'Driveway': { from: '#2D6B53', to: '#1A4D3A', accent: '#FDE68A', label: '#F5F0E6' },
  'Condo Stall': { from: '#4A3E6B', to: '#2D2448', accent: '#FCA5A5', label: '#F5F0E6' },
  'Garage': { from: '#8B5A3C', to: '#5C3A24', accent: '#FDE68A', label: '#F5F0E6' },
  'Curbside': { from: '#1F5340', to: '#0F3A2E', accent: '#F59E0B', label: '#F5F0E6' },
};

// ============================================================================
// HELPERS
// ============================================================================
const fmt = (n) => `$${Number(n).toFixed(2)}`;
const uid = () => 'id-' + Math.random().toString(36).slice(2, 9);

function useFonts() {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);
}

// ============================================================================
// LOGO MARK
// ============================================================================
function LogoMark({ size = 32 }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: 'block' }}>
      <rect width="200" height="200" fill={C.green} rx="44" ry="44" />
      <circle cx="100" cy="100" r="86" fill={C.amber} opacity="0.08" />
      <circle cx="100" cy="100" r="68" fill={C.amber} opacity="0.10" />
      <g transform="translate(100, 100)">
        <path d="M 0 -72 C -44 -72, -64 -42, -64 -16 C -64 14, -36 40, 0 78 C 36 40, 64 14, 64 -16 C 64 -42, 44 -72, 0 -72 Z" fill={C.amber} />
        <circle cx="0" cy="-16" r="36" fill={C.cream} />
        <g transform="translate(0, -16)">
          <path d="M -25 7 L -19 -9 Q -15 -18, -7 -18 L 7 -18 Q 15 -18, 19 -9 L 25 7 L 25 11 Q 25 13, 23 13 L -23 13 Q -25 13, -25 11 Z" fill={C.green} />
          <path d="M -16 -7 Q -12 -16, -7 -16 L 7 -16 Q 12 -16, 16 -7 L 14 -3 L -14 -3 Z" fill={C.cream} />
          <line x1="0" y1="-16" x2="0" y2="-3" stroke={C.green} strokeWidth="1.6" />
          <circle cx="-15" cy="13" r="4.5" fill={C.green} />
          <circle cx="-15" cy="13" r="1.8" fill={C.cream} />
          <circle cx="15" cy="13" r="4.5" fill={C.green} />
          <circle cx="15" cy="13" r="1.8" fill={C.cream} />
        </g>
      </g>
    </svg>
  );
}

// ============================================================================
// PHOTO PLACEHOLDER
// ============================================================================
function SpotPhoto({ type, variant = 'a', withCameraBadge = false }) {
  const palette = TYPE_COLORS[type] || TYPE_COLORS['Underground'];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '60%',
        height: '60%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${palette.accent}22 0%, transparent 70%)`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '50%',
        height: '50%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${palette.accent}1A 0%, transparent 70%)`,
      }} />

      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        backgroundColor: `${palette.label}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
        position: 'absolute',
        top: '32%',
      }}>
        <Camera size={24} color={palette.label} strokeWidth={2} />
      </div>

      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
      }}>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontStyle: 'italic',
          fontSize: 28,
          color: palette.label,
          lineHeight: 1,
          marginBottom: 4,
        }}>
          {type}
        </div>
        <div style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: 10,
          fontWeight: 600,
          color: palette.label,
          opacity: 0.6,
          letterSpacing: '0.15em',
        }}>
          PHOTOS BY HOST · COMING SOON
        </div>
      </div>

      {variant !== 'a' && (
        <div style={{
          position: 'absolute',
          top: 12, left: 12,
          fontFamily: '"Inter", sans-serif',
          fontSize: 9,
          fontWeight: 700,
          color: palette.label,
          opacity: 0.5,
          letterSpacing: '0.1em',
        }}>
          VIEW {variant.toUpperCase()}
        </div>
      )}

      {withCameraBadge && (
        <div style={{
          position: 'absolute',
          top: 12, right: 12,
          padding: '4px 10px',
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderRadius: 100,
          fontFamily: '"Inter", sans-serif',
          fontSize: 10,
          fontWeight: 600,
          color: palette.label,
          backdropFilter: 'blur(10px)',
        }}>
          PROTOTYPE
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GEOCODING (Nominatim — free, no API key, ~1 req/sec limit)
// ============================================================================
async function geocodeAddress(address) {
  try {
    const query = encodeURIComponent(`${address}, Vancouver, BC, Canada`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch (err) {
    console.warn('Geocoding failed:', err);
    return null;
  }
}

// ============================================================================
// MAP ERROR BOUNDARY
// ============================================================================
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('Leaflet map failed, falling back to SVG:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <VanMapSVG {...this.props.childProps} />;
    }
    return this.props.children;
  }
}

// ============================================================================
// VANCOUVER MAP (LEAFLET)
// ============================================================================
function VanMap({ spots, userListings, onSpotTap }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [tilesFailed, setTilesFailed] = useState(false);

  const allPins = [
    ...spots.map(s => ({ ...s, isUser: false })),
    ...userListings.map(s => ({ ...s, isUser: true })),
  ];

  // Coal Harbour center
  const CENTER = [49.2890, -123.1150];

  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window === 'undefined' || !window.L) {
      setTilesFailed(true);
      return;
    }
    if (mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapRef.current, {
      center: CENTER,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      tap: true,
    });
    mapInstanceRef.current = map;

    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
      }
    );
    let tileErrorCount = 0;
    tileLayer.on('tileerror', () => {
      tileErrorCount++;
      if (tileErrorCount >= 5) setTilesFailed(true);
    });
    tileLayer.addTo(map);

    // Ensure Leaflet recalculates size after mount
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when pins change
  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    allPins.forEach((spot) => {
      // Only show pins with real coordinates. Skip otherwise.
      if (spot.lat == null || spot.lng == null) return;
      const lat = Number(spot.lat);
      const lng = Number(spot.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const isUser = spot.isUser;
      const bg = isUser ? C.amber : C.white;
      const fg = isUser ? C.white : C.ink;
      const border = isUser ? C.amber : C.ink;

      const html = `
        <div style="
          background:${bg};
          color:${fg};
          border:1.5px solid ${border};
          border-radius:14px;
          padding:4px 10px;
          font-family:Inter,sans-serif;
          font-size:13px;
          font-weight:700;
          white-space:nowrap;
          box-shadow:0 2px 6px rgba(0,0,0,0.15);
          cursor:pointer;
        ">$${spot.rate}</div>
      `;
      const icon = L.divIcon({
        className: 'turnout-price-pin',
        html,
        iconSize: null,
        iconAnchor: [24, 14],
      });
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.on('click', () => onSpotTap(spot));
      markersRef.current.push(marker);
    });
  }, [spots, userListings]);

  if (tilesFailed) {
    return <VanMapSVG spots={spots} userListings={userListings} onSpotTap={onSpotTap} />;
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: C.mapBg,
      }}
    />
  );
}

// ============================================================================
// VANCOUVER MAP (SVG FALLBACK)
// ============================================================================
function VanMapSVG({ spots, userListings, onSpotTap }) {
  const allPins = [
    ...spots.map(s => ({ ...s, isUser: false })),
    ...userListings.map(s => ({ ...s, isUser: true })),
  ];

  return (
    <svg viewBox="0 0 400 640" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="640" fill={C.mapBg} />

      <path d="M 0 0 L 400 0 L 400 165 Q 340 178 280 172 Q 220 168 160 160 Q 80 150 0 175 Z" fill={C.mapWater} />
      <g opacity="0.4">
        <path d="M 40 80 Q 100 75 160 82 T 320 78" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
        <path d="M 60 100 Q 120 95 180 102 T 340 98" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
        <path d="M 30 125 Q 90 120 150 127 T 310 122" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
      </g>
      <text x="200" y="60" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600" fill="#4A6B7A" letterSpacing="0.3em">
        BURRARD INLET
      </text>

      <path
        d="M -40 100 Q -20 80 20 90 Q 60 100 70 140 Q 75 180 40 220 Q 10 250 -30 260 Q -50 240 -50 200 Z"
        fill={C.mapPark}
      />
      <path
        d="M -40 100 Q -20 80 20 90 Q 60 100 70 140 Q 75 180 40 220 Q 10 250 -30 260 Q -50 240 -50 200 Z"
        fill={C.mapParkDark}
        opacity="0.3"
      />
      {[
        [0, 160], [15, 180], [-10, 200], [25, 210], [-20, 150], [35, 175],
        [5, 140], [-5, 220], [20, 195],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={C.mapParkDark} opacity="0.5" />
      ))}
      <text x="10" y="170" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="600" fill="#3A5540" letterSpacing="0.05em">
        Stanley
      </text>
      <text x="10" y="182" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="600" fill="#3A5540" letterSpacing="0.05em">
        Park
      </text>

      <g>
        {[
          [60, 240, 28, 28], [95, 240, 32, 25], [135, 240, 28, 28], [170, 240, 30, 28],
          [210, 240, 28, 28], [250, 240, 32, 28], [290, 240, 28, 28], [325, 240, 30, 28],
          [55, 295, 32, 28], [95, 295, 28, 30], [130, 295, 32, 28], [170, 295, 30, 30],
          [210, 295, 32, 28], [250, 295, 28, 30], [285, 295, 32, 28], [325, 295, 28, 30],
          [50, 350, 30, 28], [90, 350, 32, 30], [130, 350, 28, 28], [165, 350, 32, 30],
          [205, 350, 30, 28], [245, 350, 32, 30], [285, 350, 28, 28], [320, 350, 32, 30],
          [45, 405, 32, 30], [85, 405, 28, 28], [120, 405, 32, 30], [160, 405, 30, 28],
          [200, 405, 32, 30], [240, 405, 28, 28], [275, 405, 32, 30], [315, 405, 30, 28],
          [40, 460, 30, 32], [80, 460, 32, 28], [120, 460, 28, 32], [155, 460, 32, 28],
          [195, 460, 30, 32], [235, 460, 32, 28], [275, 460, 28, 32], [310, 460, 32, 28],
          [35, 515, 32, 30], [75, 515, 28, 32], [115, 515, 32, 28], [150, 515, 30, 32],
          [190, 515, 32, 28], [230, 515, 28, 32], [270, 515, 32, 28], [305, 515, 30, 32],
        ].map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x + 1.5} y={y + 1.5} width={w} height={h} fill={C.mapBuildingShadow} />
            <rect x={x} y={y} width={w} height={h} fill={C.mapBuilding} />
          </g>
        ))}
      </g>

      <g>
        {[
          { y: 200, name: 'W Cordova St', major: false },
          { y: 228, name: 'W Hastings St', major: true },
          { y: 283, name: 'W Pender St', major: false },
          { y: 338, name: 'Dunsmuir St', major: false },
          { y: 393, name: 'W Georgia St', major: true },
          { y: 448, name: 'Robson St', major: true },
          { y: 503, name: 'Smithe St', major: false },
          { y: 558, name: 'Nelson St', major: false },
          { y: 608, name: 'Pacific Blvd', major: false },
        ].map(({ y, name, major }) => (
          <g key={y}>
            <line x1="-10" y1={y} x2="410" y2={y - 8} stroke={C.mapRoad} strokeWidth={major ? 9 : 6} />
            {major && (
              <line x1="-10" y1={y} x2="410" y2={y - 8} stroke={C.mapRoadLine} strokeWidth="0.5" strokeDasharray="12,8" />
            )}
            <text
              x="10"
              y={y - 3}
              fontFamily="Inter, sans-serif"
              fontSize="7"
              fontWeight={major ? 700 : 600}
              fill={major ? "#4A4A4A" : "#8A8A8A"}
              letterSpacing="0.02em"
            >
              {name}
            </text>
          </g>
        ))}
      </g>

      <g>
        {[
          { x: 90, name: 'Bute', major: false },
          { x: 145, name: 'Thurlow', major: false },
          { x: 200, name: 'Burrard', major: true },
          { x: 255, name: 'Hornby', major: false },
          { x: 310, name: 'Howe', major: false },
          { x: 360, name: 'Granville', major: true },
        ].map(({ x, name, major }) => (
          <g key={x}>
            <line x1={x} y1="180" x2={x + 30} y2="640" stroke={C.mapRoad} strokeWidth={major ? 9 : 6} />
            {major && (
              <text
                x={x + 5}
                y="640"
                fontFamily="Inter, sans-serif"
                fontSize="7"
                fontWeight="700"
                fill="#4A4A4A"
                letterSpacing="0.02em"
              >
                {name} St
              </text>
            )}
          </g>
        ))}
      </g>

      <g>
        <rect x="235" y="185" width="60" height="20" fill={C.white} stroke="#C8C4BB" strokeWidth="1" />
        <path d="M 240 185 Q 248 170 256 185" fill={C.white} stroke="#C8C4BB" strokeWidth="1" />
        <path d="M 255 185 Q 263 170 271 185" fill={C.white} stroke="#C8C4BB" strokeWidth="1" />
        <path d="M 270 185 Q 278 170 286 185" fill={C.white} stroke="#C8C4BB" strokeWidth="1" />
        <text x="265" y="198" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="6" fontWeight="700" fill="#4A4A4A">
          CANADA PL
        </text>
      </g>

      <text x="130" y="260" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="700" fill="#8A8A8A" letterSpacing="0.2em" opacity="0.5">
        COAL HARBOUR
      </text>
      <text x="85" y="420" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="700" fill="#8A8A8A" letterSpacing="0.2em" opacity="0.5">
        WEST END
      </text>
      <text x="200" y="550" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="700" fill="#8A8A8A" letterSpacing="0.2em" opacity="0.5">
        DOWNTOWN
      </text>
      <text x="285" y="595" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="700" fill="#8A8A8A" letterSpacing="0.2em" opacity="0.5">
        YALETOWN
      </text>

      <g>
        <circle cx="245" cy="215" r="24" fill={C.amber} opacity="0.15">
          <animate attributeName="r" from="16" to="30" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="245" cy="215" r="8" fill={C.amber} stroke={C.white} strokeWidth="3" />
      </g>

      {allPins.map((spot) => (
        <g key={spot.id} style={{ cursor: 'pointer' }} onClick={() => onSpotTap(spot)}>
          <ellipse cx={spot.x + 1} cy={spot.y + 16} rx="26" ry="3" fill={C.ink} opacity="0.2" />
          <rect
            x={spot.x - 24}
            y={spot.y - 12}
            width="48"
            height="24"
            rx="12"
            fill={spot.isUser ? C.amber : C.white}
            stroke={spot.isUser ? C.amber : C.ink}
            strokeWidth="1.5"
          />
          <text
            x={spot.x}
            y={spot.y + 4}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fontWeight="700"
            fill={spot.isUser ? C.white : C.ink}
          >
            ${spot.rate}
          </text>
        </g>
      ))}

      <g transform="translate(320, 620)">
        <rect x="-42" y="-11" width="84" height="16" rx="8" fill="rgba(23,23,23,0.55)" />
        <text x="0" y="0" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="600" fill={C.white} letterSpacing="0.1em">
          REAL MAP ON LAUNCH
        </text>
      </g>
    </svg>
  );
}

// ============================================================================
// WELCOME
// ============================================================================
function Welcome({ onContinue, onStory }) {
  return (
    <div style={{ minHeight: '100%', backgroundColor: C.white, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 480, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(165deg, ${C.green} 0%, #1F5340 60%, ${C.amber} 140%)`,
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '-20%',
          width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.amber} 0%, transparent 60%)`,
          opacity: 0.3,
        }} />
        <div style={{ position: 'relative', padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <LogoMark size={40} />
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: '-0.01em' }}>
            Turnout
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 40, left: 24, right: 24 }}>
          <div style={{
            display: 'inline-block', padding: '6px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 100,
            fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 600,
            color: C.white, letterSpacing: '0.05em', marginBottom: 20,
          }}>
            ◆ NOW IN VANCOUVER
          </div>
          <div style={{
            fontFamily: '"Inter", sans-serif', fontSize: 44, fontWeight: 800,
            lineHeight: 1.02, color: C.white, letterSpacing: '-0.03em', marginBottom: 16,
          }}>
            Park anywhere.<br />
            <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400 }}>
              Or get paid
            </span>{' '}
            while you're out.
          </div>
          <div style={{
            fontFamily: '"Inter", sans-serif', fontSize: 15, color: C.white,
            opacity: 0.85, lineHeight: 1.5, maxWidth: 340,
          }}>
            The first marketplace for driveways, condo stalls, and unused parking — built by everyday people, for everyday people.
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 24px 24px' }}>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.15em', marginBottom: 12 }}>
          HOW IT WORKS
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 24 }}>
          Two ways to use Turnout.
        </div>

        <div style={{ backgroundColor: C.bg, padding: 20, borderRadius: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CarIcon size={24} color={C.white} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 2 }}>
              Find a spot in seconds
            </div>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: C.inkSoft, lineHeight: 1.4 }}>
              Skip circling. Reserve a driveway or garage near you.
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: C.bg, padding: 20, borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Home size={24} color={C.white} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 2 }}>
              Earn from your empty space
            </div>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: C.inkSoft, lineHeight: 1.4 }}>
              List your driveway or stall. Make passive income.
            </div>
          </div>
        </div>

        <div onClick={onStory} style={{
          padding: '16px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`,
          marginBottom: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.12em', marginBottom: 4 }}>
              A NOTE FROM THE FOUNDER
            </div>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 19, color: C.ink, lineHeight: 1.25 }}>
              "I had this idea ten years ago."
            </div>
          </div>
          <ArrowRight size={20} color={C.ink} strokeWidth={2} />
        </div>

        <button onClick={onContinue} style={{
          width: '100%', backgroundColor: C.ink, color: C.white, border: 'none',
          padding: '18px 24px', fontFamily: '"Inter", sans-serif', fontSize: 16, fontWeight: 700,
          cursor: 'pointer', borderRadius: 14, letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Explore Vancouver
          <ArrowRight size={18} color={C.white} strokeWidth={2.5} />
        </button>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: C.inkMute, textAlign: 'center', marginTop: 14 }}>
          Prototype · v0.4 · Coal Harbour
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FOUNDER'S NOTE
// ============================================================================
function FounderNote({ onBack }) {
  return (
    <div style={{ minHeight: '100%', backgroundColor: C.white, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center' }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: '50%', border: `1px solid ${C.line}`,
          backgroundColor: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <ChevronLeft size={22} color={C.ink} />
        </button>
      </div>
      <div style={{ padding: '12px 24px 40px', flex: 1 }}>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.15em', marginBottom: 12 }}>
          A NOTE FROM THE FOUNDER
        </div>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 48, lineHeight: 0.98, color: C.ink, letterSpacing: '-0.02em', marginBottom: 32 }}>
          Ten years.<br />One idea.<br />Finally built.
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 16, lineHeight: 1.65, color: C.inkSoft }}>
          <p style={{ marginTop: 0, marginBottom: 20 }}>
            I had this idea my freshman year at Duke, back in 2015. Parking was insane around campus, but driveways and garages all over town sat empty every day while people drove in for class. It felt obvious — why wasn't there an Airbnb for parking?
          </p>
          <p style={{ marginBottom: 20 }}>
            I paid CS majors $10,000 to build it. They only made the mockups. Never wrote the code. I gave up.
          </p>
          <p style={{ marginBottom: 20 }}>
            But I carried the idea for <strong style={{ color: C.ink }}>a decade</strong>. Every time I circled a block looking for parking, every time I walked past an empty driveway in downtown Vancouver or downtown Atlanta, I thought about it. I never learned to code. I thought it was too late.
          </p>
          <div style={{ padding: '24px 0', margin: '28px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 26, lineHeight: 1.2, color: C.ink, letterSpacing: '-0.01em' }}>
              "I believe in empowering everyday people to make more money and get closer to the American or Canadian dream with passive income."
            </div>
          </div>
          <p style={{ marginBottom: 20 }}>
            Your driveway sits empty eight hours a day while you're at work. Your condo stall is unused every weekend you're out of town. That's real money you're leaving on the table — money that could go toward rent, groceries, your kids, your savings.
          </p>
          <p style={{ marginBottom: 20 }}>
            Turnout turns your empty space into income without changing anything about your life. You don't have to do more, work harder, or sacrifice your time. You just let the space you already own work for you.
          </p>
          <p style={{ marginBottom: 20 }}>
            This prototype is the first version of a decade-old dream. It's not perfect. But it <em>exists</em>, and that's something the 2015 version of me couldn't have made happen.
          </p>
          <p style={{ marginBottom: 0 }}>
            Thanks for being here early.
          </p>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 28, color: C.green, marginTop: 24, lineHeight: 1 }}>
            Tony
          </div>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: C.inkMute, marginTop: 6, letterSpacing: '0.05em' }}>
            Founder · Vancouver, BC
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FIND VIEW
// ============================================================================
function FindView({ listings, onSpotTap }) {
  // Demo spots removed for real launch — DEMO_SPOTS constant kept for screenshots/dev only
  const allSpots = [...listings];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: C.white }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '16px 16px 12px',
        background: `linear-gradient(to bottom, ${C.mapBg} 70%, transparent 100%)`,
      }}>
        <div style={{
          backgroundColor: C.white, borderRadius: 100, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}>
          <Search size={18} color={C.ink} strokeWidth={2.5} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, fontWeight: 600, color: C.ink, lineHeight: 1.2 }}>
              Coal Harbour, Vancouver
            </div>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, color: C.inkMute, lineHeight: 1.2, marginTop: 1 }}>
              {allSpots.length} spots · Any time · Any price
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SlidersHorizontal size={16} color={C.ink} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 'calc(100vh - 180px)', paddingTop: 78, boxSizing: 'border-box' }}>
        <MapErrorBoundary childProps={{ spots: [], userListings: listings, onSpotTap }}>
          <VanMap spots={[]} userListings={listings} onSpotTap={onSpotTap} />
        </MapErrorBoundary>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 12 }}>
        <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 700, color: C.ink }}>
            {allSpots.length} spots near you
          </div>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, fontWeight: 600, color: C.amber, cursor: 'pointer' }}>
            See all →
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 12, padding: '0 16px 4px',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
        }}>
          {allSpots.slice(0, 4).map((spot) => (
            <MiniSpotCard key={spot.id} spot={spot} onTap={onSpotTap} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MINI CARD
// ============================================================================
function MiniSpotCard({ spot, onTap }) {
  return (
    <div onClick={() => onTap(spot)} style={{
      flex: '0 0 260px', backgroundColor: C.white, borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)', cursor: 'pointer',
    }}>
      <div style={{ position: 'relative', height: 130, overflow: 'hidden' }}>
        <SpotPhoto type={spot.type} variant="a" />
        <div style={{
          position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)',
        }}>
          <Heart size={14} color={C.white} strokeWidth={2.5} />
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.2, flex: 1 }}>
            {spot.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <Star size={11} fill={C.ink} color={C.ink} strokeWidth={0} />
            <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 600, color: C.ink }}>
              {spot.rating}
            </span>
          </div>
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, color: C.inkMute, marginTop: 2 }}>
          {spot.distance} · {spot.type}
        </div>
        <div style={{ marginTop: 6 }}>
          <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, fontWeight: 800, color: C.ink }}>
            ${spot.rate}
          </span>
          <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: C.inkMute, marginLeft: 2 }}>
            /hr
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SPOT DETAIL
// ============================================================================
function SpotDetail({ spot, onBack, onBook }) {
  const [hours, setHours] = useState(2);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const total = (spot.rate * hours).toFixed(2);
  const variants = ['a', 'b', 'c'];

  return (
    <div style={{ minHeight: '100%', backgroundColor: C.white, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ height: 320, position: 'relative', overflow: 'hidden' }}>
          <SpotPhoto type={spot.type} variant={variants[galleryIdx]} withCameraBadge />
        </div>
        <div style={{
          position: 'absolute', bottom: 16, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 6,
        }}>
          {variants.map((v, i) => (
            <div
              key={v}
              onClick={() => setGalleryIdx(i)}
              style={{
                width: i === galleryIdx ? 24 : 6, height: 6, borderRadius: 3,
                backgroundColor: i === galleryIdx ? C.white : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', transition: 'width 0.2s',
              }}
            />
          ))}
        </div>
        <div style={{
          position: 'absolute', bottom: 16, right: 16,
          backgroundColor: 'rgba(0,0,0,0.6)', color: C.white,
          padding: '4px 10px', borderRadius: 100,
          fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 600,
          backdropFilter: 'blur(10px)',
        }}>
          {galleryIdx + 1} / {variants.length}
        </div>
        <button onClick={onBack} style={{
          position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: '50%',
          backgroundColor: C.white, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <ChevronLeft size={22} color={C.ink} />
        </button>
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', backgroundColor: C.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <Share size={18} color={C.ink} strokeWidth={2.2} />
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', backgroundColor: C.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <Heart size={18} color={C.ink} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
        {variants.map((v, i) => (
          <div
            key={v}
            onClick={() => setGalleryIdx(i)}
            style={{
              flex: 1, height: 60, borderRadius: 8, overflow: 'hidden',
              border: i === galleryIdx ? `2px solid ${C.ink}` : `2px solid transparent`,
              cursor: 'pointer',
            }}
          >
            <SpotPhoto type={spot.type} variant={v} />
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 20px 20px', flex: 1 }}>
        <div style={{
          fontFamily: '"Inter", sans-serif', fontSize: 22, fontWeight: 800,
          color: C.ink, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 4,
        }}>
          {spot.title}
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, color: C.inkSoft, marginBottom: 10 }}>
          {spot.neighborhood} · {spot.distance} away
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <Star size={14} fill={C.ink} color={C.ink} strokeWidth={0} />
          <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 700, color: C.ink }}>
            {spot.rating}
          </span>
          <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: C.inkMute }}>
            · {spot.reviews} reviews
          </span>
        </div>

        <div style={{ height: 1, backgroundColor: C.line, marginBottom: 20 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', backgroundColor: C.green,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.white, fontFamily: '"Inter", sans-serif', fontSize: 18, fontWeight: 700,
          }}>
            {spot.host[0]}
          </div>
          <div>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 15, fontWeight: 700, color: C.ink }}>
              Hosted by {spot.host}
            </div>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: C.inkMute }}>
              {spot.hostYears} {spot.hostYears === 1 ? 'year' : 'years'} hosting
            </div>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: C.line, marginBottom: 20 }} />

        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 12, letterSpacing: '-0.01em' }}>
          About this spot
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, lineHeight: 1.55, color: C.inkSoft, marginBottom: 24 }}>
          {spot.description}
        </div>

        <div style={{ height: 1, backgroundColor: C.line, marginBottom: 20 }} />

        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 16, letterSpacing: '-0.01em' }}>
          What this spot offers
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24,
        }}>
          {spot.amenities.map((key, i) => {
            const meta = AMENITY_META[key];
            if (!meta) return null;
            const Icon = meta.Icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon size={20} color={C.inkSoft} strokeWidth={2} />
                <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: C.ink }}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ height: 1, backgroundColor: C.line, marginBottom: 20 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Clock size={18} color={C.inkSoft} strokeWidth={2} />
          <div>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 700, color: C.ink }}>
              Available
            </div>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: C.inkSoft, marginTop: 1 }}>
              {spot.available}
            </div>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: C.line, marginBottom: 20 }} />

        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontFamily: '"Inter", sans-serif', fontSize: 17, fontWeight: 700,
            color: C.ink, marginBottom: 12, letterSpacing: '-0.01em',
          }}>
            How long do you need it?
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: C.bg, padding: '14px 18px', borderRadius: 14,
          }}>
            <button onClick={() => setHours(Math.max(1, hours - 1))} style={{
              width: 40, height: 40, border: `1px solid ${C.line}`, backgroundColor: C.white,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Minus size={16} color={C.ink} strokeWidth={2.5} />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 32, fontWeight: 800, color: C.ink, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {hours}
              </div>
              <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, color: C.inkMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4, fontWeight: 600 }}>
                {hours === 1 ? 'hour' : 'hours'}
              </div>
            </div>
            <button onClick={() => setHours(Math.min(24, hours + 1))} style={{
              width: 40, height: 40, border: `1px solid ${C.line}`, backgroundColor: C.white,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Plus size={16} color={C.ink} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <div style={{
        padding: '14px 20px', borderTop: `1px solid ${C.line}`, backgroundColor: C.white,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>
            ${total}
            <span style={{ fontSize: 13, fontWeight: 500, color: C.inkMute, marginLeft: 4 }}>total</span>
          </div>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: C.inkMute, textDecoration: 'underline' }}>
            ${spot.rate} × {hours} {hours === 1 ? 'hour' : 'hours'}
          </div>
        </div>
        <button onClick={() => onBook({ ...spot, hours, total })} style={{
          backgroundColor: C.ink, color: C.white, border: 'none',
          padding: '16px 28px', fontFamily: '"Inter", sans-serif', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', borderRadius: 12, letterSpacing: '-0.01em',
        }}>
          Reserve
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRMATION
// ============================================================================
function BookingConfirm({ booking, onDone }) {
  return (
    <div style={{ minHeight: '100%', backgroundColor: C.white, display: 'flex', flexDirection: 'column', padding: '60px 24px 24px' }}>
      <div style={{ flex: 1 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', backgroundColor: C.green,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
        }}>
          <Check size={36} color={C.white} strokeWidth={2.5} />
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.15em', marginBottom: 10 }}>
          RESERVED
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 40, fontWeight: 800, color: C.ink, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 24 }}>
          You're parked.
        </div>
        <div style={{ backgroundColor: C.bg, padding: 20, borderRadius: 16, marginBottom: 20 }}>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, color: C.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
            {booking.title}
          </div>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, color: C.ink, marginBottom: 14 }}>
            {booking.address}
          </div>
          <div style={{ height: 1, backgroundColor: C.line, marginBottom: 14 }} />
          {[
            ['Duration', `${booking.hours} ${booking.hours === 1 ? 'hour' : 'hours'}`],
            ['Host', booking.host],
            ['Total paid', `$${booking.total}`],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: C.inkSoft }}>{k}</span>
              <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: C.ink, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, lineHeight: 1.5, color: C.inkMute }}>
          Prototype: no real payment was processed. Your reservation is saved under <strong style={{ color: C.ink }}>Trips</strong>.
        </div>
      </div>
      <button onClick={onDone} style={{
        backgroundColor: C.ink, color: C.white, border: 'none',
        padding: '18px 24px', fontFamily: '"Inter", sans-serif', fontSize: 16, fontWeight: 700,
        cursor: 'pointer', borderRadius: 14, marginTop: 24,
      }}>
        Done
      </button>
    </div>
  );
}

// ============================================================================
// HOST VIEW
// ============================================================================
function HostView({ listings, userId, onAdd, onSpotTap, onEdit, onDelete, onLogout }) {
  const myListings = listings.filter((s) => s.user_id && s.user_id === userId);
  const totalSpots = myListings.length;
  const estMonthly = myListings.reduce((sum, s) => sum + (s.rate * 5 * 22), 0);
  const [pendingDelete, setPendingDelete] = useState(null);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    await onDelete(id);
  };

  const actionBtnStyle = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 12px', border: `1px solid ${C.line}`, backgroundColor: C.white,
    color: C.ink, borderRadius: 10, cursor: 'pointer',
    fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 600,
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: C.white, padding: '24px 20px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.15em' }}>
          HOST
        </div>
        <button onClick={onLogout} style={{
          border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
          fontFamily: '"Inter", sans-serif', fontSize: 12, fontWeight: 600, color: C.inkMute,
          padding: '4px 8px', letterSpacing: '0.02em',
        }}>
          Log out
        </button>
      </div>
      <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 36, fontWeight: 800, color: C.ink, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 12 }}>
        {totalSpots === 0 ? (<>Your space can<br />earn you money.</>) :
          totalSpots === 1 ? (<>One spot listed.<br />Ready to earn.</>) :
            (<>{totalSpots} spots listed.<br />Ready to earn.</>)}
      </div>
      <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.5, marginBottom: 28 }}>
        {totalSpots === 0
          ? "Turn your empty driveway, condo stall, or garage into passive income. It takes 2 minutes."
          : `Estimated ${fmt(estMonthly)}/month at full utilization.`}
      </div>
      <button onClick={onAdd} style={{
        width: '100%', backgroundColor: C.ink, color: C.white, border: 'none',
        padding: '18px 24px', fontFamily: '"Inter", sans-serif', fontSize: 15, fontWeight: 700,
        cursor: 'pointer', borderRadius: 14, marginBottom: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <Plus size={20} color={C.white} strokeWidth={2.5} />
        List a spot
      </button>

      {myListings.length > 0 && (
        <div>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            Your listings
          </div>
          {myListings.map((spot) => (
            <div key={spot.id} style={{
              backgroundColor: C.white, borderRadius: 16, marginBottom: 12,
              overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            }}>
              <div onClick={() => onSpotTap(spot)} style={{ cursor: 'pointer' }}>
                <div style={{ height: 140, overflow: 'hidden' }}>
                  <SpotPhoto type={spot.type} variant="a" />
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>
                        {spot.title}
                      </div>
                      <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: C.inkMute, marginTop: 4 }}>
                        {spot.type} · {spot.available}
                      </div>
                    </div>
                    <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 18, fontWeight: 800, color: C.amber }}>
                      ${spot.rate}
                      <span style={{ fontSize: 11, color: C.inkMute, fontWeight: 500 }}>/hr</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(spot); }}
                  style={actionBtnStyle}
                >
                  <Pencil size={14} strokeWidth={2.2} /> Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDelete(spot); }}
                  style={{ ...actionBtnStyle, color: C.heart, borderColor: '#F5C2C2' }}
                >
                  <Trash2 size={14} strokeWidth={2.2} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalSpots === 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            Why host on Turnout
          </div>
          {[
            { icon: '💰', title: 'Passive income', desc: "Your space earns even when you're not there." },
            { icon: '🎯', title: "You're in control", desc: 'Set your own rate and availability.' },
            { icon: '🛡️', title: 'Host protection', desc: 'Every booking is backed by our coverage.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < 2 ? `1px solid ${C.line}` : 'none' }}>
              <div style={{ fontSize: 24, flexShrink: 0, width: 32 }}>{item.icon}</div>
              <div>
                <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, fontWeight: 700, color: C.ink }}>
                  {item.title}
                </div>
                <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: C.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <div
          onClick={() => setPendingDelete(null)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(23,23,23,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: C.white, borderRadius: 16, padding: 24, maxWidth: 360, width: '100%',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 8 }}>
              Delete this listing?
            </div>
            <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, color: C.inkSoft, lineHeight: 1.5, marginBottom: 20 }}>
              "{pendingDelete.title}" will be removed. This can't be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPendingDelete(null)}
                style={{
                  flex: 1, padding: '14px 16px', border: `1px solid ${C.line}`,
                  backgroundColor: C.white, color: C.ink, borderRadius: 12, cursor: 'pointer',
                  fontFamily: '"Inter", sans-serif', fontSize: 14, fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, padding: '14px 16px', border: 'none',
                  backgroundColor: C.heart, color: C.white, borderRadius: 12, cursor: 'pointer',
                  fontFamily: '"Inter", sans-serif', fontSize: 14, fontWeight: 700,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADD SPOT FORM
// ============================================================================
function AddSpotForm({ onCancel, onSave, initial = null }) {
  const isEdit = initial !== null;
  const [title, setTitle] = useState(initial?.title || '');
  const [address, setAddress] = useState(initial?.address || '1077 W Cordova St');
  const [rate, setRate] = useState(String(initial?.rate ?? '5'));
  const [type, setType] = useState(initial?.type || 'Underground');
  const [available, setAvailable] = useState(initial?.available || 'Mon–Fri, 8am–6pm');
  const [description, setDescription] = useState(initial?.description || '');
  const [saving, setSaving] = useState(false);

  const canSave = title && address && rate && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    // Geocode address. If it fails, save without coords (pin hidden until edited).
    const coords = await geocodeAddress(address);

    if (isEdit) {
      onSave({
        id: initial.id,
        title,
        address,
        rate: parseFloat(rate),
        type,
        available,
        description,
        lat: coords?.lat ?? initial.lat ?? null,
        lng: coords?.lng ?? initial.lng ?? null,
      });
      return;
    }
    const newSpot = {
      id: uid(), title, neighborhood: 'Coal Harbour', address,
      distance: '0.0 km', rate: parseFloat(rate), type,
      rating: 5.0, reviews: 0, host: 'You', hostYears: 0,
      description: description || 'Your spot.',
      perks: ['New', 'Flexible'],
      amenities: ['flexible', 'covered'],
      available,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      x: 245 + Math.random() * 40 - 20,
      y: 215 + Math.random() * 40 - 20,
    };
    onSave(newSpot);
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px', fontFamily: '"Inter", sans-serif', fontSize: 15,
    border: `1px solid ${C.line}`, backgroundColor: C.white, color: C.ink, borderRadius: 12,
    outline: 'none', boxSizing: 'border-box', fontWeight: 500,
  };
  const labelStyle = {
    fontFamily: '"Inter", sans-serif', fontSize: 11, color: C.inkMute,
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
    display: 'block', fontWeight: 700,
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: C.white, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onCancel} style={{
          width: 40, height: 40, border: 'none', backgroundColor: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <X size={24} color={C.ink} strokeWidth={2.2} />
        </button>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ padding: '8px 24px 20px', flex: 1 }}>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.15em', marginBottom: 10 }}>
          {isEdit ? 'EDIT LISTING' : 'NEW LISTING'}
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 32, fontWeight: 800, color: C.ink, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 28 }}>
          {isEdit ? 'Edit your spot.' : 'List a spot.'}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>What do you call it?</label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Underground Stall A" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Address</label>
          <input style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>$ per hour</label>
            <input style={inputStyle} type="number" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div style={{ flex: 1.4 }}>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
              {SPOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Available when?</label>
          <input style={inputStyle} value={available} onChange={(e) => setAvailable(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Description (optional)</label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Access instructions, size limits, anything drivers should know." />
        </div>
      </div>
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.line}` }}>
        <button onClick={handleSave} disabled={!canSave} style={{
          width: '100%', backgroundColor: canSave ? C.ink : C.line, color: C.white, border: 'none',
          padding: '18px 24px', fontFamily: '"Inter", sans-serif', fontSize: 16, fontWeight: 700,
          cursor: canSave ? 'pointer' : 'not-allowed', borderRadius: 14,
        }}>
          {isEdit ? 'Save changes' : 'Publish spot'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// TRIPS
// ============================================================================
function TripsView({ bookings }) {
  return (
    <div style={{ minHeight: '100%', backgroundColor: C.white, padding: '24px 20px 100px' }}>
      <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.15em', marginBottom: 10 }}>
        TRIPS
      </div>
      <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 36, fontWeight: 800, color: C.ink, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}>
        {bookings.length === 0 ? 'No trips yet.' : bookings.length === 1 ? 'One trip.' : `${bookings.length} trips.`}
      </div>
      {bookings.length === 0 ? (
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.5 }}>
          Reserve a spot from the map and it'll show up here. Active and past parking sessions live in this tab.
        </div>
      ) : (
        <div>
          {bookings.slice().reverse().map((b) => (
            <div key={b.id} style={{
              backgroundColor: C.white, borderRadius: 16, marginBottom: 12, overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            }}>
              <div style={{ height: 110, overflow: 'hidden' }}>
                <SpotPhoto type={b.type} variant="a" />
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 10, fontWeight: 700, color: C.amber, letterSpacing: '0.12em', marginBottom: 4 }}>
                      {new Date(b.bookedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).toUpperCase()}
                    </div>
                    <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>
                      {b.title}
                    </div>
                    <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: C.inkMute, marginTop: 4 }}>
                      {b.address} · {b.hours}h
                    </div>
                  </div>
                  <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 18, fontWeight: 800, color: C.ink }}>
                    ${b.total}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BOTTOM NAV
// ============================================================================
// ============================================================================
// AUTH (sign up / log in)
// ============================================================================
function AuthView({ onCancel, onSuccess }) {
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const isSignup = mode === 'signup';
  const canSubmit = email && password.length >= 6 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      if (isSignup) {
        const { data, error: e } = await supabase.auth.signUp({ email, password });
        if (e) { setError(e.message); return; }
        if (data?.session) {
          onSuccess();
        } else {
          setInfo("Check your email to confirm. Then come back and log in.");
          setMode('login');
          setPassword('');
        }
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) { setError(e.message); return; }
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (e) { setError(e.message); setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px', fontFamily: '"Inter", sans-serif', fontSize: 15,
    border: `1px solid ${C.line}`, backgroundColor: C.white, color: C.ink, borderRadius: 12,
    outline: 'none', boxSizing: 'border-box', fontWeight: 500,
  };
  const labelStyle = {
    fontFamily: '"Inter", sans-serif', fontSize: 11, color: C.inkMute,
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
    display: 'block', fontWeight: 700,
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: C.white, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onCancel} style={{
          width: 40, height: 40, border: 'none', backgroundColor: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <X size={24} color={C.ink} strokeWidth={2.2} />
        </button>
        <LogoMark size={28} />
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '24px 24px 32px', flex: 1 }}>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.15em', marginBottom: 10 }}>
          {isSignup ? 'JOIN TURNOUT' : 'WELCOME BACK'}
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 32, fontWeight: 800, color: C.ink, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 8 }}>
          {isSignup ? (
            <>Start{' '}<span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400 }}>earning</span>{' '}from your spot.</>
          ) : (
            <>Log in to{' '}<span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400 }}>continue</span>.</>
          )}
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, color: C.inkSoft, lineHeight: 1.5, marginBottom: 28 }}>
          {isSignup
            ? 'Create an account to list your driveway, condo stall, or garage.'
            : 'Sign in to manage your listings.'}
        </div>

        <button onClick={handleGoogle} disabled={loading} style={{
          width: '100%', backgroundColor: C.white, color: C.ink, border: `1px solid ${C.line}`,
          padding: '15px 20px', fontFamily: '"Inter", sans-serif', fontSize: 15, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 12, marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%',
            backgroundColor: '#4285F4', color: C.white,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Inter", sans-serif', fontSize: 12, fontWeight: 800,
          }}>G</span>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: C.line }} />
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: C.inkMute, fontWeight: 600 }}>or</div>
          <div style={{ flex: 1, height: 1, backgroundColor: C.line }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle} type="email" autoCapitalize="none" autoCorrect="off"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle} type="password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: '#B91C1C', marginTop: 12, padding: '10px 14px', backgroundColor: '#FEE2E2', borderRadius: 10 }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: C.green, marginTop: 12, padding: '10px 14px', backgroundColor: C.greenSoft, borderRadius: 10 }}>
            {info}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          width: '100%', backgroundColor: canSubmit ? C.ink : C.line, color: C.white, border: 'none',
          padding: '18px 24px', fontFamily: '"Inter", sans-serif', fontSize: 16, fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed', borderRadius: 14, marginTop: 20,
        }}>
          {loading ? 'Working…' : isSignup ? 'Create account' : 'Log in'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: C.inkSoft }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
          </span>{' '}
          <button onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); setInfo(''); }} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: '"Inter", sans-serif', fontSize: 13, fontWeight: 700, color: C.amber, padding: 0,
          }}>
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: 'find', label: 'Explore', Icon: Search },
    { id: 'host', label: 'Host', Icon: Home },
    { id: 'trips', label: 'Trips', Icon: Calendar },
  ];
  return (
    <div style={{
      borderTop: `1px solid ${C.line}`, backgroundColor: C.white,
      display: 'flex', justifyContent: 'space-around', padding: '10px 0 18px',
    }}>
      {tabs.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{
            border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 24px',
          }}>
            <Icon size={22} color={active ? C.amber : C.inkMute} strokeWidth={active ? 2.4 : 1.8} fill={active ? C.amber : 'none'} />
            <span style={{
              fontFamily: '"Inter", sans-serif', fontSize: 10,
              color: active ? C.amber : C.inkMute,
              fontWeight: active ? 700 : 500, letterSpacing: '0.02em',
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================
export default function Turnout() {
  useFonts();
  const [view, setView] = useState('welcome');
  const [tab, setTab] = useState('find');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [lastBooking, setLastBooking] = useState(null);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState(null);
  const [editingSpot, setEditingSpot] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_IN') {
        setView((current) => {
          if (current === 'auth') {
            setTab('host');
            return 'main';
          }
          return current;
        });
      }
      if (event === 'SIGNED_OUT') {
        setTab('find');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const o = await window.storage.get('turnout:onboarded');
        if (o && o.value === 'true') setView('main');
      } catch {}
      try {
        const l = await window.storage.get('turnout:listings');
        if (l && l.value) setListings(JSON.parse(l.value));
      } catch {}
      try {
        const b = await window.storage.get('turnout:bookings');
        if (b && b.value) setBookings(JSON.parse(b.value));
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set('turnout:listings', JSON.stringify(listings)).catch(() => {});
  }, [listings, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set('turnout:bookings', JSON.stringify(bookings)).catch(() => {});
  }, [bookings, loaded]);

  const handleWelcomeContinue = () => {
    window.storage.set('turnout:onboarded', 'true').catch(() => {});
    setView('main');
  };
  const handleSpotTap = (spot) => { setSelectedSpot(spot); setView('spot'); };
  const handleBook = (booking) => {
    const finalBooking = { ...booking, id: uid(), bookedAt: new Date().toISOString() };
    setBookings([...bookings, finalBooking]);
    setLastBooking(finalBooking);
    setView('confirm');
  };
  const handleConfirmDone = () => { setView('main'); setTab('trips'); };
  const handleAddSpot = async (spot) => {
    if (!session) { setView('auth'); return; }
    const inserted = await window.storage.insertListing(spot);
    if (inserted) {
      setListings([...listings, inserted]);
    }
    setView('main'); setTab('host');
  };
  const handleEditSpot = (spot) => {
    setEditingSpot(spot);
    setView('editSpot');
  };
  const handleSaveEdit = async (patch) => {
    const { id, ...fields } = patch;
    const updated = await window.storage.updateListing(id, fields);
    if (updated) {
      setListings(listings.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    } else {
      setListings(listings.map((l) => (l.id === id ? { ...l, ...fields } : l)));
    }
    setEditingSpot(null);
    setView('main'); setTab('host');
  };
  const handleDeleteSpot = async (id) => {
    const ok = await window.storage.deleteListing(id);
    if (ok) {
      setListings(listings.filter((l) => l.id !== id));
    }
  };
  const handleSetTab = (newTab) => {
    if (newTab === 'host' && !session) { setView('auth'); return; }
    setTab(newTab);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const containerStyle = {
    maxWidth: 440, margin: '0 auto', minHeight: '100vh', backgroundColor: C.white,
    position: 'relative', boxShadow: '0 0 60px rgba(15, 58, 46, 0.08)',
    fontFamily: '"Inter", sans-serif', color: C.ink, display: 'flex', flexDirection: 'column',
  };

  if (view === 'welcome') {
    return <div style={containerStyle}><Welcome onContinue={handleWelcomeContinue} onStory={() => setView('story')} /></div>;
  }
  if (view === 'story') {
    return <div style={containerStyle}><FounderNote onBack={() => setView('welcome')} /></div>;
  }
  if (view === 'spot' && selectedSpot) {
    return <div style={containerStyle}><SpotDetail spot={selectedSpot} onBack={() => setView('main')} onBook={handleBook} /></div>;
  }
  if (view === 'confirm' && lastBooking) {
    return <div style={containerStyle}><BookingConfirm booking={lastBooking} onDone={handleConfirmDone} /></div>;
  }
  if (view === 'addSpot') {
    return <div style={containerStyle}><AddSpotForm onCancel={() => setView('main')} onSave={handleAddSpot} /></div>;
  }
  if (view === 'editSpot' && editingSpot) {
    return <div style={containerStyle}><AddSpotForm initial={editingSpot} onCancel={() => { setEditingSpot(null); setView('main'); setTab('host'); }} onSave={handleSaveEdit} /></div>;
  }
  if (view === 'auth') {
    return <div style={containerStyle}><AuthView onCancel={() => { setView('main'); setTab('find'); }} onSuccess={() => { setView('main'); setTab('host'); }} /></div>;
  }

  return (
    <div style={containerStyle}>
      <div style={{ flex: 1, position: 'relative', overflow: 'auto', minHeight: 'calc(100vh - 78px)' }}>
        {tab === 'find' && <FindView listings={listings} onSpotTap={handleSpotTap} />}
        {tab === 'host' && <HostView listings={listings} userId={session?.user?.id} onAdd={() => setView('addSpot')} onSpotTap={handleSpotTap} onEdit={handleEditSpot} onDelete={handleDeleteSpot} onLogout={handleLogout} />}
        {tab === 'trips' && <TripsView bookings={bookings} />}
      </div>
      <BottomNav tab={tab} setTab={handleSetTab} />
    </div>
  );
}
