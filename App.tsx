import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { AppRoute, TripPlan, BucketItem, SocialPost, ItineraryItem, TransportType, NearbyTraveler } from './types';
import { Plus, ListTodo, MapPin, Search, Heart, MessageCircle, Share2, Settings, LogOut, CheckSquare, Trash2, Plane, Globe, ArrowDown, ArrowUp, Footprints, Train, Bus, Car, Camera, Map as MapIcon, Users, ChevronLeft, Image as ImageIcon, Bed, Star, Shield, Phone, Sun, CloudRain, Wind } from 'lucide-react';
import { generateTripItinerary, getPlacesRecommendations } from './services/geminiService';
import MapVisualizer from './components/MapVisualizer';

// --- Components defined inline for simplicity within single file constraint ---

// AUTH PAGE
const AuthPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-accent p-6 text-white">
    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl rotate-12">
      <Plane size={40} className="text-primary" />
    </div>
    <h1 className="text-4xl font-bold mb-2 tracking-tight">Agoda Solo</h1>
    <p className="text-white/80 mb-8 text-center max-w-xs">The ultimate companion for the modern solo traveler.</p>
    
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
      <input type="email" placeholder="Email" className="w-full bg-white/20 border border-white/30 rounded-xl p-3 mb-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
      <input type="password" placeholder="Password" className="w-full bg-white/20 border border-white/30 rounded-xl p-3 mb-6 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
      <button onClick={onLogin} className="w-full bg-white text-primary font-bold py-3 rounded-xl shadow-lg hover:bg-gray-100 transition-transform active:scale-95">
        Start Journey
      </button>
      <p className="text-center mt-4 text-sm text-white/60">Don't have an account? <span className="underline cursor-pointer">Sign Up</span></p>
    </div>
  </div>
);

