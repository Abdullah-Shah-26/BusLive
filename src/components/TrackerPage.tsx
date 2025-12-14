"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bus,
  Clock,
  LogOut,
  TrafficCone,
  AlertTriangle,
  User as UserIcon,
  School,
  Zap,
  Loader2,
  Star,
  MapPin,
  X,
  Share2,
  Check,
} from "lucide-react";
import {
  calculateETA,
  AlertState,
  hasExitedCollegeBoundary,
  shouldShowFiveMinuteAlert,
  getDistance,
} from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getRoute } from "@/ai/flows/routing-flow";
import { ThemeToggle } from "./ThemeToggle";
import AlertSystem from "./AlertSystem";
import type { LatLng, Map as LeafletMap } from "leaflet";
import { Separator } from "./ui/separator";

interface Location {
  lat: number;
  lng: number;
}

interface BusData {
  location: Location;
  status: "enroute" | "finished";
  speed: number;
}

interface TrafficData {
  level: "low" | "moderate" | "heavy" | "severe";
}

const MOCK_BUS_START_LOCATION: Location = { lat: 17.4262, lng: 78.4552 };
const MOCK_USER_LOCATION: Location = { lat: 17.4375, lng: 78.4484 };
const COLLEGE_LOCATION: Location = { lat: 17.4185, lng: 78.4451 };

const MOCK_TRAFFIC_DATA: TrafficData = { level: "low" };

