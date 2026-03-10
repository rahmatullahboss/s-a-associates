"use client";

import { useState, useEffect, useRef } from "react";
import * as d3geo from "d3-geo";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface Destination {
  name: string;
  flag: string;
  coordinates: [number, number]; // [longitude, latitude]
  isoCode: string;
  color: string;
  highlight: string;
}

// Bangladesh origin
const ORIGIN: [number, number] = [90.4, 23.7];
const ORIGIN_ISO = "050";

export const DESTINATIONS: Destination[] = [
  {
    name: "Malaysia",
    flag: "🇲🇾",
    coordinates: [109.5, 4.0],
    isoCode: "458",
    color: "#CC0001",
    highlight: "Most Popular",
  },
  {
    name: "United Kingdom",
    flag: "🇬🇧",
    coordinates: [-3.5, 54.0],
    isoCode: "826",
    color: "#012169",
    highlight: "Prestigious",
  },
  {
    name: "Australia",
    flag: "🇦🇺",
    coordinates: [134.0, -25.0],
    isoCode: "036",
    color: "#00843D",
    highlight: "Work-Friendly",
  },
  {
    name: "New Zealand",
    flag: "🇳🇿",
    coordinates: [172.0, -42.0],
    isoCode: "554",
    color: "#00247D",
    highlight: "Peaceful",
  },
  {
    name: "South Korea",
    flag: "🇰🇷",
    coordinates: [127.5, 36.5],
    isoCode: "410",
    color: "#C60C30",
    highlight: "Tech Hub",
  },
  {
    name: "Ireland",
    flag: "🇮🇪",
    coordinates: [-8.2, 53.1],
    isoCode: "372",
    color: "#169B62",
    highlight: "Emerging Hub",
  },
];

interface GeoFeature {
  type: string;
  id: string | number;
  properties: Record<string, unknown>;
  geometry: GeoJSON.Geometry;
}

interface Props {
  selected: Destination;
  onSelect: (dest: Destination) => void;
}

// Build a quadratic bezier arc between two SVG points (curves upward)
function buildArcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  // Control point pulled "up" (negative y) proportional to distance
  const offset = Math.min(len * 0.35, 110);
  const cx = mx - (dy / len) * offset * 0.3;
  const cy = my - Math.abs(dx / len) * offset - offset * 0.2;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export function InteractiveWorldMap({ selected, onSelect }: Props) {
  const [countries, setCountries] = useState<GeoFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [animKey, setAnimKey] = useState(0);
  const prevIso = useRef(selected.isoCode);

  const WIDTH = 800;
  const HEIGHT = 450;

  const projection = d3geo
    .geoMercator()
    .scale(180)
    .center([70, 18])
    .translate([WIDTH / 2, HEIGHT / 2]);

  const pathGenerator = d3geo.geoPath().projection(projection);

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((topology: Topology) => {
        const geojson = topojson.feature(
          topology,
          topology.objects.countries as GeometryCollection
        );
        if (geojson.type === "FeatureCollection") {
          setCountries(geojson.features as GeoFeature[]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Retrigger dash animation on destination change
  useEffect(() => {
    if (prevIso.current !== selected.isoCode) {
      prevIso.current = selected.isoCode;
      setAnimKey((k) => k + 1);
    }
  }, [selected.isoCode]);

  const project = (coords: [number, number]): [number, number] => {
    const p = projection(coords);
    return p ? [p[0], p[1]] : [WIDTH / 2, HEIGHT / 2];
  };

  const [ox, oy] = project(ORIGIN);
  const [dx, dy] = project(selected.coordinates);
  const arcPath = buildArcPath(ox, oy, dx, dy);

  const getCountryFill = (isoNum: string) => {
    if (isoNum === selected.isoCode) return selected.color;
    if (isoNum === ORIGIN_ISO) return "#F26522";
    const dest = DESTINATIONS.find((d) => d.isoCode === isoNum);
    if (dest) return dest.color + "55";
    return "#CBD5E1";
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{ background: "transparent" }}
      >
        <defs>
          {/* Arc gradient: origin color → destination color */}
          <linearGradient id={`arcGrad-${animKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0" />
            <stop offset="40%" stopColor="#1E293B" stopOpacity="1" />
            <stop offset="100%" stopColor={selected.color} stopOpacity="1" />
          </linearGradient>
          {/* Glow filter — same as original */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="destGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Country fills */}
        {countries.map((feature) => {
          const isoNum = String(feature.id);
          const isSelected = isoNum === selected.isoCode;
          const isDest = DESTINATIONS.some((d) => d.isoCode === isoNum);
          const pathD = pathGenerator(feature as unknown as d3geo.GeoPermissibleObjects);
          if (!pathD) return null;

          return (
            <path
              key={isoNum}
              d={pathD}
              fill={getCountryFill(isoNum)}
              stroke="#FFFFFF"
              strokeWidth={isSelected ? 1.2 : 0.5}
              style={{
                cursor: isDest ? "pointer" : "default",
                transition: "fill 0.4s ease",
                filter: isSelected ? `drop-shadow(0 0 6px ${selected.color}99)` : "none",
              }}
              onClick={() => {
                const dest = DESTINATIONS.find((d) => d.isoCode === isoNum);
                if (dest) onSelect(dest);
              }}
            />
          );
        })}

        {/* ── Animated arc path (path-dash class = original dashing animation) ── */}
        <g key={`arc-${animKey}`}>
          <path
            className="path-dash"
            d={arcPath}
            fill="none"
            stroke={`url(#arcGrad-${animKey})`}
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#glow)"
          />
        </g>

        {/* Origin dot: Bangladesh — pulsing like original */}
        <g transform={`translate(${ox}, ${oy})`}>
          <circle fill="#1E293B" r={4}>
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r={5} fill="#F26522" stroke="#FFFFFF" strokeWidth={2} />
          <text textAnchor="middle" y={-11} fontSize={11} style={{ pointerEvents: "none", userSelect: "none" }}>
            🇧🇩
          </text>
        </g>

        {/* Destination dot — like original orange destination dot */}
        <g key={`dest-${selected.isoCode}-${animKey}`} transform={`translate(${dx}, ${dy})`}>
          {/* Pulse ring */}
          <circle fill={selected.color} fillOpacity={0.15} r={18}>
            <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Main dot */}
          <circle
            r={6}
            fill={selected.color}
            stroke="white"
            strokeWidth={2}
            filter="url(#destGlow)"
          />
          {/* Flag */}
          <text textAnchor="middle" y={-12} fontSize={13} style={{ pointerEvents: "none", userSelect: "none" }}>
            {selected.flag}
          </text>
        </g>

        {/* Other destination markers (dimmed, clickable) */}
        {DESTINATIONS.filter((d) => d.isoCode !== selected.isoCode).map((dest) => {
          const [mx, my] = project(dest.coordinates);
          return (
            <g
              key={`dim-${dest.isoCode}`}
              transform={`translate(${mx}, ${my})`}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(dest)}
            >
              <circle r={4} fill="#64748B" stroke="#FFFFFF" strokeWidth={1.5} />
              <text textAnchor="middle" y={-9} fontSize={10} style={{ pointerEvents: "none", userSelect: "none" }}>
                {dest.flag}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
