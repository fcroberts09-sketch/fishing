import React, { useState, useEffect } from 'react';
import { MapPin, Anchor, Wind, Droplets, Sun, Moon, Users, Navigation, Star, Fish, Clock, DollarSign, ChevronRight, Plus, Heart, Share2, MessageCircle, Compass, Waves, CloudRain, Thermometer, Eye, Search, Menu, X, User, Settings, Bell, Calendar, Trophy, Target, Boat } from 'lucide-react';

// Custom boat icon component
const BoatIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20l2-2h16l2 2"/>
    <path d="M4 18l2-9h12l2 9"/>
    <path d="M12 9V3"/>
    <path d="M8 9l4-6 4 6"/>
  </svg>
);

// Kayak icon component
const KayakIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="12" rx="10" ry="3"/>
    <line x1="2" y1="12" x2="4" y2="12"/>
    <line x1="20" y1="12" x2="22" y2="12"/>
    <circle cx="12" cy="12" r="1"/>
  </svg>
);

// Wade fishing icon
const WadeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2"/>
    <path d="M12 6v4"/>
    <path d="M8 10h8"/>
    <path d="M10 10l-2 8"/>
    <path d="M14 10l2 8"/>
    <path d="M6 22c2-2 4-4 6-4s4 2 6 4"/>
  </svg>
);