export default function TrackerPage({ busId }: { busId: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [busData, setBusData] = useState<BusData | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<{
    analysis: string;
    recommendation: string;
    trafficLevel: string;
    predictedDelay?: string;
  } | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<LatLng[]>([]);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [showArrivalAlert, setShowArrivalAlert] = useState(false);
  const [journeyStage, setJourneyStage] = useState<"toUser" | "toCollege">(
    "toUser"
  );
  const [arrivalStatus, setArrivalStatus] = useState<"user" | "college" | null>(
    null
  );

  const [alertState, setAlertState] = useState<AlertState>({
    fiveMinuteWarning: false,
    oneMinuteWarning: false,
    arrivalWarning: false,
    collegeExitWarning: false,
  });
  const [showFiveMinuteAlert, setShowFiveMinuteAlert] = useState(false);
  const [showCollegeExitAlert, setShowCollegeExitAlert] = useState(false);
  const previousBusLocationRef = useRef<Location | null>(null);
  const [shareClicked, setShareClicked] = useState(false);

  const routeIndexRef = useRef(0);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationSentRef = useRef({
    user: false,
    college: false,
    fiveMin: false,
  });

  const { toast } = useToast();

  const MapComponent = useMemo(
    () =>
      dynamic(() => import("./MapComponent"), {
        ssr: false,
        loading: () => <Skeleton className="h-full w-full" />,
      }),
    []
  );

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const startSimulation = useCallback(
    (coordinates: LatLng[]) => {
      if (coordinates.length > 0) {
        routeIndexRef.current = 0;

        const startLocation = {
          lat: coordinates[0].lat,
          lng: coordinates[0].lng,
        };

        setBusData({
          location: startLocation,
          status: "enroute",
          speed: 40,
        });

        setShowArrivalAlert(false);

        if (simulationIntervalRef.current)
          clearInterval(simulationIntervalRef.current);

        simulationIntervalRef.current = setInterval(() => {
          setBusData((prevBusData) => {
            if (!prevBusData || prevBusData.status !== "enroute") {
              if (simulationIntervalRef.current)
                clearInterval(simulationIntervalRef.current);
              return prevBusData;
            }

            if (routeIndexRef.current >= coordinates.length - 1) {
              if (simulationIntervalRef.current)
                clearInterval(simulationIntervalRef.current);

              if (journeyStage === "toUser") {
                setArrivalStatus("user");
              } else {
                setArrivalStatus("college");
              }

              return {
                ...prevBusData,
                speed: 0,
                status: journeyStage === "toCollege" ? "finished" : "enroute",
              };
            }

            routeIndexRef.current += 1;
            const newPos = coordinates[routeIndexRef.current];

            const currentSpeed = Math.floor(Math.random() * (42 - 35 + 1) + 38);

            return {
              ...prevBusData,
              location: { lat: newPos.lat, lng: newPos.lng },
              speed: currentSpeed,
            };
          });
        }, 2000);
      }
    },
    [journeyStage]
  );

  const fetchAndSetRoute = useCallback(
    async (start: Location, end: Location) => {
      try {
        const routeData = await getRoute({ start, end });
        const leafletRoute = routeData.coordinates.map(
          (c) => ({ lat: c.lat, lng: c.lng } as LatLng)
        );
        setRoute(leafletRoute);
        if (leafletRoute.length > 0) {
          startSimulation(leafletRoute);
        }
      } catch (e: any) {
        console.error("Failed to fetch route via flow", e);
        setError(e.message || "Could not calculate the bus route.");
        toast({
          variant: "destructive",
          title: "Routing Error",
          description: e.message || "Could not calculate the bus route.",
        });
      }
    },
    [startSimulation, toast]
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          console.log("User Location Fetched:", userLat, userLng);
          console.log("College Location:", COLLEGE_LOCATION);

          const distToCollege = getDistance(
            userLat,
            userLng,
            COLLEGE_LOCATION.lat,
            COLLEGE_LOCATION.lng
          );

          console.log(" Distance to College (km):", distToCollege);

          if (distToCollege > 50) {
            console.warn(
              "User is too far from college. Switching to demo location."
            );
            toast({
              title: "Outside Service Area",
              description:
                "You are far from Hyderabad. Switching to demo mode.",
              duration: 5000,
            });
            setUserLocation(MOCK_USER_LOCATION);
          } else {
            setUserLocation({
              lat: userLat,
              lng: userLng,
            });
          }
        },
        (error) => {
          console.warn("Geolocation failed or was denied:", error);
          toast({
            variant: "destructive",
            title: "Location Access Denied",
            description: "Could not fetch your location. Using demo location.",
          });
          setUserLocation(MOCK_USER_LOCATION);
        }
      );
    } else {
      console.warn(
        "Geolocation is not supported by this browser. Using mock user location."
      );
      setUserLocation(MOCK_USER_LOCATION);
    }

    setTrafficData(MOCK_TRAFFIC_DATA);
    setError(null);
  }, []);

  useEffect(() => {
    if (!userLocation || !map) return;

    if (journeyStage === "toUser" && route.length === 0) {
      const randomLatOffset =
        (Math.random() * 0.02 + 0.02) * (Math.random() > 0.5 ? 1 : -1);
      const randomLngOffset =
        (Math.random() * 0.02 + 0.02) * (Math.random() > 0.5 ? 1 : -1);

      const busStartLocation: Location = {
        lat: userLocation.lat + randomLatOffset,
        lng: userLocation.lng + randomLngOffset,
      };
      fetchAndSetRoute(busStartLocation, userLocation);
    } else if (
      journeyStage === "toCollege" &&
      busData?.location &&
      route.length === 0
    ) {
      fetchAndSetRoute(busData.location, COLLEGE_LOCATION);
    }
  }, [
    journeyStage,
    userLocation,
    map,
    busId,
    fetchAndSetRoute,
    busData?.location,
    route.length,
  ]);

  useEffect(() => {
    if (arrivalStatus === "user") {
      setShowArrivalAlert(true);
      setArrivalStatus(null);

      setTimeout(() => {
        setJourneyStage("toCollege");
        setRoute([]);
        setAlertState((prev) => ({ ...prev, fiveMinuteWarning: false }));
        setShowArrivalAlert(false);
      }, 5000);
    } else if (arrivalStatus === "college") {
      setShowArrivalAlert(true);
      setBusData((prev) => (prev ? { ...prev, status: "finished" } : null));
      setArrivalStatus(null);
    }
  }, [arrivalStatus, busId]);

  useEffect(() => {
    if (route.length > 0 && busData && routeIndexRef.current < route.length) {
      const remaining = route.slice(routeIndexRef.current);
      setRemainingRoute(remaining);
    }
  }, [route, busData, routeIndexRef.current]);

  useEffect(() => {
    if (
      userLocation &&
      busData &&
      route.length > 0 &&
      typeof window !== "undefined" &&
      window.L
    ) {
      let remainingDistance = 0;
      if (routeIndexRef.current < route.length - 1) {
        const currentPos = window.L.latLng(
          busData.location.lat,
          busData.location.lng
        );
        const nextPoint = window.L.latLng(route[routeIndexRef.current + 1]);
        remainingDistance += currentPos.distanceTo(nextPoint);

        for (let i = routeIndexRef.current + 1; i < route.length - 1; i++) {
          remainingDistance += window.L.latLng(route[i]).distanceTo(
            window.L.latLng(route[i + 1])
          );
        }
      }
      remainingDistance = remainingDistance / 1000;

      const calculatedEta = calculateETA(
        remainingDistance,
        40,
        trafficData?.level
      );
      setEta(calculatedEta);

      if (
        calculatedEta !== null &&
        calculatedEta <= 5 &&
        calculatedEta > 3 &&
        !alertState.fiveMinuteWarning
      ) {
        setShowFiveMinuteAlert(true);
        setAlertState((prev) => ({ ...prev, fiveMinuteWarning: true }));
      }

      if (
        calculatedEta !== null &&
        calculatedEta <= 1 &&
        !alertState.oneMinuteWarning
      ) {
        setAlertState((prev) => ({ ...prev, oneMinuteWarning: true }));
        toast({
          title:
            journeyStage === "toUser"
              ? "Bus is Arriving Soon!"
              : "Approaching College!",
          description:
            journeyStage === "toUser"
              ? `Bus ${busId} is less than a minute away from your location.`
              : `Bus ${busId} is less than a minute away from the college.`,
        });
      }
    }
  }, [
    userLocation,
    busData,
    trafficData,
    toast,
    busId,
    route,
    journeyStage,
    alertState,
  ]);

  useEffect(() => {
    if (busData?.location) {
      if (
        hasExitedCollegeBoundary(
          busData.location,
          previousBusLocationRef.current
        ) &&
        !alertState.collegeExitWarning
      ) {
        setShowCollegeExitAlert(true);
        setAlertState((prev) => ({ ...prev, collegeExitWarning: true }));
      }

      previousBusLocationRef.current = busData.location;
    }
  }, [busData?.location, alertState.collegeExitWarning, busId, toast]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleMapReady = useCallback((mapInstance: LeafletMap) => {
    setMap(mapInstance);
  }, []);

  const handleShareLocation = async () => {
    const shareUrl = `${window.location.origin}/?busId=${busId}`;
    const shareText = `Track Bus ${busId} live on BusLive! 🚌`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bus ${busId} - BusLive`,
          text: shareText,
          url: shareUrl,
        });
        toast({
          title: "Shared Successfully!",
          description: "Bus location shared with your friend.",
        });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShareClicked(true);
      toast({
        title: "Link Copied!",
        description:
          "Share this link with your friends to track the bus together.",
      });
      setTimeout(() => setShareClicked(false), 2000);
    });
  };

  const handleRestartJourney = () => {
    toast({
      title: "New Journey Started",
      description: `Bus ${busId} has left the college.`,
    });
    notificationSentRef.current = {
      user: false,
      college: false,
      fiveMin: false,
    };
    setShowArrivalAlert(false);
    setJourneyStage("toUser");
    setRoute([]);
    setBusData(null);

    setAlertState({
      fiveMinuteWarning: false,
      oneMinuteWarning: false,
      arrivalWarning: false,
      collegeExitWarning: false,
    });
    setShowFiveMinuteAlert(false);
    setShowCollegeExitAlert(false);
    previousBusLocationRef.current = null;
  };

  const renderETA = () => {
    if (busData?.status === "finished")
      return (
        <span className="text-green-600 font-bold">Arrived at College</span>
      );
    if (eta === null) return <span>Calculating...</span>;
    if (busData?.speed === 0 && journeyStage === "toUser")
      return <span className="text-green-600 font-bold">Arrived at You</span>;
    if (eta < 1 / 60)
      return <span className="text-green-600 font-bold">Arriving now</span>;

    const totalSeconds = Math.floor(eta * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return (
      <span>
        {hours > 0 ? `${hours} hr ` : ""}
        {minutes} min {seconds} sec
      </span>
    );
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <MapComponent
        userLocation={userLocation}
        busLocation={busData?.location}
        collegeLocation={COLLEGE_LOCATION}
        onMapReady={setMap}
        routeCoordinates={route}
        remainingRoute={remainingRoute}
        busSpeed={busData?.speed}
        eta={eta || undefined}
      >
        <div className="flex gap-2">
          <Button
            onClick={handleShareLocation}
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white transition-all hover:scale-105 active:scale-95"
            title="Share Bus Location"
          >
            {shareClicked ? (
              <Check className="w-6 h-6" />
            ) : (
              <Share2 className="w-6 h-6" />
            )}
          </Button>

          <Button
            onClick={async () => {
              if (!busData) {
                toast({
                  variant: "destructive",
                  title: "No Bus Data",
                  description: "Waiting for bus location data...",
                });
                return;
              }

              console.log("AI Traffic Analysis clicked!");
              console.log("Bus Data:", busData);
              setIsAnalyzing(true);

              toast({
                title: "🔍 Analyzing Traffic...",
                description:
                  "Asking AI for insights (Gemini → Groq fallback)...",
              });

              try {
                const { analyzeTraffic } = await import(
                  "@/ai/flows/traffic-flow"
                );
                console.log("Traffic flow imported successfully");

                const result = await analyzeTraffic({
                  location: `${busData.location.lat}, ${busData.location.lng}`,
                  time: new Date().toLocaleTimeString(),
                  currentSpeed: busData.speed,
                });

                console.log("AI Analysis Result:", result);

                // Update the main traffic state
                setTrafficData({ level: result.trafficLevel as any });
                setAiInsight(result);

                // Auto-dismiss after 10 seconds
                setTimeout(() => {
                  setAiInsight(null);
                }, 10000);

                toast({
                  title: "AI Traffic Insight ",
                  description: (
                    <div className="mt-2 space-y-2">
                      <p className="font-medium">{result.analysis}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.recommendation}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold uppercase">
                          Level:
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            result.trafficLevel === "severe"
                              ? "bg-red-500 text-white"
                              : result.trafficLevel === "heavy"
                              ? "bg-orange-500 text-white"
                              : result.trafficLevel === "moderate"
                              ? "bg-yellow-500 text-black"
                              : "bg-green-500 text-white"
                          }`}
                        >
                          {result.trafficLevel}
                        </span>
                      </div>
                    </div>
                  ),
                  duration: 8000,
                });
              } catch (e: any) {
                console.error("AI Analysis Error:", e);

                let errorMessage = "Could not fetch AI insights.";
                let errorTitle = " Analysis Failed";

                if (e.message?.includes("API key")) {
                  errorMessage =
                    "Gemini API key is missing. Please configure GEMINI_API_KEY in your .env file.";
                } else if (
                  e.message?.includes("429") ||
                  e.message?.includes("quota") ||
                  e.message?.includes("rate limit")
                ) {
                  errorTitle = " Rate Limit Reached";
                  errorMessage =
                    "Gemini API rate limit exceeded. Please try again later or upgrade your API quota.";
                } else if (
                  e.message?.includes("403") ||
                  e.message?.includes("forbidden")
                ) {
                  errorTitle = " Access Denied";
                  errorMessage =
                    "API access denied. Please check your Gemini API key permissions.";
                } else if (e.message) {
                  errorMessage = e.message;
                }

                toast({
                  variant: "destructive",
                  title: errorTitle,
                  description: errorMessage,
                  duration: 6000,
                });
              } finally {
                setIsAnalyzing(false);
              }
            }}
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            title="Ask AI about Traffic"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Zap className="w-6 h-6" />
            )}
          </Button>
        </div>
      </MapComponent>

      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 md:top-4 md:left-4 md:right-auto z-[1000] md:w-full md:max-w-sm">
        <Card className="bg-white/75 dark:bg-black/40 backdrop-blur-3xl border border-white/60 dark:border-white/20 shadow-2xl">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="p-1 sm:p-1.5 md:p-2 bg-primary/10 rounded-lg sm:rounded-xl">
                <Bus className="text-primary w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="truncate text-sm sm:text-base">
                    Bus {busId}
                  </span>
                  <div
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${
                      busData?.status === "finished"
                        ? "bg-green-500"
                        : "bg-blue-500 animate-pulse"
                    }`}
                  />
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm font-normal text-muted-foreground mt-0.5 md:mt-1 truncate">
                  {journeyStage === "toUser"
                    ? "Coming to you"
                    : "Heading to college"}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-3 space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    ETA to {journeyStage === "toUser" ? "You" : "College"}
                  </span>
                  <Clock
                    size={12}
                    className="text-muted-foreground sm:hidden"
                  />
                  <Clock
                    size={14}
                    className="text-muted-foreground hidden sm:block"
                  />
                </div>
                <div className="text-sm sm:text-base md:text-lg font-bold">
                  {renderETA()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Avg Speed
                    </span>
                    <TrafficCone
                      size={10}
                      className="text-muted-foreground sm:hidden"
                    />
                    <TrafficCone
                      size={14}
                      className="text-muted-foreground hidden sm:block"
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold">
                    {busData?.speed || 0} km/h
                  </div>
                </div>

                <div className="p-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Traffic
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold capitalize">
                    {trafficData?.level || "Normal"}
                  </div>
                </div>
              </div>

              <div className="p-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Destination
                  </span>
                  <School size={14} className="text-primary" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-primary">
                  MJ College of Engineering & Technology
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {aiInsight && (
        <div className="absolute bottom-20 left-2 right-2 md:bottom-auto md:top-24 md:left-auto md:right-4 z-[1000] md:min-w-[450px] md:max-w-[500px] animate-in slide-in-from-bottom-5 md:slide-in-from-right-5 fade-in duration-300">
          <Card className="bg-white/75 dark:bg-black/40 backdrop-blur-3xl border border-white/60 dark:border-white/20 shadow-2xl overflow-hidden rounded-lg">
            <CardHeader className="p-2 flex flex-row items-center justify-between space-y-0 border-b border-white/10 dark:border-white/5">
              <CardTitle className="text-xs font-bold flex items-center gap-2">
                <div className="p-1 bg-indigo-500/20 rounded-md backdrop-blur-md">
                  <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                </div>
                AI Traffic Analysis
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-md"
                onClick={() => setAiInsight(null)}
              >
                <span className="sr-only">Close</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </CardHeader>
            <CardContent className="p-2 pt-2 text-sm space-y-2">
              <p className="font-medium leading-snug text-foreground/90 text-xs px-1">
                {aiInsight.analysis}
              </p>

              <div className="flex flex-row gap-2 items-stretch">
                <div className="bg-zinc-100 dark:bg-zinc-900/80 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1">
                  <p className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-300 mb-0.5 tracking-wider opacity-80">
                    Recommendation
                  </p>
                  <p className="text-xs font-semibold text-foreground/90 leading-tight">
                    {aiInsight.recommendation}
                  </p>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-900/80 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between min-w-[110px]">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-purple-600 dark:text-purple-300 mb-0.5 tracking-wider opacity-80">
                      Est. Delay
                    </p>
                    <p className="text-xs font-bold text-foreground/90">
                      {aiInsight.predictedDelay || "Calculating..."}
                    </p>
                  </div>
                  <div className="p-1.5 bg-purple-500/10 rounded-full ml-2">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-4 md:right-4 z-[1000] flex gap-2 md:gap-3 items-start">
        <div className="md:hidden flex gap-0 items-center backdrop-blur-3xl rounded-md shadow-2xl p-0.5 border border-white/30 dark:border-white/20 [background:rgba(255,255,255,0.05)] dark:[background:rgba(0,0,0,0.2)]">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-sm h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground"
            onClick={() => router.push("/bus-selection")}
            title="Change Bus"
          >
            <Bus size={14} className="text-foreground" />
          </Button>

          <Avatar className="w-5 h-5 ring-1 ring-border">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="bg-primary/10 text-foreground">
              <UserIcon size={12} />
            </AvatarFallback>
          </Avatar>

          <div className="scale-[0.65] origin-center -mx-1">
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              setShowFiveMinuteAlert(true);
            }}
            className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 rounded-sm h-6 w-6 p-0"
            title="Test 5min Alert"
            type="button"
          >
            <Clock size={12} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              setShowCollegeExitAlert(true);
            }}
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-sm h-6 w-6 p-0"
            title="Test College Exit"
            type="button"
          >
            <School size={12} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-foreground hover:bg-destructive/10 hover:text-destructive rounded-sm h-6 w-6 p-0"
          >
            <LogOut size={14} />
          </Button>
        </div>

        {/* Desktop: Full header */}
        <div className="hidden md:flex gap-2 items-center bg-background/95 backdrop-blur-md rounded-lg shadow-xl p-2 border border-white/20">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-md h-9 px-3 gap-2 hover:bg-orange-500 hover:text-white transition-all duration-300"
            onClick={() => router.push("/bus-selection")}
          >
            <Bus size={16} />
            <span className="text-sm font-medium">Change Bus</span>
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <div className="flex items-center gap-2 px-2">
            <Avatar className="w-8 h-8 ring-2 ring-background">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className="bg-primary/10">
                <UserIcon size={14} />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold leading-none">
                {user?.displayName?.split(" ")[0] || "Student"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Online</p>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <div className="flex gap-1">
            <ThemeToggle />
            {/* Debug buttons - remove in production */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                console.log("🧪 Test 5-minute alert clicked!");
                setShowFiveMinuteAlert(true);
              }}
              className="rounded-md h-9 w-9 p-0 hover:bg-orange-500 hover:text-white transition-all duration-300 text-orange-500"
              title="Test 5min Alert"
              type="button"
            >
              <Clock size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                console.log("🧪 Test college exit alert clicked!");
                setShowCollegeExitAlert(true);
              }}
              className="rounded-md h-9 w-9 p-0 hover:bg-blue-500 hover:text-white transition-all duration-300 text-blue-500"
              title="Test College Exit Alert"
              type="button"
            >
              <School size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="rounded-md h-9 w-9 p-0 hover:bg-red-500 hover:text-white transition-all duration-300 text-muted-foreground"
            >
              <LogOut size={16} />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {showArrivalAlert && (
        <div className="absolute inset-0 bg-black/80 z-[1001] flex items-center justify-center p-4">
          <Card className="w-full max-w-[90vw] sm:max-w-[400px] p-6 text-center shadow-2xl border bg-card rounded-xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full hover:bg-muted"
              onClick={() => setShowArrivalAlert(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
            <CardHeader className="p-0 space-y-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center border">
                {busData?.status === "finished" ? (
                  <School className="w-7 h-7 text-primary" />
                ) : (
                  <UserIcon className="w-7 h-7 text-primary" />
                )}
              </div>
              <CardTitle className="text-xl font-bold text-card-foreground leading-tight">
                {busData?.status === "finished"
                  ? "Bus Arrived at College!"
                  : "Bus Arrived at Your Stop!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground mb-6">
                {busData?.status === "finished"
                  ? `Bus ${busId} has reached its final destination.`
                  : `Bus ${busId} has reached your location. Next stop: College.`}
              </p>
              <Button
                onClick={() => {
                  if (busData?.status === "finished") {
                    handleRestartJourney();
                  } else {
                    setShowArrivalAlert(false);
                  }
                }}
                className="w-full h-10 text-sm font-medium rounded-lg"
                size="default"
              >
                {busData?.status === "finished"
                  ? "Start New Journey"
                  : "Awesome!"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md mx-6">
          <Card className="bg-destructive/95 backdrop-blur-md border-0 shadow-xl text-destructive-foreground">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-destructive-foreground/10 rounded-xl">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Connection Error</p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(!userLocation || !busData) && !error && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-[2000] p-2 sm:p-4">
          <Card className="bg-background/50 backdrop-blur-md border-2 border-primary/30 dark:border-white/30 shadow-2xl max-w-xs sm:max-w-sm w-full mx-2 sm:mx-4">
            <CardContent className="p-4 sm:p-6 md:p-8 text-center">
              <div className="p-3 sm:p-4 bg-primary/10 rounded-xl sm:rounded-2xl w-fit mx-auto mb-4 sm:mb-6">
                <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                Connecting to BusLive
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">
                Setting up your real-time tracking...
              </p>

              <div className="space-y-2 sm:space-y-3">
                {[
                  { label: "Location Services", connected: !!userLocation },
                  { label: "Bus Tracking", connected: !!busData },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 dark:bg-zinc-800/80 border border-border/50 dark:border-white/20 rounded-lg sm:rounded-xl"
                  >
                    <span className="text-xs sm:text-sm font-medium">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                          item.connected
                            ? "bg-green-500"
                            : "bg-yellow-500 animate-pulse"
                        }`}
                      />
                      <span
                        className={`text-[10px] sm:text-xs font-medium ${
                          item.connected
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.connected ? "Connected" : "Connecting..."}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Alert System */}
      {!showArrivalAlert && (
        <AlertSystem
          busId={busId}
          fiveMinuteAlert={showFiveMinuteAlert}
          onFiveMinuteAlertClose={() => setShowFiveMinuteAlert(false)}
          collegeExitAlert={showCollegeExitAlert}
          onCollegeExitAlertClose={() => setShowCollegeExitAlert(false)}
          eta={eta || 5}
          journeyStage={journeyStage}
        />
      )}
    </div>
  );
}
