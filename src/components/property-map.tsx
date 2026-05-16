"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  latitude: number;
  longitude: number;
  label?: string;
};

const customIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--crimson-9);
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function PropertyMap({ latitude, longitude, label }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      scrollWheelZoom: false,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(
      map,
    );
    if (label) marker.bindPopup(label);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, label]);

  return (
    <div
      ref={containerRef}
      style={{
        height: 280,
        width: "100%",
        borderRadius: "var(--radius-4)",
        overflow: "hidden",
      }}
    />
  );
}
