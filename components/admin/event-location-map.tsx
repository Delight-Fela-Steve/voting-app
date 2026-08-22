"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Circle, Map as LeafletMap, Marker } from "leaflet";

const MARKER_ICON = {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowSize: [41, 41] as [number, number],
};

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const POINT_ZOOM = 15;

type EventLocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
  accuracyMeters?: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
};

export function EventLocationMap({
  latitude,
  longitude,
  radiusMeters,
  accuracyMeters = null,
  onLocationChange,
}: EventLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const accuracyCircleRef = useRef<Circle | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  });

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current || mapRef.current) {
        return;
      }

      const L = leafletModule.default;
      const map = L.map(containerRef.current).setView(
        latitude !== null && longitude !== null
          ? [latitude, longitude]
          : DEFAULT_CENTER,
        latitude !== null && longitude !== null ? POINT_ZOOM : DEFAULT_ZOOM,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.icon(MARKER_ICON);

      map.on("click", (event) => {
        onLocationChangeRef.current(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;

      if (latitude !== null && longitude !== null) {
        const marker = L.marker([latitude, longitude], { icon, draggable: true }).addTo(
          map,
        );
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChangeRef.current(pos.lat, pos.lng);
        });
        markerRef.current = marker;

        circleRef.current = L.circle([latitude, longitude], {
          radius: radiusMeters ?? 0,
          color: "#6366f1",
          fillOpacity: 0.1,
        }).addTo(map);
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      accuracyCircleRef.current = null;
    };
    // Map is only initialized once; live updates are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude === null || longitude === null) {
      return;
    }

    import("leaflet").then((leafletModule) => {
      if (!mapRef.current) {
        return;
      }
      const L = leafletModule.default;
      const latLng: [number, number] = [latitude, longitude];

      if (!markerRef.current) {
        const marker = L.marker(latLng, {
          icon: L.icon(MARKER_ICON),
          draggable: true,
        }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChangeRef.current(pos.lat, pos.lng);
        });
        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng(latLng);
      }

      if (!circleRef.current) {
        circleRef.current = L.circle(latLng, {
          radius: radiusMeters ?? 0,
          color: "#6366f1",
          fillOpacity: 0.1,
        }).addTo(map);
      } else {
        circleRef.current.setLatLng(latLng);
        circleRef.current.setRadius(radiusMeters ?? 0);
      }

      if (accuracyMeters !== null && accuracyMeters > 0) {
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle(latLng, {
            radius: accuracyMeters,
            color: "#f59e0b",
            dashArray: "6 6",
            fillOpacity: 0.05,
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng(latLng);
          accuracyCircleRef.current.setRadius(accuracyMeters);
        }
        map.fitBounds(accuracyCircleRef.current.getBounds(), { maxZoom: POINT_ZOOM });
      } else if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    });
  }, [latitude, longitude, radiusMeters, accuracyMeters]);

  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-lg border border-border"
    />
  );
}