export default function TexasFishingPlatform() {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedBay, setSelectedBay] = useState('matagorda');
  const [filterType, setFilterType] = useState('all');
  const [showNavAnimation, setShowNavAnimation] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);

  // Simulated weather data
  const weatherData = {
    temp: 78,
    wind: { speed: 12, direction: 'SE' },
    conditions: 'Partly Cloudy',
    humidity: 65,
    visibility: 10
  };

  // Simulated tide data
  const tideData = {
    current: 'Rising',
    high: '2:34 PM',
    low: '8:47 AM',
    height: 1.8
  };

  // Bay locations
  const bays = [
    { id: 'matagorda', name: 'Matagorda Bay', coords: { x: 35, y: 55 } },
    { id: 'galveston', name: 'Galveston Bay', coords: { x: 65, y: 35 } },
    { id: 'corpus', name: 'Corpus Christi Bay', coords: { x: 25, y: 75 } },
    { id: 'sabine', name: 'Sabine Lake', coords: { x: 85, y: 20 } },
    { id: 'aransas', name: 'Aransas Bay', coords: { x: 30, y: 68 } },
  ];

  // Access points
  const accessPoints = [
    { id: 1, type: 'boat', name: 'Matagorda Harbor', bay: 'matagorda', coords: { x: 32, y: 52 }, rating: 4.8, reviews: 124 },
    { id: 2, type: 'kayak', name: 'Sunrise Kayak Launch', bay: 'matagorda', coords: { x: 38, y: 58 }, rating: 4.5, reviews: 67 },
    { id: 3, type: 'wade', name: 'Shell Island Wade Spot', bay: 'matagorda', coords: { x: 40, y: 54 }, rating: 4.9, reviews: 203 },
    { id: 4, type: 'boat', name: 'Galveston Yacht Basin', bay: 'galveston', coords: { x: 62, y: 32 }, rating: 4.6, reviews: 89 },
    { id: 5, type: 'wade', name: 'East Bay Flats', bay: 'galveston', coords: { x: 68, y: 38 }, rating: 4.7, reviews: 156 },
    { id: 6, type: 'kayak', name: 'Clear Creek Launch', bay: 'galveston', coords: { x: 70, y: 30 }, rating: 4.4, reviews: 45 },
  ];

  // Hot spots
  const hotSpots = [
    { id: 1, name: 'Redfish Alley', bay: 'matagorda', coords: { x: 36, y: 56 }, species: ['Redfish', 'Speckled Trout'], expert: 'Captain Mike', conditions: 'Best on incoming tide, SE wind under 15mph' },
    { id: 2, name: 'Bird Island Flat', bay: 'matagorda', coords: { x: 42, y: 53 }, species: ['Flounder', 'Black Drum'], expert: 'Local Legends Guide Service', conditions: 'Early morning, use live shrimp' },
    { id: 3, name: 'Texas City Dike', bay: 'galveston', coords: { x: 64, y: 36 }, species: ['Redfish', 'Sheepshead'], expert: 'Capt. Sarah J.', conditions: 'All tides, structure fishing' },
  ];

  // Boat share listings
  const boatListings = [
    { id: 1, captain: 'Mike Rodriguez', boat: '22ft Bay Boat', capacity: 4, available: 3, date: 'Tomorrow', time: '5:30 AM', area: 'Matagorda Bay', requirements: ['$30 gas contribution', 'Bring own tackle'], experience: 'Intermediate', rating: 4.9, trips: 47, avatar: '🎣' },
    { id: 2, captain: 'Sarah Chen', boat: '18ft Flats Boat', capacity: 3, available: 2, date: 'Saturday', time: '6:00 AM', area: 'East Galveston Bay', requirements: ['$25 gas contribution'], experience: 'Any level welcome', rating: 4.8, trips: 32, avatar: '🐟' },
    { id: 3, captain: 'James Wilson', boat: '24ft Center Console', capacity: 5, available: 4, date: 'Sunday', time: '5:00 AM', area: 'Aransas Pass', requirements: ['$40 gas contribution', 'Intermediate+'], experience: 'Experienced', rating: 5.0, trips: 89, avatar: '⚓' },
  ];

  // Navigation route animation steps
  const routeSteps = [
    { title: 'Launch from Matagorda Harbor', description: 'Exit the marina heading east through the main channel', coords: { x: 32, y: 52 } },
    { title: 'Enter ICW', description: 'Turn south at marker 12 to enter the Intracoastal Waterway', coords: { x: 34, y: 54 } },
    { title: 'Follow ICW East', description: 'Stay between the red and green markers, depth 8-12ft', coords: { x: 37, y: 55 } },
    { title: 'Bay Entry Point', description: 'Exit ICW at marker 28, heading north into Matagorda Bay', coords: { x: 40, y: 53 } },
    { title: 'Navigate the Flats', description: 'Follow the deeper water indicated by the oyster reefs. Stay left of the spoil islands.', coords: { x: 42, y: 51 } },
  ];

  useEffect(() => {
    if (showNavAnimation) {
      const timer = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % routeSteps.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [showNavAnimation]);

  const getFilteredPoints = () => {
    let points = accessPoints.filter(p => p.bay === selectedBay);
    if (filterType !== 'all') {
      points = points.filter(p => p.type === filterType);
    }
    return points;
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'boat': return <BoatIcon className="w-4 h-4" />;
      case 'kayak': return <KayakIcon className="w-4 h-4" />;
      case 'wade': return <WadeIcon className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'boat': return 'bg-blue-500';
      case 'kayak': return 'bg-emerald-500';
      case 'wade': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        
        .gradient-border {
          background: linear-gradient(135deg, #0ea5e9, #06b6d4, #14b8a6);
          padding: 2px;
          border-radius: 12px;
        }
        
        .map-grid {
          background-image: 
            linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .water-pattern {
          background: 
            radial-gradient(ellipse at 30% 40%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
            linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        }
        
        .glow-cyan {
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.3), 0 0 40px rgba(6, 182, 212, 0.1);
        }
        
        .pulse-marker {
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        
        .route-line {
          stroke-dasharray: 8 4;
          animation: dash 1s linear infinite;
        }
        
        @keyframes dash {
          to { stroke-dashoffset: -12; }
        }
        
        .wave-bg {
          background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 2px,
            rgba(6, 182, 212, 0.03) 2px,
            rgba(6, 182, 212, 0.03) 4px
          );
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.15);
        }
        
        .nav-animation-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawPath 3s ease forwards;
        }
        
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center">
                <Fish className="w-6 h-6 text-slate-900" />
              </div>
              <Waves className="w-4 h-4 text-cyan-400 absolute -bottom-1 -right-1" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Mono', monospace" }}>
                TEXAS<span className="text-cyan-400">TIDES</span>
              </h1>
              <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest">Coastal Fishing Guide</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            {['Map', 'Launches', 'Hotspots', 'Navigation', 'BoatShare', 'Community'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`text-sm font-medium transition-all ${
                  activeTab === tab.toLowerCase() 
                    ? 'text-cyan-400' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <Bell className="w-4 h-4 text-slate-400" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-sm font-bold">
              JD
            </div>
            <button 
              className="md:hidden w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-cyan-500/20 p-4 fade-in">
            <nav className="flex flex-col gap-2">
              {['Map', 'Launches', 'Hotspots', 'Navigation', 'BoatShare', 'Community'].map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab.toLowerCase()); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.toLowerCase() 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Weather & Tide Bar */}
        <div className="bg-slate-800/50 border-b border-cyan-500/10 py-3">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center gap-4 md:gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">{weatherData.temp}°F</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">{weatherData.wind.speed} mph {weatherData.wind.direction}</span>
            </div>
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-teal-400" />
              <span className="text-slate-300">{tideData.current}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">High: {tideData.high}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">{weatherData.visibility} mi vis</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-cyan-400">
              <Sun className="w-4 h-4" />
              <span>{weatherData.conditions}</span>
            </div>
          </div>
        </div>

        {/* Map View Tab */}
        {(activeTab === 'map' || activeTab === 'launches' || activeTab === 'hotspots') && (
          <div className="max-w-7xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Map Area */}
              <div className="lg:col-span-2">
                <div className="gradient-border">
                  <div className="bg-slate-900 rounded-[10px] overflow-hidden">
                    {/* Map Controls */}
                    <div className="p-3 border-b border-slate-700 flex flex-wrap items-center gap-2">
                      <select 
                        value={selectedBay}
                        onChange={(e) => setSelectedBay(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                      >
                        {bays.map(bay => (
                          <option key={bay.id} value={bay.id}>{bay.name}</option>
                        ))}
                      </select>
                      
                      <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                        {[
                          { id: 'all', label: 'All', icon: <MapPin className="w-3 h-3" /> },
                          { id: 'boat', label: 'Boat', icon: <BoatIcon className="w-3 h-3" /> },
                          { id: 'kayak', label: 'Kayak', icon: <KayakIcon className="w-3 h-3" /> },
                          { id: 'wade', label: 'Wade', icon: <WadeIcon className="w-3 h-3" /> },
                        ].map(filter => (
                          <button
                            key={filter.id}
                            onClick={() => setFilterType(filter.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              filterType === filter.id 
                                ? 'bg-cyan-500 text-slate-900' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {filter.icon}
                            <span className="hidden sm:inline">{filter.label}</span>
                          </button>
                        ))}
                      </div>
                      
                      <button className="ml-auto flex items-center gap-2 bg-cyan-500/20 text-cyan-400 px-3 py-2 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Spot</span>
                      </button>
                    </div>
                    
                    {/* Map */}
                    <div className="relative h-[400px] md:h-[500px] water-pattern map-grid overflow-hidden">
                      {/* Coastline illustration */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#1e293b" />
                          </linearGradient>
                          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.1)" />
                            <stop offset="100%" stopColor="rgba(14, 165, 233, 0.05)" />
                          </linearGradient>
                        </defs>
                        
                        {/* Land mass */}
                        <path 
                          d="M0,0 L100,0 L100,25 C80,30 60,20 40,35 C30,42 25,48 20,55 C15,62 10,70 0,75 Z" 
                          fill="url(#landGrad)"
                        />
                        
                        {/* Water with subtle pattern */}
                        <path 
                          d="M0,75 C10,70 15,62 20,55 C25,48 30,42 40,35 C60,20 80,30 100,25 L100,100 L0,100 Z" 
                          fill="url(#waterGrad)"
                        />
                        
                        {/* Bay indentations */}
                        <ellipse cx="35" cy="55" rx="15" ry="10" fill="rgba(6, 182, 212, 0.08)" />
                        <ellipse cx="65" cy="35" rx="12" ry="8" fill="rgba(6, 182, 212, 0.08)" />
                        
                        {/* ICW line */}
                        <path 
                          d="M5,65 Q30,60 50,58 Q70,56 95,60" 
                          fill="none" 
                          stroke="rgba(6, 182, 212, 0.3)" 
                          strokeWidth="0.5"
                          strokeDasharray="2 1"
                        />
                        <text x="50" y="62" fill="rgba(6, 182, 212, 0.4)" fontSize="2" textAnchor="middle">ICW</text>
                      </svg>
                      
                      {/* Access Points */}
                      {getFilteredPoints().map(point => (
                        <button
                          key={point.id}
                          onClick={() => setSelectedSpot(point)}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group`}
                          style={{ left: `${point.coords.x}%`, top: `${point.coords.y}%` }}
                        >
                          <div className={`w-8 h-8 rounded-full ${getTypeColor(point.type)} flex items-center justify-center text-white shadow-lg pulse-marker`}>
                            {getTypeIcon(point.type)}
                          </div>
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="bg-slate-800 px-2 py-1 rounded text-xs">{point.name}</div>
                          </div>
                        </button>
                      ))}
                      
                      {/* Hot Spots */}
                      {activeTab === 'hotspots' && hotSpots.filter(h => h.bay === selectedBay).map(spot => (
                        <button
                          key={spot.id}
                          onClick={() => setSelectedSpot(spot)}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group"
                          style={{ left: `${spot.coords.x}%`, top: `${spot.coords.y}%` }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg glow-cyan">
                            <Target className="w-5 h-5" />
                          </div>
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="bg-slate-800 px-2 py-1 rounded text-xs">{spot.name}</div>
                          </div>
                        </button>
                      ))}
                      
                      {/* Scale indicator */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-16 h-0.5 bg-slate-600" />
                        <span>5 mi</span>
                      </div>
                      
                      {/* Compass */}
                      <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                        <Compass className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Side Panel */}
              <div className="space-y-4">
                {/* Selected Spot Details */}
                {selectedSpot && (
                  <div className="bg-slate-800 rounded-xl p-4 border border-cyan-500/20 glow-cyan fade-in">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedSpot.name}</h3>
                        {selectedSpot.type && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${getTypeColor(selectedSpot.type)} mt-1`}>
                            {getTypeIcon(selectedSpot.type)}
                            {selectedSpot.type.charAt(0).toUpperCase() + selectedSpot.type.slice(1)} Access
                          </span>
                        )}
                        {selectedSpot.species && (
                          <div className="flex gap-1 mt-2">
                            {selectedSpot.species.map(s => (
                              <span key={s} className="px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded text-xs">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => setSelectedSpot(null)} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {selectedSpot.rating && (
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium">{selectedSpot.rating}</span>
                        <span className="text-slate-500">({selectedSpot.reviews} reviews)</span>
                      </div>
                    )}
                    
                    {selectedSpot.conditions && (
                      <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-slate-300">
                          <span className="text-cyan-400 font-medium">Pro Tip:</span> {selectedSpot.conditions}
                        </p>
                        {selectedSpot.expert && (
                          <p className="text-xs text-slate-500 mt-1">— {selectedSpot.expert}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button className="flex-1 bg-cyan-500 text-slate-900 font-medium py-2 rounded-lg hover:bg-cyan-400 transition-colors">
                        Navigate Here
                      </button>
                      <button className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600 transition-colors">
                        <Heart className="w-4 h-4" />
                      </button>
                      <button className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Quick Access List */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    {activeTab === 'hotspots' ? 'Local Hotspots' : 'Access Points'}
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {(activeTab === 'hotspots' 
                      ? hotSpots.filter(h => h.bay === selectedBay)
                      : getFilteredPoints()
                    ).map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedSpot(item)}
                        className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors card-hover"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${item.type ? getTypeColor(item.type) : 'bg-gradient-to-br from-amber-400 to-orange-500'} flex items-center justify-center`}>
                            {item.type ? getTypeIcon(item.type) : <Target className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            {item.rating && (
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                {item.rating}
                              </div>
                            )}
                            {item.species && (
                              <p className="text-xs text-slate-400 truncate">{item.species.join(', ')}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Today's Conditions */}
                <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl p-4 border border-cyan-500/30">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Waves className="w-4 h-4 text-cyan-400" />
                    Fishing Conditions
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Rating</span>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`w-3 h-3 rounded-full ${i <= 4 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        ))}
                        <span className="ml-2 text-emerald-400 font-medium">Good</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Best Time</span>
                      <span className="text-sm font-medium">5:30 AM - 9:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Recommended</span>
                      <span className="text-sm font-medium text-cyan-400">Topwater, Soft Plastics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tab */}
        {activeTab === 'navigation' && (
          <div className="max-w-7xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="gradient-border">
                  <div className="bg-slate-900 rounded-[10px] overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-cyan-400" />
                        Bay Navigation Guide
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">Interactive routes to avoid running aground</p>
                    </div>
                    
                    <div className="relative h-[500px] water-pattern map-grid">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Land and water */}
                        <defs>
                          <linearGradient id="navLandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#1e293b" />
                          </linearGradient>
                        </defs>
                        
                        <path 
                          d="M0,0 L100,0 L100,25 C80,30 60,20 40,35 C30,42 25,48 20,55 C15,62 10,70 0,75 Z" 
                          fill="url(#navLandGrad)"
                        />
                        
                        {/* Shallow areas */}
                        <ellipse cx="45" cy="48" rx="8" ry="5" fill="rgba(251, 191, 36, 0.2)" />
                        <ellipse cx="50" cy="60" rx="10" ry="6" fill="rgba(251, 191, 36, 0.2)" />
                        <text x="45" y="49" fill="rgba(251, 191, 36, 0.6)" fontSize="2" textAnchor="middle">SHALLOW</text>
                        
                        {/* Navigation route */}
                        {showNavAnimation && (
                          <>
                            <path 
                              d="M32,52 L34,54 L37,55 L40,53 L42,51"
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="0.8"
                              className="route-line"
                            />
                            
                            {/* Route markers */}
                            {routeSteps.map((step, i) => (
                              <g key={i}>
                                <circle 
                                  cx={step.coords.x} 
                                  cy={step.coords.y} 
                                  r={animationStep === i ? 2 : 1.5}
                                  fill={animationStep === i ? '#06b6d4' : '#64748b'}
                                  className={animationStep === i ? 'pulse-marker' : ''}
                                />
                                <text 
                                  x={step.coords.x} 
                                  y={step.coords.y - 3} 
                                  fill={animationStep === i ? '#06b6d4' : '#64748b'}
                                  fontSize="2"
                                  textAnchor="middle"
                                >
                                  {i + 1}
                                </text>
                              </g>
                            ))}
                          </>
                        )}
                        
                        {/* Channel markers */}
                        <circle cx="33" cy="53" r="0.8" fill="#ef4444" />
                        <circle cx="35" cy="54.5" r="0.8" fill="#22c55e" />
                        <circle cx="38" cy="54" r="0.8" fill="#ef4444" />
                        <circle cx="41" cy="52" r="0.8" fill="#22c55e" />
                      </svg>
                      
                      {!showNavAnimation && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button 
                            onClick={() => setShowNavAnimation(true)}
                            className="bg-cyan-500 text-slate-900 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-cyan-400 transition-all glow-cyan"
                          >
                            <Navigation className="w-5 h-5" />
                            Start Navigation Guide
                          </button>
                        </div>
                      )}
                      
                      {/* Legend */}
                      <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-lg p-3 text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span>Red Marker - Pass on Right</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>Green Marker - Pass on Left</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-3 bg-amber-500/30 rounded" />
                          <span>Shallow Area - Avoid</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Steps */}
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    Route: Matagorda Harbor to Bay
                  </h3>
                  
                  <div className="space-y-3">
                    {routeSteps.map((step, i) => (
                      <div 
                        key={i}
                        className={`p-3 rounded-lg transition-all ${
                          animationStep === i && showNavAnimation
                            ? 'bg-cyan-500/20 border border-cyan-500/40'
                            : 'bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            animationStep === i && showNavAnimation
                              ? 'bg-cyan-500 text-slate-900'
                              : 'bg-slate-600'
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{step.title}</p>
                            <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {showNavAnimation && (
                    <button 
                      onClick={() => { setShowNavAnimation(false); setAnimationStep(0); }}
                      className="w-full mt-4 py-2 border border-slate-600 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                    >
                      Reset Animation
                    </button>
                  )}
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <h4 className="font-medium text-amber-400 flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4" />
                    Safety Notes
                  </h4>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li>• Watch for oyster reefs near markers 24-28</li>
                    <li>• Maintain idle speed in no-wake zones</li>
                    <li>• Check tide levels before crossing flats</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BoatShare Tab */}
        {activeTab === 'boatshare' && (
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">BoatShare</h2>
                <p className="text-slate-400">Find open spots on local boats or offer yours</p>
              </div>
              <button className="bg-cyan-500 text-slate-900 font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-400 transition-colors">
                <Plus className="w-4 h-4" />
                Post Your Boat
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boatListings.map(listing => (
                <div key={listing.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 card-hover">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-2xl">
                          {listing.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold">{listing.captain}</h3>
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>{listing.rating}</span>
                            <span className="text-slate-500">•</span>
                            <span>{listing.trips} trips</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        listing.experience === 'Any level welcome' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : listing.experience === 'Intermediate'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}>
                        {listing.experience}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <BoatIcon className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium">{listing.boat}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{listing.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{listing.time}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      <span>{listing.area}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <div className="flex gap-1">
                        {[...Array(listing.capacity)].map((_, i) => (
                          <div 
                            key={i}
                            className={`w-6 h-6 rounded-full border-2 ${
                              i < listing.capacity - listing.available
                                ? 'bg-cyan-500/20 border-cyan-500'
                                : 'border-slate-600 border-dashed'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-400">{listing.available} spots left</span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-xs text-slate-500 mb-2">Requirements:</p>
                      <div className="flex flex-wrap gap-1">
                        {listing.requirements.map((req, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs">{req}</span>
                        ))}
                      </div>
                    </div>
                    
                    <button className="w-full bg-cyan-500 text-slate-900 font-medium py-2 rounded-lg hover:bg-cyan-400 transition-colors">
                      Request to Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="max-w-7xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                  <div className="h-24 bg-gradient-to-r from-cyan-500/30 to-teal-500/30" />
                  <div className="p-4 -mt-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center text-3xl font-bold border-4 border-slate-800">
                      JD
                    </div>
                    <h3 className="text-xl font-bold mt-3">John Davidson</h3>
                    <p className="text-slate-400 text-sm">Matagorda Bay Local Expert</p>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                      <div>
                        <p className="text-xl font-bold text-cyan-400">47</p>
                        <p className="text-xs text-slate-500">Spots Shared</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-cyan-400">156</p>
                        <p className="text-xs text-slate-500">Followers</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-cyan-400">4.9</p>
                        <p className="text-xs text-slate-500">Rating</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-sm font-medium mb-2">Home Waters</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">Matagorda Bay</span>
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">East Matagorda</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Boat</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <BoatIcon className="w-4 h-4" />
                        <span>22ft Shallow Sport</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Expertise</p>
                      <div className="flex flex-wrap gap-1">
                        {['Redfish', 'Speckled Trout', 'Flounder', 'Wade Fishing'].map(skill => (
                          <span key={skill} className="px-2 py-1 bg-slate-700 rounded text-xs">{skill}</span>
                        ))}
                      </div>
                    </div>
                    
                    <button className="w-full mt-4 bg-slate-700 py-2 rounded-lg text-sm hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
              
              {/* My Saved Spots & Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    My Saved Spots
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { name: 'Secret Redfish Flat', visibility: 'Private', species: 'Redfish' },
                      { name: 'Bird Island Trout Hole', visibility: 'Friends', species: 'Trout' },
                      { name: 'Morning Glory Wade Spot', visibility: 'Public', species: 'Mixed' },
                    ].map((spot, i) => (
                      <div key={i} className="bg-slate-700/50 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-teal-500/30 rounded-lg flex items-center justify-center">
                          <Fish className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{spot.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className={`px-1.5 py-0.5 rounded ${
                              spot.visibility === 'Private' ? 'bg-red-500/20 text-red-400' :
                              spot.visibility === 'Friends' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {spot.visibility}
                            </span>
                            <span>{spot.species}</span>
                          </div>
                        </div>
                        <button className="text-slate-400 hover:text-white">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full mt-3 py-2 border border-dashed border-slate-600 rounded-lg text-sm text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Spot
                  </button>
                </div>
                
                {/* Local Forum Feed */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-cyan-400" />
                    Matagorda Bay Forum
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { user: 'CaptainMike', time: '2h ago', text: 'Incredible bite this morning at the shell pads. Landed 6 slot reds on topwater before 8am. SE wind 10mph was perfect.', likes: 24, replies: 8 },
                      { user: 'BayRat_Sarah', time: '5h ago', text: 'Anyone else notice the water clarity improving? Sight casting should be good this weekend if the wind stays down.', likes: 18, replies: 12 },
                      { user: 'WadeKing', time: '1d ago', text: 'PSA: The boat ramp at Palacios is closed for repairs through Friday. Use the launch at Matagorda Harbor instead.', likes: 45, replies: 3 },
                    ].map((post, i) => (
                      <div key={i} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center text-xs font-bold">
                            {post.user.slice(0, 2)}
                          </div>
                          <span className="font-medium text-sm">{post.user}</span>
                          <span className="text-xs text-slate-500">{post.time}</span>
                        </div>
                        <p className="text-sm text-slate-300">{post.text}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                          <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                            <Heart className="w-3 h-3" />
                            {post.likes}
                          </button>
                          <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                            <MessageCircle className="w-3 h-3" />
                            {post.replies}
                          </button>
                          <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                            <Share2 className="w-3 h-3" />
                            Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          {[
            { id: 'map', icon: <MapPin className="w-5 h-5" />, label: 'Map' },
            { id: 'hotspots', icon: <Target className="w-5 h-5" />, label: 'Spots' },
            { id: 'navigation', icon: <Navigation className="w-5 h-5" />, label: 'Navigate' },
            { id: 'boatshare', icon: <Users className="w-5 h-5" />, label: 'Share' },
            { id: 'community', icon: <User className="w-5 h-5" />, label: 'Profile' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                activeTab === item.id ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
