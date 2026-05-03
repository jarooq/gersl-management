import React, { useState } from 'react';
import { MapPin, User, GraduationCap, Eye, X } from 'lucide-react';

const OrphanMapView = ({ orphans, onView }) => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // Sri Lanka districts with approximate coordinates for positioning
  const districtCoordinates = {
    'Colombo': { x: 45, y: 58, count: 0 },
    'Gampaha': { x: 42, y: 52, count: 0 },
    'Kalutara': { x: 43, y: 65, count: 0 },
    'Kandy': { x: 52, y: 55, count: 0 },
    'Matale': { x: 52, y: 48, count: 0 },
    'Nuwara Eliya': { x: 55, y: 58, count: 0 },
    'Galle': { x: 50, y: 75, count: 0 },
    'Matara': { x: 53, y: 82, count: 0 },
    'Hambantota': { x: 60, y: 80, count: 0 },
    'Jaffna': { x: 48, y: 5, count: 0 },
    'Kilinochchi': { x: 50, y: 15, count: 0 },
    'Mannar': { x: 40, y: 20, count: 0 },
    'Vavuniya': { x: 48, y: 25, count: 0 },
    'Mullaitivu': { x: 52, y: 18, count: 0 },
    'Batticaloa': { x: 68, y: 50, count: 0 },
    'Ampara': { x: 68, y: 60, count: 0 },
    'Trincomalee': { x: 62, y: 35, count: 0 },
    'Kurunegala': { x: 45, y: 45, count: 0 },
    'Puttalam': { x: 38, y: 35, count: 0 },
    'Anuradhapura': { x: 48, y: 32, count: 0 },
    'Polonnaruwa': { x: 60, y: 42, count: 0 },
    'Badulla': { x: 62, y: 62, count: 0 },
    'Monaragala': { x: 65, y: 70, count: 0 },
    'Ratnapura': { x: 50, y: 68, count: 0 },
    'Kegalle': { x: 47, y: 58, count: 0 }
  };

  // Count orphans per district
  const districtCounts = { ...districtCoordinates };
  orphans.forEach(orphan => {
    if (districtCounts[orphan.district]) {
      districtCounts[orphan.district].count++;
    }
  });

  // Get orphans for selected district
  const selectedOrphans = selectedDistrict
    ? orphans.filter(o => o.district === selectedDistrict)
    : [];

  const getMarkerSize = (count) => {
    if (count === 0) return 0;
    if (count <= 2) return 24;
    if (count <= 5) return 32;
    if (count <= 10) return 40;
    return 48;
  };

  const getMarkerColor = (count) => {
    if (count === 0) return '';
    if (count <= 2) return 'from-blue-400 to-blue-600';
    if (count <= 5) return 'from-pink-400 to-pink-600';
    if (count <= 10) return 'from-orange-400 to-orange-600';
    return 'from-red-500 to-red-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border-2 border-blue-200 relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-md z-10">
              <h3 className="text-lg font-bold text-ink-900">Sri Lanka - Orphan Distribution</h3>
              <p className="text-sm text-ink-600">{orphans.length} orphans across {Object.values(districtCounts).filter(d => d.count > 0).length} districts</p>
            </div>

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white px-4 py-3 rounded-lg shadow-md z-10">
              <p className="text-xs font-bold text-ink-700 mb-2">Orphan Count</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded-full"></div>
                  <span className="text-xs text-ink-600">1-2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-pink-50 border border-pink-200 rounded-full"></div>
                  <span className="text-xs text-ink-600">3-5</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-50 border border-orange-200 rounded-full"></div>
                  <span className="text-xs text-ink-600">6-10</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-red-50 border border-red-200 rounded-full"></div>
                  <span className="text-xs text-ink-600">10+</span>
                </div>
              </div>
            </div>

            {/* Sri Lanka Map SVG Outline */}
            <div className="relative w-full h-[600px] mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Sri Lanka outline (simplified) */}
                <path
                  d="M 45 8 Q 48 6 50 8 L 52 10 Q 54 12 52 15 L 50 20 Q 52 22 50 25 L 48 28 Q 50 30 48 33 L 50 38 Q 52 40 50 42 L 52 45 Q 54 48 52 50 L 55 52 Q 58 55 60 58 L 62 62 Q 64 65 62 68 L 60 72 Q 62 75 60 78 L 58 82 Q 56 85 54 83 L 52 80 Q 50 78 48 80 L 45 75 Q 43 73 42 70 L 40 68 Q 38 65 40 62 L 42 58 Q 40 55 42 52 L 40 48 Q 38 45 40 42 L 38 38 Q 36 35 38 32 L 40 28 Q 38 25 40 22 L 42 18 Q 40 15 42 12 L 45 8 Z"
                  fill="rgba(219, 234, 254, 0.6)"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  className="drop-shadow-card"
                />

                {/* District markers */}
                {Object.entries(districtCounts).map(([district, data]) => {
                  if (data.count === 0) return null;
                  const size = getMarkerSize(data.count);
                  const color = getMarkerColor(data.count);
                  const isSelected = selectedDistrict === district;
                  const isHovered = hoveredDistrict === district;

                  return (
                    <g key={district}>
                      <circle
                        cx={data.x}
                        cy={data.y}
                        r={size / 10}
                        className={`cursor-pointer transition-all duration-300 ${
                          isSelected || isHovered ? 'opacity-90 filter drop-shadow-lift' : 'opacity-70'
                        }`}
                        fill={`url(#gradient-${district})`}
                        stroke="white"
                        strokeWidth="0.3"
                        onClick={() => setSelectedDistrict(isSelected ? null : district)}
                        onMouseEnter={() => setHoveredDistrict(district)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                      />
                      <text
                        x={data.x}
                        y={data.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-white font-bold pointer-events-none"
                        fontSize="3"
                        fill="white"
                      >
                        {data.count}
                      </text>

                      {/* Gradient definitions */}
                      <defs>
                        <linearGradient id={`gradient-${district}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={color.includes('blue') ? '#60a5fa' : color.includes('pink') ? '#f472b6' : color.includes('orange') ? '#fb923c' : '#ef4444'} />
                          <stop offset="100%" stopColor={color.includes('blue') ? '#2563eb' : color.includes('pink') ? '#db2777' : color.includes('orange') ? '#ea580c' : '#b91c1c'} />
                        </linearGradient>
                      </defs>

                      {/* Tooltip on hover */}
                      {isHovered && (
                        <g>
                          <rect
                            x={data.x - 8}
                            y={data.y - 8}
                            width="16"
                            height="5"
                            fill="white"
                            rx="1"
                            className="drop-shadow-card"
                          />
                          <text
                            x={data.x}
                            y={data.y - 5.5}
                            textAnchor="middle"
                            className="font-bold pointer-events-none"
                            fontSize="1.8"
                            fill="#1f2937"
                          >
                            {district}
                          </text>
                          <text
                            x={data.x}
                            y={data.y - 3.5}
                            textAnchor="middle"
                            className="pointer-events-none"
                            fontSize="1.4"
                            fill="#6b7280"
                          >
                            {data.count} orphan{data.count !== 1 ? 's' : ''}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {!selectedDistrict && (
              <div className="text-center mt-4">
                <p className="text-sm text-ink-600">Click on a district marker to view orphans</p>
              </div>
            )}
          </div>
        </div>

        {/* Orphan List Section */}
        <div className="lg:col-span-1">
          {selectedDistrict ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-navy-900 text-white p-4 rounded-lg">
                <div>
                  <h3 className="text-lg font-bold">{selectedDistrict}</h3>
                  <p className="text-sm text-pink-100">{selectedOrphans.length} orphan{selectedOrphans.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => setSelectedDistrict(null)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                {selectedOrphans.map((orphan, index) => (
                  <div
                    key={orphan.id}
                    className="bg-white border border-ink-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-pink-50 border border-pink-200 text-white rounded-lg flex items-center justify-center text-lg font-bold shadow-md flex-shrink-0">
                        {orphan.fullName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-ink-900 leading-tight">{orphan.fullName}</h4>
                        <p className="text-xs text-ink-500">{orphan.age} years old</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <GraduationCap size={14} className="text-purple-500 flex-shrink-0" />
                        <span className="text-ink-700 truncate">{orphan.schoolName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <User size={14} className="text-blue-500 flex-shrink-0" />
                        <span className="text-ink-700 truncate">{orphan.guardianName}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onView(orphan)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-navy-900 text-white rounded-lg transition-all text-sm font-semibold shadow-md"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-ink-50 rounded-lg p-8 text-center h-full flex flex-col items-center justify-center border-2 border-dashed border-ink-200">
              <MapPin className="w-16 h-16 text-ink-400 mb-4" />
              <h3 className="text-lg font-bold text-ink-900 mb-2">Select a District</h3>
              <p className="text-sm text-ink-600 mb-4">Click on any district marker on the map to view orphans in that area</p>
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-ink-100">
                <p className="text-xs text-ink-500 mb-2">Quick Stats</p>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-ink-900">Total Orphans: {orphans.length}</p>
                  <p className="text-sm font-semibold text-ink-900">Districts: {Object.values(districtCounts).filter(d => d.count > 0).length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrphanMapView;
