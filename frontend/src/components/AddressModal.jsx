import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, X, Check } from 'lucide-react';

// Fix leaflet default icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng, label: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}` });
    }
  });
  return null;
};

const AddressModal = ({ onConfirm, onCancel }) => {
  const [address, setAddress] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);

  const detectLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          label = data.display_name || label;
        } catch (_) {}
        setAddress({ lat, lng, label });
        setMapCenter([lat, lng]);
        setIsDetecting(false);
      },
      () => { setIsDetecting(false); alert('Could not detect location. Please pin it on the map.'); }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">📍 Delivery Address</h2>
            <p className="text-zinc-400 text-sm">Where should we deliver your order?</p>
          </div>
          <button onClick={onCancel} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Map */}
        <div className="h-64 relative">
          <MapContainer center={mapCenter} zoom={12} className="h-full w-full" key={mapCenter.join(',')}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler onPick={setAddress} />
            {address && <Marker position={[address.lat, address.lng]} />}
          </MapContainer>
          <div className="absolute top-3 left-3 z-[1000] bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur-sm font-bold">
            Click map to pin location
          </div>
        </div>

        {/* Address display */}
        <div className="p-4 space-y-3">
          {address && (
            <div className="flex items-start gap-3 bg-nature-950 border border-nature-800/40 rounded-2xl p-4">
              <MapPin size={16} className="text-nature-400 mt-0.5 shrink-0" />
              <p className="text-nature-300 text-sm font-medium leading-relaxed">{address.label}</p>
            </div>
          )}

          <button
            onClick={detectLocation}
            disabled={isDetecting}
            className="w-full flex items-center justify-center gap-2 py-3 border border-zinc-700 hover:border-nature-600 text-zinc-300 hover:text-nature-300 rounded-2xl text-sm font-bold transition-all"
          >
            <Navigation size={16} className={isDetecting ? 'animate-spin' : ''} />
            {isDetecting ? 'Detecting...' : '🔍 Detect my current location'}
          </button>

          <button
            onClick={() => address && onConfirm(address)}
            disabled={!address}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all ${
              address
                ? 'bg-nature-600 hover:bg-nature-500 text-white shadow-lg shadow-nature-600/30'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Check size={16} />
            Confirm Address & Place Order
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddressModal;
