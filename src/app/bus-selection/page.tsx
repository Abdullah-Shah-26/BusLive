'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, MapPin, Clock, Users, ChevronRight, Circle, AlertCircle, Star } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface BusInfo {
  id: number;
  route: string;
  startPoint: string;
  endPoint: string;
  status: 'active' | 'delayed' | 'maintenance';
  eta: string;
  passengers: number;
  maxPassengers: number;
  rating: number;
}

const busData: BusInfo[] = [
  { id: 1, route: 'Route 1', startPoint: 'Banjara Hills', endPoint: 'College', status: 'active', eta: '5 min', passengers: 28, maxPassengers: 45, rating: 4.8 },
  { id: 2, route: 'Route 2', startPoint: 'Hitech City', endPoint: 'College', status: 'active', eta: '12 min', passengers: 35, maxPassengers: 45, rating: 4.6 },
  { id: 3, route: 'Route 3', startPoint: 'Secunderabad', endPoint: 'College', status: 'delayed', eta: '18 min', passengers: 22, maxPassengers: 45, rating: 4.5 },
  { id: 4, route: 'Route 4', startPoint: 'Kukatpally', endPoint: 'College', status: 'active', eta: '8 min', passengers: 31, maxPassengers: 45, rating: 4.7 },
  { id: 5, route: 'Route 5', startPoint: 'Dilsukhnagar', endPoint: 'College', status: 'active', eta: '15 min', passengers: 19, maxPassengers: 45, rating: 4.4 },
  { id: 6, route: 'Route 6', startPoint: 'Gachibowli', endPoint: 'College', status: 'maintenance', eta: '--', passengers: 0, maxPassengers: 45, rating: 4.3 },
  { id: 7, route: 'Route 7', startPoint: 'LB Nagar', endPoint: 'College', status: 'active', eta: '20 min', passengers: 40, maxPassengers: 45, rating: 4.2 },
  { id: 8, route: 'Route 8', startPoint: 'Kompally', endPoint: 'College', status: 'active', eta: '25 min', passengers: 15, maxPassengers: 45, rating: 4.6 },
  { id: 9, route: 'Route 9', startPoint: 'Nizampet', endPoint: 'College', status: 'delayed', eta: '30 min', passengers: 25, maxPassengers: 45, rating: 4.1 }
];

export default function BusSelectionPage() {
  const router = useRouter();
  const [selectedBus, setSelectedBus] = useState<number | null>(null);

  const handleBusSelect = (busId: number) => {
    const bus = busData.find(b => b.id === busId);
    if (bus && bus.status !== 'maintenance') {
      setSelectedBus(busId);
      setTimeout(() => router.push(`/?busId=${busId}`), 200);
    }
  };

  const activeBuses = busData.filter(b => b.status === 'active').length;
  const totalPassengers = busData.reduce((sum, bus) => sum + bus.passengers, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-100 dark:selection:bg-zinc-800 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Select Route
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium">
              Real-time tracking for college transport
            </p>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex gap-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-zinc-700 dark:text-zinc-300">{activeBuses} Active</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <Users className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-700 dark:text-zinc-300">{totalPassengers} Riders</span>
                </div>
             </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Bus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {busData.map((bus) => {
            const isMaintenance = bus.status === 'maintenance';
            const isDelayed = bus.status === 'delayed';
            
            return (
              <div 
                key={bus.id}
                onClick={() => handleBusSelect(bus.id)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-white dark:bg-zinc-950 transition-all duration-300",
                  // Light mode styles
                  "border-zinc-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10",
                  // Dark mode styles
                  "dark:border-zinc-800 dark:hover:border-indigo-700 dark:hover:shadow-xl dark:hover:shadow-indigo-900/20",
                  // Interactive states
                  !isMaintenance && "cursor-pointer active:scale-[0.98]",
                  isMaintenance && "opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/50",
                  selectedBus === bus.id && "ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-black"
                )}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 shadow-sm",
                        isMaintenance ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600" : 
                        "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/30 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white"
                      )}>
                        <Bus className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Bus {bus.id}
                          </h3>
                          {!isMaintenance && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{bus.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                          {bus.route}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className={cn(
                      "capitalize font-semibold border-0 px-3 py-1 rounded-full shadow-sm",
                      bus.status === 'active' && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-500/20",
                      bus.status === 'delayed' && "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-amber-500/20",
                      bus.status === 'maintenance' && "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}>
                      {bus.status === 'delayed' && <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                      {bus.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-200">{bus.startPoint}</span>
                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800 mx-2 relative group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400 transition-colors"></div>
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-200">{bus.endPoint}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Clock className={cn(
                                "w-4 h-4",
                                isDelayed ? "text-amber-500" : "text-indigo-500/70 dark:text-indigo-400/70"
                            )} />
                            <span className={cn(
                                "text-sm font-semibold",
                                isDelayed ? "text-amber-600 dark:text-amber-500" : "text-zinc-700 dark:text-zinc-300"
                            )}>
                                {bus.eta}
                            </span>
                        </div>
                        {!isMaintenance && (
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500/70 dark:text-indigo-400/70" />
                                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                  {bus.passengers}/{bus.maxPassengers}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {!isMaintenance && (
                        <div className="flex items-center text-xs font-bold text-zinc-400 dark:text-zinc-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                            SELECT <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
