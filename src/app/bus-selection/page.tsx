"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BusIcon,
  MapPin,
  Clock,
  Users,
  Star,
  Route,
  Search,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface BusInfo {
  id: number;
  route: string;
  status: "active" | "delayed" | "maintenance";
  eta: string;
  passengers: number;
  maxPassengers: number;
  rating: number;
  nextStops: string[];
}

const busData: BusInfo[] = [
  {
    id: 1,
    route: "Banjara Hills → College",
    status: "active",
    eta: "5 min",
    passengers: 28,
    maxPassengers: 45,
    rating: 4.8,
    nextStops: ["Jubilee Hills", "Ameerpet", "SR Nagar"],
  },
  {
    id: 2,
    route: "Hitech City → College",
    status: "active",
    eta: "12 min",
    passengers: 35,
    maxPassengers: 45,
    rating: 4.6,
    nextStops: ["Kondapur", "Miyapur", "Bachupally"],
  },
  {
    id: 3,
    route: "Secunderabad → College",
    status: "delayed",
    eta: "18 min",
    passengers: 22,
    maxPassengers: 45,
    rating: 4.5,
    nextStops: ["Paradise", "Begumpet", "Prakash Nagar"],
  },
  {
    id: 4,
    route: "Kukatpally → College",
    status: "active",
    eta: "8 min",
    passengers: 31,
    maxPassengers: 45,
    rating: 4.7,
    nextStops: ["JNTU", "Balanagar", "Moosapet"],
  },
  {
    id: 5,
    route: "Dilsukhnagar → College",
    status: "active",
    eta: "15 min",
    passengers: 19,
    maxPassengers: 45,
    rating: 4.4,
    nextStops: ["Koti", "Abids", "Nampally"],
  },
  {
    id: 6,
    route: "Gachibowli → College",
    status: "maintenance",
    eta: "-- min",
    passengers: 0,
    maxPassengers: 45,
    rating: 4.3,
    nextStops: [],
  },
  {
    id: 7,
    route: "LB Nagar → College",
    status: "active",
    eta: "20 min",
    passengers: 40,
    maxPassengers: 45,
    rating: 4.2,
    nextStops: ["Uppal", "Nagole", "Tarnaka"],
  },
  {
    id: 8,
    route: "Kompally → College",
    status: "active",
    eta: "25 min",
    passengers: 15,
    maxPassengers: 45,
    rating: 4.6,
    nextStops: ["Alwal", "Bolaram", "Quthbullapur"],
  },
  {
    id: 9,
    route: "Nizampet → College",
    status: "delayed",
    eta: "30 min",
    passengers: 25,
    maxPassengers: 45,
    rating: 4.1,
    nextStops: ["Pragathi Nagar", "Miyapur"],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "delayed":
      return "bg-yellow-500";
    case "maintenance":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "active":
      return "default";
    case "delayed":
      return "secondary";
    case "maintenance":
      return "destructive";
    default:
      return "outline";
  }
};

const getCapacityColor = (passengers: number, maxPassengers: number) => {
  const percentage = (passengers / maxPassengers) * 100;
  if (percentage < 50) {
    return "bg-gradient-to-r from-green-500 to-green-600"; // Comfortable
  } else if (percentage < 75) {
    return "bg-gradient-to-r from-blue-500 to-blue-600"; // Getting Full
  } else if (percentage < 90) {
    return "bg-gradient-to-r from-orange-500 to-orange-600"; // Crowded
  } else {
    return "bg-gradient-to-r from-red-500 to-red-600"; // Almost Full
  }
};

const getCapacityLabel = (passengers: number, maxPassengers: number) => {
  const percentage = (passengers / maxPassengers) * 100;
  if (percentage < 50) {
    return "Comfortable";
  } else if (percentage < 75) {
    return "Getting Full";
  } else if (percentage < 90) {
    return "Crowded";
  } else {
    return "Almost Full";
  }
};

