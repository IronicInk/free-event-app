"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import { getCategory } from "@/lib/categories";
import { SITE } from "@/lib/site";
import type { FreeEvent, LatLng } from "@/lib/types";

interface LeafletMapProps {
  /** Only events with coordinates. */
  events: FreeEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: LatLng | null;
}

/** Emoji pins as plain HTML (avoids Leaflet's default marker images, which bundlers break). */
function pinIcon(event: FreeEvent, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span class="vv-pin${selected ? " vv-pin--selected" : ""}"><span>${getCategory(event.category).emoji}</span></span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
}

/** Zooms to fit the current results whenever the set of results changes. */
function FitToEvents({ events, userLocation }: { events: FreeEvent[]; userLocation: LatLng | null }) {
  const map = useMap();
  const key = events.map((e) => e.id).join(",") + (userLocation ? "+me" : "");

  useEffect(() => {
    const points: [number, number][] = events.map((e) => [e.lat!, e.lng!]);
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(points, { padding: [48, 48], maxZoom: 14 });
    // Re-fit only when the result set changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);

  return null;
}

export default function LeafletMap({ events, selectedId, onSelect, userLocation }: LeafletMapProps) {
  // Client-only component (loaded with ssr:false), so window is available.
  const hasMouse = window.matchMedia("(pointer: fine)").matches;
  const markers = useMemo(
    () =>
      events.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat!, event.lng!]}
          icon={pinIcon(event, event.id === selectedId)}
          title={event.title}
          alt={event.title}
          zIndexOffset={event.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(event.id) }}
        />
      )),
    [events, selectedId, onSelect],
  );

  return (
    <MapContainer
      center={[SITE.mapCenter.lat, SITE.mapCenter.lng]}
      zoom={10}
      className="size-full"
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
    >
      {/* +/- buttons only for mouse users; phones pinch to zoom. Top-right, clear of the event count. */}
      {hasMouse && <ZoomControl position="topright" />}
      {/* Bottom-left, so it never sits under the floating buttons on the right. */}
      <AttributionControl position="bottomleft" prefix={false} />
      <TileLayer url={SITE.mapTiles.url} attribution={SITE.mapTiles.attribution} />
      {markers}
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={9}
          pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
        />
      )}
      <FitToEvents events={events} userLocation={userLocation} />
    </MapContainer>
  );
}
