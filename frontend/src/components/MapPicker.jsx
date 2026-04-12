import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';

// Fix for default marker icons in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const MapPicker = ({ onLocationSelect }) => {
  const [position, setPosition] = useState({ lat: 20.5937, lng: 78.9629 }); // Default center (India)
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (position) {
      onLocationSelect({
        type: 'Point',
        coordinates: [position.lng, position.lat] // MongoDB expects [long, lat]
      });
    }
  }, [position]);

  const handleLocateMe = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        alert("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-bold text-earth-700 dark:text-earth-300">Select Farm Location</p>
        <button 
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="flex items-center gap-2 text-xs font-bold text-nature-600 hover:text-nature-700 transition-colors bg-nature-50 dark:bg-nature-900/20 px-3 py-1.5 rounded-lg border border-nature-200 dark:border-nature-800"
        >
          <LocateFixed size={14} className={isLocating ? "animate-spin" : ""} />
          {isLocating ? "Locating..." : "Locate Me"}
        </button>
      </div>

      <div className="h-64 w-full rounded-2xl overflow-hidden border border-earth-200 dark:border-zinc-800 shadow-inner group">
        <MapContainer center={position} zoom={5} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
          <RecenterMap position={position} />
        </MapContainer>
      </div>
      <p className="text-[10px] text-earth-400 font-medium italic">Click on the map to pin your exact farm location.</p>
    </div>
  );
};

// Helper component to recenter map when position changes
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position);
    }
  }, [position, map]);
  return null;
};

export default MapPicker;