// HOME PAGE
const HomePage: React.FC<{ 
  plans: TripPlan[], 
  bucketList: BucketItem[], 
  onToggleBucket: () => void,
  onDeleteBucketItem: (id: string) => void
  onAddBucketItem: (text: string, location: string, type: 'place' | 'note') => void
  onSelectPlan: (plan: TripPlan) => void
}> = ({ plans, bucketList, onToggleBucket, onDeleteBucketItem, onAddBucketItem, onSelectPlan }) => {
  const upcoming = plans.filter(p => p.status === 'upcoming' || p.status === 'planning');
  const completed = plans.filter(p => p.status === 'completed');
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('');

  return (
    <div className="p-6 pb-24">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Hello, Traveler</h2>
          <p className="text-gray-500 text-sm">Where to next?</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow">
          <img src="https://picsum.photos/100/100" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* Upcoming Trips */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Upcoming Adventures</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
          {upcoming.length === 0 ? (
            <div className="w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400">
              <MapPin size={32} className="mb-2 opacity-50" />
              <p>No trips planned yet.</p>
            </div>
          ) : (
            upcoming.map(plan => (
              <div onClick={() => onSelectPlan(plan)} key={plan.id} className="min-w-[280px] snap-center bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform">
                <div className="h-32 bg-gray-200 relative">
                    <img src={plan.coverImage} alt={plan.destination} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded-lg text-xs font-bold text-primary">
                        {plan.days} Days
                    </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">{plan.destination}</h4>
                  <p className="text-sm text-gray-500 mb-3">{new Date(plan.startDate).toLocaleDateString()}</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-secondary h-full w-1/3"></div>
                  </div>
                  <p className="text-xs text-right mt-1 text-gray-400">View Plan</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Completed Trips */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Memories</h3>
        <div className="grid grid-cols-2 gap-4">
            {completed.length === 0 ? (
                <p className="text-gray-400 text-sm col-span-2">No completed trips yet.</p>
            ) : completed.map(plan => (
                <div key={plan.id} onClick={() => onSelectPlan(plan)} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="h-20 rounded-lg bg-gray-200 mb-2 overflow-hidden">
                        <img src={plan.coverImage} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                    </div>
                    <h4 className="font-medium text-sm">{plan.destination}</h4>
                </div>
            ))}
        </div>
      </section>

      {/* Floating Bucket Button */}
      <button 
        onClick={() => setShowBucketModal(true)}
        className="fixed bottom-24 right-6 bg-primary text-white p-4 rounded-full shadow-xl hover:bg-primary/90 transition-transform active:scale-90 z-40 flex items-center justify-center"
      >
        <ListTodo size={24} />
      </button>

      {/* Bucket List Modal */}
      {showBucketModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:rounded-3xl rounded-t-3xl p-6 flex flex-col shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><ListTodo className="text-secondary" /> Bucket List</h3>
                <button onClick={() => setShowBucketModal(false)} className="bg-gray-100 p-2 rounded-full"><LogOut size={16} className="rotate-180" /></button>
            </div>
            
            <div className="flex flex-col gap-2 mb-4">
                <input 
                    type="text" 
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Dream spot or note..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newItemLocation}
                        onChange={(e) => setNewItemLocation(e.target.value)}
                        placeholder="Location (e.g. Tokyo)"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button 
                        onClick={() => {
                            if(newItemText && newItemLocation) {
                                onAddBucketItem(newItemText, newItemLocation, 'place');
                                setNewItemText('');
                                setNewItemLocation('');
                            }
                        }}
                        className="bg-primary text-white px-4 rounded-xl font-medium"
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {bucketList.map(item => (
                    <div key={item.id} className="flex flex-col bg-gray-50 p-3 rounded-xl border border-gray-100 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${item.type === 'place' ? 'bg-secondary' : 'bg-accent'}`}></div>
                                <span className="text-gray-700 font-medium">{item.text}</span>
                            </div>
                            <button onClick={() => onDeleteBucketItem(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        {item.location && <span className="text-xs text-gray-400 ml-5 flex items-center gap-1"><MapPin size={10} /> {item.location}</span>}
                    </div>
                ))}
            </div>
        </div>
      </div>
      )}
    </div>
  );
};

// PLAN DETAIL PAGE (Active Trip)
const PlanDetailPage: React.FC<{ 
    plan: TripPlan, 
    onBack: () => void,
    onAddPhoto: (itemId: string, photoUrl: string) => void,
    onSharePlan: (plan: TripPlan) => void
}> = ({ plan, onBack, onAddPhoto, onSharePlan }) => {
    const [isLive, setIsLive] = useState(false);
    const [expandedTransportId, setExpandedTransportId] = useState<string | null>(null);
    const [nearbyTravelers, setNearbyTravelers] = useState<NearbyTraveler[]>([]);
    const [showSafetyModal, setShowSafetyModal] = useState(false);

    useEffect(() => {
        if(isLive) {
            setNearbyTravelers([
                { id: 't1', name: 'Sophie', lat: 35, lng: 139, avatar: 'https://picsum.photos/seed/t1/50' },
                { id: 't2', name: 'Jin', lat: 35.1, lng: 139.1, avatar: 'https://picsum.photos/seed/t2/50' },
                { id: 't3', name: 'Marc', lat: 35.2, lng: 139.2, avatar: 'https://picsum.photos/seed/t3/50' },
                { id: 't4', name: 'Ana', lat: 35.15, lng: 139.05, avatar: 'https://picsum.photos/seed/t4/50' },
                { id: 't5', name: 'Leo', lat: 35.05, lng: 139.15, avatar: 'https://picsum.photos/seed/t5/50' }
            ]);
        } else {
            setNearbyTravelers([]);
        }
    }, [isLive]);

    const handleMockAddPhoto = (itemId: string) => {
        const photoUrl = `https://picsum.photos/seed/${Math.random()}/300/200`;
        onAddPhoto(itemId, photoUrl);
    };

    const getTransportIcon = (type: TransportType | string) => {
        switch(type) {
            case 'metro': case 'train': return <Train size={16} />;
            case 'bus': return <Bus size={16} />;
            case 'taxi': case 'car': return <Car size={16} />;
            case 'walk': return <Footprints size={16} />;
            default: return <Plane size={16} />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <h2 className="font-bold text-lg text-gray-800">{plan.destination}</h2>
                    <p className="text-xs text-gray-500">{plan.days} Days • ${plan.budget}</p>
                </div>
                <button 
                  onClick={() => setShowSafetyModal(true)}
                  className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
                >
                  <Shield size={20} />
                </button>
            </div>

            <div className="p-4 space-y-6">
                
                {/* Weather Widget */}
                <div className="bg-gradient-to-r from-blue-400 to-blue-300 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Sun size={32} className="text-yellow-300" />
                      <div>
                        <div className="text-2xl font-bold">24°C</div>
                        <div className="text-xs opacity-90">Sunny • Low 18°C</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-sm font-semibold">Today</div>
                      <div className="text-xs opacity-80 flex items-center justify-end gap-1"><Wind size={10} /> 12km/h</div>
                   </div>
                </div>

                {/* Live Mode Toggle */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <Users size={18} className={isLive ? "text-green-500" : "text-gray-400"} />
                            Live Traveler Mode
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">Show location & see others nearby</p>
                    </div>
                    <button 
                        onClick={() => setIsLive(!isLive)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isLive ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isLive ? 'translate-x-6' : ''}`}></div>
                    </button>
                </div>

                {/* Map */}
                <MapVisualizer items={plan.items} nearbyTravelers={nearbyTravelers} className="h-64 shadow-md" />

                {/* Itinerary */}
                <div className="space-y-0">
                    {plan.items.map((item, idx) => (
                      <div key={item.id} className="relative">
                          {/* Connector Line */}
                          {idx < plan.items.length - 1 && (
                            <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200 z-0"></div>
                          )}

                          {item.type === 'accommodation' ? (
                              // ACCOMMODATION BLOCK
                              <div className="ml-0 my-6 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                  <div className="flex items-center gap-2 mb-3 text-purple-800 font-bold">
                                      <Bed size={20} />
                                      <h3>Recommended Stays</h3>
                                  </div>
                                  <div className="flex overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory">
                                      {item.accommodationOptions?.map((opt, i) => (
                                          <div key={i} className="min-w-[200px] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 snap-center flex-shrink-0">
                                              <div className="h-28 bg-gray-200 relative">
                                                  <img src={opt.image} className="w-full h-full object-cover" />
                                                  {opt.recommended && <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full">Top Pick</div>}
                                                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg">${opt.pricePerNight}</div>
                                              </div>
                                              <div className="p-3">
                                                  <h4 className="font-bold text-gray-800 text-sm truncate">{opt.name}</h4>
                                                  <div className="flex items-center gap-1 mt-1">
                                                      <Star size={12} className="text-yellow-400 fill-current" />
                                                      <span className="text-xs text-gray-600 font-medium">{opt.rating}</span>
                                                  </div>
                                                  <p className="text-[10px] text-gray-400 mt-1 truncate">{opt.address}</p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ) : item.type === 'transport' ? (
                            <div className="ml-12 my-2">
                                <div 
                                    onClick={() => setExpandedTransportId(expandedTransportId === item.id ? null : item.id)}
                                    className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                                >
                                    {getTransportIcon(item.transportType || 'taxi')}
                                    <div className="text-xs font-bold text-blue-700 uppercase">{item.transportType}</div>
                                    <div className="text-xs text-blue-500">{item.durationMinutes}m • ${item.cost}</div>
                                    <ArrowDown size={12} className="text-blue-400" />
                                </div>
                                {expandedTransportId === item.id && item.transportOptions && (
                                    <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm p-2 w-full max-w-xs animate-fade-in z-10">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Alternatives</p>
                                        {item.transportOptions.map((opt, i) => (
                                            <div key={i} className={`flex justify-between items-center p-2 rounded ${opt.recommended ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                                <div className="flex items-center gap-2">
                                                    {getTransportIcon(opt.type)}
                                                    <span className="text-xs font-medium capitalize">{opt.type}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">{opt.durationMinutes}m • ${opt.cost}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                          ) : (
                            <div className={`relative z-10 flex flex-col gap-2 p-3 rounded-xl border mb-2 ${item.type === 'lunch' ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 ${item.type === 'lunch' ? 'bg-orange-400' : 'bg-secondary'}`}>
                                        {item.type === 'lunch' ? 'L' : idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-gray-800">{item.title}</h4>
                                            <span className="text-xs text-gray-400">{item.durationMinutes}m</span>
                                        </div>
                                        {item.description && <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>}
                                        {item.cost > 0 && <p className="text-xs font-medium text-green-600 mt-1">Est. ${item.cost}</p>}
                                    </div>
                                </div>

                                {/* Photos Section */}
                                <div className="ml-11">
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
                                        {item.photos?.map((photo, pIdx) => (
                                            <img key={pIdx} src={photo} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                                        ))}
                                        <button 
                                            onClick={() => handleMockAddPhoto(item.id)}
                                            className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                                        >
                                            <Camera size={20} />
                                            <span className="text-[10px] mt-1">Add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                          )}
                      </div>
                  ))}
                </div>

                {/* Create Social Post Button */}
                <button 
                    onClick={() => onSharePlan(plan)}
                    className="w-full bg-gradient-to-r from-accent to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                    <ImageIcon size={20} />
                    Create Social Post from Trip
                </button>
            </div>

            {/* Safety Modal */}
            {showSafetyModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative">
                        <button onClick={() => setShowSafetyModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <LogOut size={20} className="rotate-45" />
                        </button>
                        
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 animate-pulse">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Safety Toolkit</h3>
                            <p className="text-sm text-gray-500">Quick access for emergencies</p>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full bg-red-600 text-white p-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-lg hover:bg-red-700 transition-colors">
                                <Phone size={20} /> Call Police (110)
                            </button>
                            <button className="w-full bg-red-500 text-white p-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-lg hover:bg-red-600 transition-colors">
                                <Phone size={20} /> Call Ambulance (119)
                            </button>
                            <button className="w-full bg-gray-100 text-gray-800 p-4 rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-gray-200 transition-colors">
                                <Share2 size={20} /> Share Live Location
                            </button>
                        </div>

                        <p className="text-xs text-center text-gray-400 mt-6">
                            Emergency numbers are based on destination: {plan.destination}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// CREATE PLAN PAGE
const CreatePlanPage: React.FC<{ onSavePlan: (plan: TripPlan) => void, bucketList: BucketItem[] }> = ({ onSavePlan, bucketList }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ destination: '', days: 3, budget: 1000 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectionList, setSelectionList] = useState<{name: string, description: string, type: 'place' | 'note', image: string, selected: boolean, source: 'bucket'|'recommended'}[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [expandedTransportId, setExpandedTransportId] = useState<string | null>(null);

  const handleFetchDestinations = async () => {
    setIsLoading(true);
    const relevantBucketItems = bucketList.filter(b => 
        b.location?.toLowerCase().includes(formData.destination.toLowerCase()) || 
        formData.destination.toLowerCase().includes(b.location?.toLowerCase() || '_____')
    );
    const recommendations = await getPlacesRecommendations(formData.destination, formData.budget);
    
    // Add random images to recommendations for visual appeal
    const combinedList = [
        ...relevantBucketItems.map(b => ({ 
            name: b.text, 
            description: b.type === 'note' ? 'Your note' : 'From your bucket list', 
            type: b.type, 
            image: `https://picsum.photos/seed/${b.text}/100/100`,
            selected: true, 
            source: 'bucket' as const 
        })),
        ...recommendations.map(r => ({ 
            name: r.name, 
            description: r.description, 
            type: 'place' as 'place', 
            image: `https://picsum.photos/seed/${r.name}/100/100`,
            selected: false, 
            source: 'recommended' as const 
        }))
    ];
    setSelectionList(combinedList);
    setIsLoading(false);
    setStep(2);
  };

  const handleGenerateItinerary = async () => {
      setIsLoading(true);
      const selectedPlaces = selectionList.filter(i => i.selected && i.type === 'place').map(i => i.name);
      const notes = selectionList.filter(i => i.selected && i.type === 'note').map(i => i.name);
      const result = await generateTripItinerary(formData.destination, formData.days, formData.budget, selectedPlaces, notes);
      setItinerary(result);
      setIsLoading(false);
      setStep(3);
  };

  const toggleSelection = (index: number) => {
      const newList = [...selectionList];
      newList[index].selected = !newList[index].selected;
      setSelectionList(newList);
  };

  const addLunchBlock = () => {
    const newBlock: ItineraryItem = {
        id: Math.random().toString(),
        type: 'lunch',
        title: 'Lunch Break',
        durationMinutes: 60,
        description: 'Time to refuel',
        cost: 15 // Realistic lunch cost
    };
    const mid = Math.floor(itinerary.length / 2);
    const newItinerary = [...itinerary];
    newItinerary.splice(mid, 0, newBlock);
    setItinerary(newItinerary);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === itinerary.length - 1) return;
    const newItinerary = [...itinerary];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItinerary[index], newItinerary[targetIndex]] = [newItinerary[targetIndex], newItinerary[index]];
    setItinerary(newItinerary);
  };

  const handleSave = () => {
      const newPlan: TripPlan = {
          id: Math.random().toString(),
          destination: formData.destination,
          days: formData.days,
          budget: formData.budget,
          startDate: new Date().toISOString(),
          status: 'upcoming',
          items: itinerary,
          coverImage: `https://picsum.photos/seed/${formData.destination}/400/300`,
          authorId: 'user1',
          authorName: 'Me'
      };
      onSavePlan(newPlan);
  };

  const getTransportIcon = (type: TransportType | string) => {
      switch(type) {
          case 'metro': case 'train': return <Train size={16} />;
          case 'bus': return <Bus size={16} />;
          case 'taxi': case 'car': return <Car size={16} />;
          case 'walk': return <Footprints size={16} />;
          default: return <Plane size={16} />;
      }
  };

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center animate-pulse">
              <div className="animate-spin text-primary mb-4"><Globe size={48} /></div>
              <h3 className="text-xl font-bold text-gray-800">
                  {step === 1 ? 'Finding the best spots...' : 'Optimizing your route...'}
              </h3>
              <p className="text-gray-500 mt-2">
                  {step === 1 ? `Scanning bucket list and searching ${formData.destination}` : 'Calculating distances and transport modes using Dijkstra logic'}
              </p>
          </div>
      );
  }

  return (
    <div className="p-6 pb-24 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {step === 1 && "Start Planning"}
          {step === 2 && "Select Destinations"}
          {step === 3 && "Your Optimized Itinerary"}
      </h2>
      
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
            <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="text" 
                    value={formData.destination}
                    onChange={e => setFormData({...formData, destination: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="e.g., Tokyo, Japan"
                />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
                <input type="number" value={formData.days} onChange={e => setFormData({...formData, days: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none"/>
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none"/>
            </div>
          </div>
          <button onClick={handleFetchDestinations} disabled={!formData.destination} className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50">
            Next: Select Places
          </button>
        </div>
      )}

      {step === 2 && (
          <div className="flex flex-col flex-grow animate-slide-up">
              <p className="text-sm text-gray-500 mb-4">Select places. We found {selectionList.length} options for you.</p>
              
              <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-6 max-h-[60vh] bg-white rounded-xl p-2 border border-gray-100">
                  {selectionList.map((item, idx) => (
                      <div key={idx} onClick={() => toggleSelection(idx)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${item.selected ? 'bg-primary/5 border-primary' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${item.selected ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                              {item.selected && <CheckSquare size={14} className="text-white" />}
                          </div>
                          <img src={item.image} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                                {item.source === 'bucket' && <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">Bucket</span>}
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                          </div>
                      </div>
                  ))}
              </div>

              <button onClick={handleGenerateItinerary} className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 transition-all">
                  Generate Optimized Plan
              </button>
          </div>
      )}

      {step === 3 && (
          <div className="animate-slide-up pb-10">
              <div className="flex justify-between items-end mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Optimized Route</h3>
                  <button onClick={addLunchBlock} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold hover:bg-orange-200 transition-colors">
                      + Add Lunch
                  </button>
              </div>

              <MapVisualizer items={itinerary} className="mb-6 h-48 shadow-inner" />

              <div className="space-y-0">
                  {itinerary.map((item, idx) => (
                      <div key={item.id} className="relative">
                          {idx < itinerary.length - 1 && (
                            <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200 z-0"></div>
                          )}

                          {item.type === 'accommodation' ? (
                              <div className="ml-0 my-6 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                  <div className="flex items-center gap-2 mb-3 text-purple-800 font-bold">
                                      <Bed size={20} />
                                      <h3>Recommended Stays</h3>
                                  </div>
                                  <div className="flex overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory">
                                      {item.accommodationOptions?.map((opt, i) => (
                                          <div key={i} className="min-w-[200px] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 snap-center flex-shrink-0">
                                              <div className="h-28 bg-gray-200 relative">
                                                  <img src={opt.image} className="w-full h-full object-cover" />
                                                  {opt.recommended && <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full">Top Pick</div>}
                                                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg">${opt.pricePerNight}</div>
                                              </div>
                                              <div className="p-3">
                                                  <h4 className="font-bold text-gray-800 text-sm truncate">{opt.name}</h4>
                                                  <div className="flex items-center gap-1 mt-1">
                                                      <Star size={12} className="text-yellow-400 fill-current" />
                                                      <span className="text-xs text-gray-600 font-medium">{opt.rating}</span>
                                                  </div>
                                                  <p className="text-[10px] text-gray-400 mt-1 truncate">{opt.address}</p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ) : item.type === 'transport' ? (
                            <div className="ml-12 my-2">
                                <div 
                                    onClick={() => setExpandedTransportId(expandedTransportId === item.id ? null : item.id)}
                                    className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                                >
                                    {getTransportIcon(item.transportType || 'taxi')}
                                    <div className="text-xs font-bold text-blue-700 uppercase">{item.transportType}</div>
                                    <div className="text-xs text-blue-500">{item.durationMinutes}m • ${item.cost}</div>
                                    <ArrowDown size={12} className="text-blue-400" />
                                </div>
                                {expandedTransportId === item.id && item.transportOptions && (
                                    <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm p-2 w-full max-w-xs animate-fade-in z-10">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Alternatives</p>
                                        {item.transportOptions.map((opt, i) => (
                                            <div key={i} className={`flex justify-between items-center p-2 rounded ${opt.recommended ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                                <div className="flex items-center gap-2">
                                                    {getTransportIcon(opt.type)}
                                                    <span className="text-xs font-medium capitalize">{opt.type}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">{opt.durationMinutes}m • ${opt.cost}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                          ) : (
                            <div className={`relative z-10 flex flex-col gap-2 p-3 rounded-xl border mb-2 ${item.type === 'lunch' ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 ${item.type === 'lunch' ? 'bg-orange-400' : 'bg-secondary'}`}>
                                        {item.type === 'lunch' ? 'L' : idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-gray-800">{item.title}</h4>
                                            <span className="text-xs text-gray-400">{item.durationMinutes}m</span>
                                        </div>
                                        {item.description && <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>}
                                        {item.cost > 0 && <p className="text-xs font-medium text-green-600 mt-1">${item.cost}</p>}
                                    </div>
                                </div>
                            </div>
                          )}
                      </div>
                  ))}
              </div>

              <button 
                onClick={handleSave}
                className="w-full mt-8 bg-secondary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-secondary/90"
              >
                Finalize & Save Plan
              </button>
          </div>
      )}
    </div>
  );
};

// SOCIAL PAGE
const SocialPage: React.FC<{ 
    onImportPlan: (planId: string) => void,
    newPost?: SocialPost 
}> = ({ onImportPlan, newPost }) => {
    const [posts, setPosts] = useState<SocialPost[]>([
        {
            id: '1', authorId: 'u2', authorName: 'Sarah Jenkins', authorAvatar: 'https://picsum.photos/seed/sarah/100',
            image: 'https://picsum.photos/seed/kyoto/600/600', caption: 'Found this hidden gem in Kyoto! The generated plan was spot on.', likes: 124, comments: 12, tripPlanId: 'plan_kyoto'
        },
        {
            id: '2', authorId: 'u3', authorName: 'Mike Solo', authorAvatar: 'https://picsum.photos/seed/mike/100',
            image: 'https://picsum.photos/seed/iceland/600/600', caption: 'Iceland solo trip. Cold but worth it. Check out my itinerary.', likes: 89, comments: 5, tripPlanId: 'plan_iceland'
        }
    ]);

    useEffect(() => {
        if(newPost) {
            setPosts([newPost, ...posts]);
        }
    }, [newPost]);

    const handleShare = () => {
        alert("Link copied to clipboard! Share it with your friends.");
    };

    return (
        <div className="pb-24 bg-gray-50 min-h-full">
            <div className="p-4 bg-white sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <h2 className="text-xl font-bold font-serif italic text-primary">Agoda Solo Social</h2>
                <Search className="text-gray-400" />
            </div>
            <div className="divide-y divide-gray-200">
                {posts.map(post => (
                    <div key={post.id} className="bg-white pb-4 mb-2 animate-fade-in">
                        <div className="flex items-center gap-3 p-3">
                            <img src={post.authorAvatar} className="w-8 h-8 rounded-full border border-gray-200" />
                            <span className="font-semibold text-sm">{post.authorName}</span>
                            <button className="ml-auto text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600 font-medium hover:bg-gray-200">Follow</button>
                        </div>
                        
                        {/* Image Carousel */}
                        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory">
                            {post.images && post.images.length > 0 ? (
                                post.images.map((img, i) => (
                                    <img key={i} src={img} className="w-full h-96 object-cover flex-shrink-0 snap-center" />
                                ))
                            ) : (
                                <img src={post.image} className="w-full h-96 object-cover snap-center" />
                            )}
                        </div>

                        <div className="p-3">
                            <div className="flex items-center gap-4 mb-3">
                                <Heart className="text-gray-800 hover:text-red-500 cursor-pointer transition-colors" />
                                <MessageCircle className="text-gray-800" />
                                <button onClick={handleShare}><Share2 className="text-gray-800" /></button>
                                {post.tripPlanId && (
                                    <button 
                                        onClick={() => onImportPlan(post.tripPlanId!)}
                                        className="ml-auto flex items-center gap-1 bg-secondary text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm hover:bg-secondary/90"
                                    >
                                        <Plus size={12} /> Add Plan
                                    </button>
                                )}
                            </div>
                            <p className="text-sm"><span className="font-bold mr-2">{post.authorName}</span>{post.caption}</p>
                            <p className="text-xs text-gray-400 mt-2">View all {post.comments} comments</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// PROFILE PAGE
const ProfilePage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const handleShareProfile = () => {
        alert("Profile link shared!");
    }

    return (
        <div className="p-6 pb-24">
            <div className="flex justify-between items-start mb-6">
                <div className="w-20 h-20 rounded-full border-2 border-primary p-1">
                    <img src="https://picsum.photos/seed/me/200" className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleShareProfile} className="text-gray-400 hover:text-primary"><Share2 /></button>
                    <button onClick={onLogout} className="text-gray-400 hover:text-red-500"><LogOut /></button>
                </div>
            </div>
            
            <h2 className="text-2xl font-bold">Alex Wanderer</h2>
            <p className="text-gray-500 mb-4">Solo traveler exploring the world one coffee shop at a time.</p>

            <div className="flex gap-8 mb-8 border-b border-gray-100 pb-4 justify-between px-4">
                <button className="text-center group">
                    <div className="font-bold text-lg group-hover:text-primary transition-colors">14</div>
                    <div className="text-xs text-gray-400 uppercase">Trips</div>
                </button>
                <button className="text-center group">
                    <div className="font-bold text-lg group-hover:text-primary transition-colors">342</div>
                    <div className="text-xs text-gray-400 uppercase">Followers</div>
                </button>
                <button className="text-center group">
                    <div className="font-bold text-lg group-hover:text-primary transition-colors">180</div>
                    <div className="text-xs text-gray-400 uppercase">Following</div>
                </button>
            </div>

            <h3 className="font-bold mb-4">My Plans</h3>
            <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="aspect-square bg-gray-200 relative group cursor-pointer">
                        <img src={`https://picsum.photos/seed/${i}/300`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// MAIN APP COMPONENT
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.AUTH);
  const [plans, setPlans] = useState<TripPlan[]>([]);
  const [activePlan, setActivePlan] = useState<TripPlan | null>(null);
  const [newSocialPost, setNewSocialPost] = useState<SocialPost | undefined>(undefined);
  const [bucketList, setBucketList] = useState<BucketItem[]>([
      { id: '1', text: 'Visit Shibuya Crossing', type: 'place', location: 'Tokyo', isCompleted: false },
      { id: '2', text: 'Buy a notebook', type: 'note', location: 'Tokyo', isCompleted: false }
  ]);

  useEffect(() => {
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
          setIsAuthenticated(true);
          setCurrentRoute(AppRoute.HOME);
      }
  }, []);

  const handleLogin = () => {
      setIsAuthenticated(true);
      localStorage.setItem('auth', 'true');
      setCurrentRoute(AppRoute.HOME);
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('auth');
      setCurrentRoute(AppRoute.AUTH);
  };

  const handleSavePlan = (plan: TripPlan) => {
      setPlans([plan, ...plans]);
      setCurrentRoute(AppRoute.HOME);
  };

  const handleImportPlan = (planId: string) => {
      const importedPlan: TripPlan = {
          id: Math.random().toString(),
          destination: 'Imported Trip',
          days: 5,
          budget: 2000,
          startDate: new Date().toISOString(),
          items: [],
          status: 'planning',
          coverImage: 'https://picsum.photos/seed/import/400/300',
          authorId: 'other',
          authorName: 'Other User'
      };
      setPlans([importedPlan, ...plans]);
      alert("Plan imported successfully to your planning list!");
      setCurrentRoute(AppRoute.HOME);
  };

  const handleSelectPlan = (plan: TripPlan) => {
      setActivePlan(plan);
      setCurrentRoute(AppRoute.PLAN_DETAIL);
  };

  const handleAddPhotoToItem = (itemId: string, photoUrl: string) => {
      if(!activePlan) return;
      const updatedItems = activePlan.items.map(item => {
          if(item.id === itemId) {
              return { ...item, photos: [...(item.photos || []), photoUrl] };
          }
          return item;
      });
      const updatedPlan = { ...activePlan, items: updatedItems };
      setActivePlan(updatedPlan);
      setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  };

  const handleSharePlanAsPost = (plan: TripPlan) => {
      // Gather photos
      let allPhotos: string[] = [];
      plan.items.forEach(item => {
          if(item.photos) allPhotos = [...allPhotos, ...item.photos];
      });

      if(allPhotos.length === 0) {
          alert("Add some photos to your itinerary items first!");
          return;
      }

      const post: SocialPost = {
          id: Math.random().toString(),
          authorId: 'me',
          authorName: 'Alex Wanderer',
          authorAvatar: 'https://picsum.photos/seed/me/200',
          image: allPhotos[0],
          images: allPhotos,
          caption: `Just completed my amazing trip to ${plan.destination}! Checked out ${plan.items.length} spots.`,
          likes: 0,
          comments: 0,
          tripPlanId: plan.id
      };
      
      setNewSocialPost(post);
      setCurrentRoute(AppRoute.SOCIAL);
  };

  const renderPage = () => {
    switch (currentRoute) {
      case AppRoute.AUTH: return <AuthPage onLogin={handleLogin} />;
      case AppRoute.HOME: return (
        <HomePage 
            plans={plans} 
            bucketList={bucketList} 
            onToggleBucket={() => {}} 
            onDeleteBucketItem={(id) => setBucketList(bucketList.filter(b => b.id !== id))} 
            onAddBucketItem={(text, location, type) => setBucketList([...bucketList, { id: Math.random().toString(), text, location, type, isCompleted: false }])} 
            onSelectPlan={handleSelectPlan}
        />
      );
      case AppRoute.CREATE: return <CreatePlanPage onSavePlan={handleSavePlan} bucketList={bucketList} />;
      case AppRoute.PLAN_DETAIL: return activePlan ? (
        <PlanDetailPage 
            plan={activePlan} 
            onBack={() => setCurrentRoute(AppRoute.HOME)} 
            onAddPhoto={handleAddPhotoToItem}
            onSharePlan={handleSharePlanAsPost}
        />
      ) : null;
      case AppRoute.SOCIAL: return <SocialPage onImportPlan={handleImportPlan} newPost={newSocialPost} />;
      case AppRoute.PROFILE: return <ProfilePage onLogout={handleLogout} />;
      default: return <AuthPage onLogin={handleLogin} />;
    }
  };

  return (
    <Layout activeRoute={currentRoute} onNavigate={setCurrentRoute}>
      {renderPage()}
    </Layout>
  );
};

export default App;