function BusCardSkeleton() {
  return (
    <Card className="cursor-wait">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BusSelectionPage() {
  const router = useRouter();
  const [selectedBus, setSelectedBus] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredBuses = busData.filter(
    (bus) =>
      bus.id.toString().includes(searchQuery) ||
      bus.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.nextStops.some((stop) =>
        stop.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const favoriteBuses = filteredBuses.filter((bus) =>
    favorites.includes(bus.id)
  );
  const otherBuses = filteredBuses.filter((bus) => !favorites.includes(bus.id));

  useEffect(() => {
    const savedFavorites = localStorage.getItem("favoriteBuses");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const toggleFavorite = (busId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(busId)
      ? favorites.filter((id) => id !== busId)
      : [...favorites, busId];
    setFavorites(newFavorites);
    localStorage.setItem("favoriteBuses", JSON.stringify(newFavorites));
  };

  const handleBusSelect = (busId: number) => {
    const bus = busData.find((b) => b.id === busId);
    if (bus && bus.status !== "maintenance") {
      setSelectedBus(busId);
      setTimeout(() => {
        router.push(`/?busId=${busId}`);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
            <div className="flex-1">
              {/* Title row with theme toggle on mobile */}
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Choose Your Bus
                </h1>
                {/* Theme Toggle - Mobile (right of title) */}
                <div className="md:hidden">
                  <ThemeToggle />
                </div>
              </div>
              <p className="text-muted-foreground mt-2">
                Select a bus route to start tracking your journey
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Bar - Desktop */}
              <div className="hidden md:block relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by Bus No, Route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Theme Toggle - Desktop */}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div className="md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by Bus No, Route, or Destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results Counter */}
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredBuses.length}{" "}
              {filteredBuses.length === 1 ? "route" : "routes"}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BusIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {busData.filter((b) => b.status === "active").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Buses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {busData.reduce((sum, bus) => sum + bus.passengers, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Passengers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Route className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{busData.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Routes Available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <BusCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Favorite Buses Section */}
            {favoriteBuses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  Favorite Routes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteBuses.map((bus, index) => (
                    <BusCard
                      key={bus.id}
                      bus={bus}
                      index={index}
                      selectedBus={selectedBus}
                      isFavorite={true}
                      onSelect={handleBusSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Buses Section */}
            <div>
              {favoriteBuses.length > 0 && (
                <h2 className="text-2xl font-bold mb-4">All Routes</h2>
              )}
              {otherBuses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherBuses.map((bus, index) => (
                    <BusCard
                      key={bus.id}
                      bus={bus}
                      index={index + favoriteBuses.length}
                      selectedBus={selectedBus}
                      isFavorite={false}
                      onSelect={handleBusSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">
                    No routes found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Try searching for a different route or destination
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-primary hover:underline font-medium"
                  >
                    Clear search
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface BusCardProps {
  bus: BusInfo;
  index: number;
  selectedBus: number | null;
  isFavorite: boolean;
  onSelect: (busId: number) => void;
  onToggleFavorite: (busId: number, e: React.MouseEvent) => void;
}

function BusCard({
  bus,
  index,
  selectedBus,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: BusCardProps) {
  return (
    <div
      className="animate-in slide-in-from-bottom-4 fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:translate-y-[-2px] ${
          bus.status === "maintenance" ? "opacity-60 cursor-not-allowed" : ""
        } ${selectedBus === bus.id ? "ring-2 ring-primary ring-offset-2" : ""}`}
        onClick={() => onSelect(bus.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BusIcon className="w-6 h-6 text-primary" />
                </div>
                <div
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(
                    bus.status
                  )}`}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">Bus {bus.id}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{bus.rating}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={getStatusVariant(bus.status)}
                className="capitalize"
              >
                {bus.status}
              </Badge>
              <button
                onClick={(e) => onToggleFavorite(bus.id, e)}
                className="p-1 hover:bg-accent rounded-md transition-colors"
                title={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    isFavorite
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground hover:text-yellow-400"
                  }`}
                />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{bus.route}</span>
            </div>

            {bus.status !== "maintenance" && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">ETA: </span>
                <span className="font-medium text-primary">{bus.eta}</span>
              </div>
            )}
          </div>

          {bus.status !== "maintenance" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Capacity</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {bus.passengers}/{bus.maxPassengers}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {getCapacityLabel(bus.passengers, bus.maxPassengers)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`${getCapacityColor(
                    bus.passengers,
                    bus.maxPassengers
                  )} h-2 rounded-full transition-all duration-500`}
                  style={{
                    width: `${(bus.passengers / bus.maxPassengers) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {bus.nextStops.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Next Stops:</p>
              <div className="flex flex-wrap gap-1">
                {bus.nextStops.slice(0, 2).map((stop, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {stop}
                  </Badge>
                ))}
                {bus.nextStops.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{bus.nextStops.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
