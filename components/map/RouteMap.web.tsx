import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stop } from '@/types';
import { COLORS } from '@/constants';

interface RouteMapProps {
  stops: Stop[];
  currentLocation?: { lat: number; lng: number } | null;
  activeStopIndex?: number;
  height?: number;
}

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export function RouteMap({ stops, currentLocation, activeStopIndex = 0, height = 220 }: RouteMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) updateMap();
  }, [stops, currentLocation, activeStopIndex]);

  function loadGoogleMaps() {
    if ((window as any).google?.maps) { initMap(); return; }
    const existing = document.getElementById('google-maps-script');
    if (existing) { existing.addEventListener('load', initMap); return; }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }

  function initMap() {
    if (!mapRef.current || !(window as any).google) return;
    const center = currentLocation
      ? { lat: currentLocation.lat, lng: currentLocation.lng }
      : stops.length > 0
      ? { lat: stops[0].lat, lng: stops[0].lng }
      : { lat: 19.9975, lng: 73.7898 };

    mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d2d7' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
    });
    updateMap();
  }

  function updateMap() {
    const google = (window as any).google;
    if (!google || !mapInstanceRef.current) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) polylineRef.current.setMap(null);

    const coords: any[] = [];

    if (currentLocation) {
      coords.push({ lat: currentLocation.lat, lng: currentLocation.lng });
      new google.maps.Marker({
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
    }

    stops.forEach((stop, i) => {
      const pos = { lat: stop.lat, lng: stop.lng };
      coords.push(pos);
      const isDone = stop.status === 'delivered';
      const isActive = i === activeStopIndex && stop.status === 'pending';

      const marker = new google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        label: {
          text: isDone ? '✓' : `${i + 1}`,
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isActive ? 18 : 14,
          fillColor: isDone ? '#10B981' : isActive ? '#F5A623' : '#0B1120',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        title: stop.customer_name,
      });
      markersRef.current.push(marker);
    });

    if (coords.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path: coords,
        geodesic: true,
        strokeColor: '#F5A623',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        icons: [{
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: '#F5A623', fillOpacity: 1 },
          offset: '50%',
          repeat: '80px',
        }],
      });
      polylineRef.current.setMap(mapInstanceRef.current);
    }

    if (coords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      coords.forEach(c => bounds.extend(c));
      mapInstanceRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }

  return (
  <div style={{
    height,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: '#f1f5f9',
  }}>
    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
  </div>
);
}

const styles = StyleSheet.create({
  container: { borderRadius: 20, overflow: 'hidden', marginHorizontal: 20 },
});