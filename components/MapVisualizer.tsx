import React, { useMemo } from 'react';
import { ItineraryItem, TransportType, NearbyTraveler } from '../types';
import { MapPin, Plane, Car, Bus, Train, User } from 'lucide-react';

interface MapVisualizerProps {
  items: ItineraryItem[];
  nearbyTravelers?: NearbyTraveler[];
  className?: string;
}

const MapVisualizer: React.FC<MapVisualizerProps> = ({ items, nearbyTravelers = [], className }) => {
  // Filter only place items to create nodes
  const places = useMemo(() => items.filter(i => i.type === 'place'), [items]);
  
  // Generate pseud-coordinates for visualization since we might not have real geo-data for everything
  const nodes = useMemo(() => {
    return places.map((place, index) => {
        const angle = (index / places.length) * 2 * Math.PI;
        const radius = 35;
        const x = 50 + radius * Math.cos(angle); 
        const y = 50 + radius * Math.sin(angle);
        return { ...place, x, y };
    });
  }, [places]);

  if (places.length === 0) return <div className="bg-gray-200 w-full h-48 flex items-center justify-center text-gray-500">No route data</div>;

  return (
    <div className={`relative bg-blue-50 rounded-xl overflow-hidden border border-blue-100 ${className}`}>
        <div className="absolute top-2 left-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-blue-800 shadow-sm z-10 flex items-center gap-1">
            <MapPin size={10} />
            {nearbyTravelers.length > 0 ? `Live Map (${nearbyTravelers.length} travelers nearby)` : 'Offline Map View'}
        </div>
      <svg viewBox="0 0 100 100" className="w-full h-full p-4">
        {/* Draw Paths */}
        <path
          d={`M ${nodes.map(n => `${n.x},${n.y}`).join(' L ')}`}
          fill="none"
          stroke="#94A3B8"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
        
        {/* Draw Nodes */}
        {nodes.map((node, i) => (
          <g key={node.id}>
             <circle cx={node.x} cy={node.y} r="6" fill="white" stroke="#5E35B1" strokeWidth="2" />
             <text x={node.x} y={node.y + 1.5} fontSize="4" textAnchor="middle" fill="#374151" className="font-semibold">{i + 1}</text>
          </g>
        ))}

        {/* Draw Nearby Travelers */}
        {nearbyTravelers.map((traveler) => {
           // Random position for simulation if lat/lng not projected
           const tx = 50 + (Math.random() * 60 - 30);
           const ty = 50 + (Math.random() * 60 - 30);
           return (
             <g key={traveler.id}>
                <circle cx={tx} cy={ty} r="4" fill="#00BFA5" stroke="white" strokeWidth="1" className="animate-pulse" />
                <image href={traveler.avatar} x={tx-2} y={ty-2} height="4" width="4" clipPath="circle" />
             </g>
           );
        })}
      </svg>
    </div>
  );
};

export default MapVisualizer;