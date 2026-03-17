"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "./GlobeWrapper";
import Header from "./Header";
import Sidebar from "./Sidebar";
import LoadingScreen from "./LoadingScreen";
import MessagePanel from "./MessagePanel";
import { cables } from "@/data/cables";
import { landingPoints } from "@/data/landingPoints";
import { cableRoutes } from "@/data/cableRoutes";
import { CableSystem, LandingPoint } from "@/lib/types";
import { TM_COLORS, CABLE_COLORS } from "@/lib/colors";
import { findRoute } from "@/lib/routeFinder";

// Globe textures (local high-res)
const TEXTURES = {
  night: {
    globe: "/textures/earth-night-hires.jpg",
    bg: "/textures/night-sky.png",
    atmosphere: "#2362DD",
  },
  day: {
    globe: "/textures/earth-day-hires.jpg",
    bg: "/textures/night-sky.png",
    atmosphere: "#4da6ff",
  },
} as const;
const BUMP_IMAGE = "/textures/earth-topology.png";

const SATELLITE_TILE_URL = (x: number, y: number, level: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${level}/${y}/${x}`;

const TILE_ZOOM_THRESHOLD = 1.0; // altitude below this enables tiles

type GlobeMode = "night" | "day";

interface PathData {
  coords: [number, number][];
  cableId: string;
  name: string;
  color: string;
  isMessage?: boolean;
}

type AnimationStatus = "idle" | "sending" | "delivered";

export default function GlobeScene() {
  const globeRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCable, setSelectedCable] = useState<CableSystem | null>(null);
  const [globeMode, setGlobeMode] = useState<GlobeMode>("night");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(2.2);
  const [autoRotate, setAutoRotate] = useState(false);

  // Message animation state
  const [messagePaths, setMessagePaths] = useState<PathData[]>([]);
  const [animationStatus, setAnimationStatus] = useState<AnimationStatus>("idle");
  const [routeCableIds, setRouteCableIds] = useState<Set<string>>(new Set());
  const animationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Moving message label state
  const [msgLabelPos, setMsgLabelPos] = useState<{ lat: number; lng: number; text: string } | null>(null);
  const msgAnimRaf = useRef<number>(0);
  const msgElRef = useRef<HTMLDivElement | null>(null);

  // Resize handler
  useEffect(() => {
    const update = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Prepare path data for globe (cable routes only)
  const cablePathsData: PathData[] = useMemo(() => {
    return cableRoutes.flatMap((route) =>
      route.segments.map((seg) => ({
        coords: seg.coords,
        cableId: route.cableId,
        name:
          cables.find((c) => c.id === route.cableId)?.shortName || route.cableId,
        color: CABLE_COLORS[route.cableId] || "#ffffff",
      }))
    );
  }, []);

  // Combined paths: cables + message animation overlay
  const pathsData = useMemo(
    () => [...cablePathsData, ...messagePaths],
    [cablePathsData, messagePaths]
  );

  // Prepare points data for globe
  const pointsData = useMemo(() => {
    return landingPoints.map((p) => ({
      ...p,
      size: 0.4,
      color: TM_COLORS.landingPointDefault,
    }));
  }, []);

  // Country label positions for all countries in the cable network
  const COUNTRY_LABELS = useMemo(
    () => [
      { lat: 3.5, lng: 101.5, text: "Malaysia", country: "Malaysia", labelType: "country" as const },
      { lat: 0.5, lng: 102.5, text: "Indonesia", country: "Indonesia", labelType: "country" as const },
      { lat: 14.0, lng: 100.5, text: "Thailand", country: "Thailand", labelType: "country" as const },
      { lat: 12.0, lng: 105.0, text: "Cambodia", country: "Cambodia", labelType: "country" as const },
    ],
    []
  );

  // Combined labels: city names + country names (country labels conditionally visible)
  const labelsData = useMemo(() => {
    const cityLabels = pointsData.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      text: p.city,
      labelType: "city" as const,
      country: p.country,
      id: p.id,
      cableIds: p.cableIds,
    }));

    // Show country labels when zoomed in or when a cable is selected
    const showCountries = zoomLevel < 1.5 || selectedCable !== null;
    if (!showCountries) return cityLabels;

    return [...cityLabels, ...COUNTRY_LABELS];
  }, [pointsData, zoomLevel, selectedCable, COUNTRY_LABELS]);

  // Initialize globe view centered on SEA
  const handleGlobeReady = useCallback(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: 5, lng: 108, altitude: 2.2 },
        0
      );
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0.3;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        // Touch support
        controls.enablePan = false;
        controls.touches = {
          ONE: 0, // THREE.TOUCH.ROTATE
          TWO: 2, // THREE.TOUCH.DOLLY_PAN
        };
      }
    }
    setTimeout(() => setIsLoaded(true), 500);
  }, []);

  // Sync auto-rotate state with controls
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) controls.autoRotate = autoRotate;
  }, [autoRotate, isLoaded]);

  // Pause auto-rotation on interaction, resume after idle
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;

    let idleTimer: ReturnType<typeof setTimeout>;

    const stopAutoRotate = () => {
      controls.autoRotate = false;
      clearTimeout(idleTimer);
      if (autoRotate) {
        idleTimer = setTimeout(() => {
          controls.autoRotate = true;
        }, 8000);
      }
    };

    const el = globeRef.current.renderer().domElement;
    el.addEventListener("pointerdown", stopAutoRotate);
    el.addEventListener("touchstart", stopAutoRotate, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", stopAutoRotate);
      el.removeEventListener("touchstart", stopAutoRotate);
      clearTimeout(idleTimer);
    };
  }, [isLoaded, autoRotate]);

  // Track camera altitude for dynamic scaling
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    let rafId: number;
    const poll = () => {
      const pov = globeRef.current?.pointOfView?.();
      if (pov && typeof pov.altitude === "number") {
        setZoomLevel(pov.altitude);
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [isLoaded]);

  // Linear interpolation helper for zoom-based scaling
  const scaleByZoom = useCallback(
    (farVal: number, closeVal: number) => {
      const ALT_FAR = 4.0;
      const ALT_CLOSE = 0.15;
      const t = Math.max(0, Math.min(1, (zoomLevel - ALT_CLOSE) / (ALT_FAR - ALT_CLOSE)));
      return closeVal + t * (farVal - closeVal);
    },
    [zoomLevel]
  );

  // Interpolate a position along a polyline path given progress 0→1
  const interpolateAlongPath = useCallback(
    (coords: [number, number][], progress: number): [number, number] => {
      if (coords.length === 0) return [0, 0];
      if (coords.length === 1 || progress <= 0) return coords[0];
      if (progress >= 1) return coords[coords.length - 1];

      // Calculate cumulative distances
      const dists: number[] = [0];
      for (let i = 1; i < coords.length; i++) {
        const dlat = coords[i][0] - coords[i - 1][0];
        const dlng = coords[i][1] - coords[i - 1][1];
        dists.push(dists[i - 1] + Math.sqrt(dlat * dlat + dlng * dlng));
      }
      const totalDist = dists[dists.length - 1];
      const targetDist = progress * totalDist;

      // Find the segment
      for (let i = 1; i < dists.length; i++) {
        if (targetDist <= dists[i]) {
          const segLen = dists[i] - dists[i - 1];
          const t = segLen > 0 ? (targetDist - dists[i - 1]) / segLen : 0;
          return [
            coords[i - 1][0] + t * (coords[i][0] - coords[i - 1][0]),
            coords[i - 1][1] + t * (coords[i][1] - coords[i - 1][1]),
          ];
        }
      }
      return coords[coords.length - 1];
    },
    []
  );

  // Handle cable selection
  const handleSelectCable = useCallback(
    (cable: CableSystem | null) => {
      setSelectedCable(cable);
      if (cable && globeRef.current) {
        // Find center of cable's landing points
        const points = landingPoints.filter((p) =>
          cable.landingPointIds.includes(p.id)
        );
        const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
        const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;

        // Zoom level based on cable extent — fit entire route with margin
        const latSpread = Math.max(...points.map((p) => p.lat)) - Math.min(...points.map((p) => p.lat));
        const lngSpread = Math.max(...points.map((p) => p.lng)) - Math.min(...points.map((p) => p.lng));
        const spread = Math.max(latSpread, lngSpread);
        let altitude = Math.max(0.1, Math.min(2.5, spread / 60));
        // MCT needs slightly more distance to show full route
        if (cable.id === "mct") altitude *= 1.7;

        globeRef.current.pointOfView(
          { lat: avgLat, lng: avgLng, altitude },
          1500
        );
      } else if (!cable && globeRef.current) {
        globeRef.current.pointOfView({ lat: 5, lng: 108, altitude: 2.2 }, 1500);
      }
    },
    []
  );

  // Handle point click
  const handlePointClick = useCallback((point: LandingPoint) => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: point.lat, lng: point.lng, altitude: 0.15 },
        1500
      );
    }
  }, []);

  // Handle globe path click
  const handlePathClick = useCallback(
    (path: PathData) => {
      const cable = cables.find((c) => c.id === path.cableId);
      if (cable) handleSelectCable(cable);
    },
    [handleSelectCable]
  );

  // Handle sending a message — triggers cable animation + moving text
  const handleSendMessage = useCallback(
    (originId: string, destId: string, message: string) => {
      const route = findRoute(originId, destId);
      if (!route || route.length === 0) return;

      // Clear any previous animation
      animationTimers.current.forEach(clearTimeout);
      animationTimers.current = [];
      cancelAnimationFrame(msgAnimRaf.current);

      // Deselect any selected cable
      setSelectedCable(null);

      // Track which cables are part of this route
      const cableIds = new Set(route.map((s) => s.cableId));
      setRouteCableIds(cableIds);

      // Create message path overlays from route steps
      const msgPaths: PathData[] = route.map((step) => ({
        coords: step.coords,
        cableId: step.cableId,
        name: "Message",
        color: "#FFD700",
        isMessage: true,
      }));
      setMessagePaths(msgPaths);
      setAnimationStatus("sending");

      // Flatten all route coords into a single polyline
      const fullPath: [number, number][] = [];
      for (const step of route) {
        for (let i = 0; i < step.coords.length; i++) {
          // Skip duplicate join points between segments
          if (
            i === 0 &&
            fullPath.length > 0 &&
            fullPath[fullPath.length - 1][0] === step.coords[0][0] &&
            fullPath[fullPath.length - 1][1] === step.coords[0][1]
          ) {
            continue;
          }
          fullPath.push(step.coords[i]);
        }
      }

      // Truncate message for display (max 40 chars)
      const displayText =
        message.length > 40 ? message.slice(0, 37) + "..." : message;

      // Set initial position at origin
      setMsgLabelPos({
        lat: fullPath[0][0],
        lng: fullPath[0][1],
        text: displayText,
      });

      // Camera: frame the entire route
      const lats = fullPath.map((c) => c[0]);
      const lngs = fullPath.map((c) => c[1]);
      const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      const spread = Math.max(
        Math.max(...lats) - Math.min(...lats),
        Math.max(...lngs) - Math.min(...lngs)
      );
      const altitude = Math.max(0.8, Math.min(2.5, spread / 35));

      if (globeRef.current) {
        globeRef.current.pointOfView(
          { lat: avgLat, lng: avgLng, altitude },
          1500
        );
      }

      // Total animation duration: proportional to route complexity
      const animDuration = 2500 + route.length * 1500;

      // Start RAF loop to move text along the path
      const startTime = performance.now();
      const travelDuration = animDuration - 500; // finish text travel slightly before "delivered"

      const animateLabel = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / travelDuration);
        const pos = interpolateAlongPath(fullPath, progress);
        setMsgLabelPos({ lat: pos[0], lng: pos[1], text: displayText });
        if (progress < 1) {
          msgAnimRaf.current = requestAnimationFrame(animateLabel);
        }
      };
      msgAnimRaf.current = requestAnimationFrame(animateLabel);

      // Phase: Delivered
      const t1 = setTimeout(() => {
        cancelAnimationFrame(msgAnimRaf.current);
        setAnimationStatus("delivered");

        // Snap label to destination
        const dest = landingPoints.find((p) => p.id === destId);
        if (dest) {
          setMsgLabelPos({ lat: dest.lat, lng: dest.lng, text: displayText });
          if (globeRef.current) {
            globeRef.current.pointOfView(
              { lat: dest.lat, lng: dest.lng, altitude: 0.6 },
              1200
            );
          }
        }
      }, animDuration);
      animationTimers.current.push(t1);

      // Phase: Clean up paths (keep label until full reset)
      const t2 = setTimeout(() => {
        setMessagePaths([]);
        setRouteCableIds(new Set());
      }, animDuration + 3000);
      animationTimers.current.push(t2);
    },
    [interpolateAlongPath]
  );

  // Cleanup animation timers on unmount
  useEffect(() => {
    return () => {
      animationTimers.current.forEach(clearTimeout);
      cancelAnimationFrame(msgAnimRaf.current);
    };
  }, []);

  // Path color based on selection and animation state
  const getPathColor = useCallback(
    (path: PathData) => {
      // Message overlay paths: bright gold
      if (path.isMessage) return "#FFD700";
      // During animation: dim cables not on the route
      if (animationStatus !== "idle") {
        if (routeCableIds.has(path.cableId)) return path.color;
        return "rgba(100, 100, 100, 0.1)";
      }
      if (!selectedCable) return path.color;
      if (path.cableId === selectedCable.id) return path.color;
      return "rgba(100, 100, 100, 0.15)";
    },
    [selectedCable, animationStatus, routeCableIds]
  );

  // Point color based on selection state
  const getPointColor = useCallback(
    (point: any) => {
      if (!selectedCable) return TM_COLORS.landingPointDefault;
      if (selectedCable.landingPointIds.includes(point.id))
        return TM_COLORS.cableHighlight;
      return "rgba(100, 100, 100, 0.3)";
    },
    [selectedCable]
  );

  // Point size based on selection, scaled by zoom
  const getPointAltitude = useCallback(
    (point: any) => {
      const base = !selectedCable
        ? 0.01
        : selectedCable.landingPointIds.includes(point.id)
          ? 0.03
          : 0.005;
      return base * scaleByZoom(1, 0.15);
    },
    [selectedCable, scaleByZoom]
  );

  // HTML element data for the moving message label
  const htmlElementsData = useMemo(
    () => (msgLabelPos ? [msgLabelPos] : []),
    [msgLabelPos]
  );

  // Create/update the message bubble DOM element
  const getMessageElement = useCallback((d: any) => {
    if (!msgElRef.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "padding:6px 12px;background:rgba(10,14,26,0.92);border:1.5px solid #FFD700;border-radius:8px;color:#FFD700;font-size:11px;font-family:'IBM Plex Mono',monospace;font-weight:600;white-space:nowrap;pointer-events:none;text-shadow:0 0 8px rgba(255,215,0,0.5);box-shadow:0 0 16px rgba(255,215,0,0.25);transform:translate(-50%,-100%);letter-spacing:0.05em;max-width:260px;overflow:hidden;text-overflow:ellipsis;";
      msgElRef.current = el;
    }
    msgElRef.current.textContent = d.text;
    return msgElRef.current;
  }, []);

  const [useTiles, setUseTiles] = useState(false);
  useEffect(() => {
    if (!useTiles && zoomLevel < TILE_ZOOM_THRESHOLD) {
      setUseTiles(true);
    } else if (useTiles && zoomLevel > TILE_ZOOM_THRESHOLD + 0.15) {
      setUseTiles(false);
    }
  }, [zoomLevel, useTiles]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#0A0E1A]"
      style={{ touchAction: "none" }}
    >
      {!isLoaded && <LoadingScreen />}

      <Globe
        ref={globeRef}
        width={Math.max(dimensions.width - 380, 400)}
        height={dimensions.height}
        globeImageUrl={TEXTURES[globeMode].globe}
        globeTileEngineUrl={useTiles ? SATELLITE_TILE_URL : undefined}
        bumpImageUrl={BUMP_IMAGE}
        backgroundImageUrl={TEXTURES[globeMode].bg}
        showAtmosphere={true}
        atmosphereColor={TEXTURES[globeMode].atmosphere}
        atmosphereAltitude={0.18}
        // Paths (cable routes)
        pathsData={pathsData}
        pathPoints="coords"
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathColor={getPathColor as any}
        pathStroke={((p: any) => p.isMessage ? 5 : (selectedCable ? 4 : 2.5)) as any}
        pathDashLength={((p: any) => p.isMessage ? 0.25 : 1) as any}
        pathDashGap={((p: any) => p.isMessage ? 0.15 : 0) as any}
        pathDashAnimateTime={((p: any) => p.isMessage ? 2500 : 0) as any}
        pathTransitionDuration={300}
        pathLabel={(path: any) => `<div style="padding:6px 10px;background:rgba(10,14,26,0.9);border:1px solid rgba(35,98,221,0.4);border-radius:4px;color:#E2E8F0;font-size:12px;font-family:monospace;">${path.name}</div>`}
        onPathClick={handlePathClick as any}
        // Points (landing stations)
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor={getPointColor as any}
        pointAltitude={getPointAltitude as any}
        pointRadius={scaleByZoom(0.55, 0.03)}
        pointLabel={(p: any) => `<div style="padding:6px 10px;background:rgba(10,14,26,0.9);border:1px solid rgba(35,98,221,0.4);border-radius:4px;color:#E2E8F0;font-size:12px;font-family:monospace;">${p.city}, ${p.country}</div>`}
        onPointClick={(point: any) => {
          handlePointClick(point);
          // Also select the first cable connected to this point
          const cable = cables.find((c) => point.cableIds?.includes(c.id));
          if (cable) setSelectedCable(cable);
        }}
        // Labels (city names + country names)
        labelsData={labelsData}
        labelLat="lat"
        labelLng="lng"
        labelText="text"
        labelSize={(d: any) =>
          d.labelType === "country"
            ? scaleByZoom(2.5, 0.2)
            : scaleByZoom(1.0, 0.08)
        }
        labelColor={(d: any) =>
          d.labelType === "country"
            ? "rgba(226, 232, 240, 0.55)"
            : "rgba(226, 232, 240, 0.8)"
        }
        labelDotRadius={(d: any) =>
          d.labelType === "country" ? 0 : scaleByZoom(0.25, 0.015)
        }
        labelAltitude={(d: any) =>
          d.labelType === "country" ? 0.005 : 0.015
        }
        labelResolution={2}
        // Moving message text
        htmlElementsData={htmlElementsData}
        htmlElement={getMessageElement}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.04}
        htmlTransitionDuration={0}
        // Events
        onGlobeReady={handleGlobeReady}
        animateIn={true}
      />

      <Header />
      <MessagePanel
        isAnimating={animationStatus === "sending"}
        animationStatus={animationStatus}
        onSend={handleSendMessage}
        onReset={() => {
          setAnimationStatus("idle");
          setMessagePaths([]);
          setRouteCableIds(new Set());
          setMsgLabelPos(null);
          cancelAnimationFrame(msgAnimRaf.current);
          if (globeRef.current) {
            globeRef.current.pointOfView(
              { lat: 5, lng: 108, altitude: 2.2 },
              1500
            );
          }
        }}
      />
      <Sidebar
        selectedCable={selectedCable}
        onSelectCable={handleSelectCable}
        onPointClick={handlePointClick}
      />

      {/* Bottom-right controls */}
      <div className="absolute bottom-6 right-[400px] z-10 flex items-center gap-2">
        {/* Auto-rotate toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="flex items-center gap-2 px-4 py-3 bg-[#0A0E1A]/90 backdrop-blur-xl border border-[#2362DD]/20 rounded-lg text-left active:bg-white/5 transition-colors min-h-[48px]"
        >
          <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${autoRotate ? "bg-[#2362DD]/40" : "bg-[#1A1F35]"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${autoRotate ? "left-5 bg-[#60A5FA]" : "left-0.5 bg-[#475569]"}`} />
          </div>
          <span className="text-[11px] font-semibold tracking-wider text-[#94A3B8]">
            ROTATE
          </span>
        </button>

        {/* Day/Night toggle */}
        <button
          onClick={() => setGlobeMode(globeMode === "night" ? "day" : "night")}
          className="flex items-center gap-2 px-4 py-3 bg-[#0A0E1A]/90 backdrop-blur-xl border border-[#2362DD]/20 rounded-lg text-left active:bg-white/5 transition-colors min-h-[48px]"
        >
          <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${globeMode === "night" ? "bg-[#1A1F35]" : "bg-[#2362DD]/40"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${globeMode === "night" ? "left-0.5 bg-[#60A5FA]" : "left-5 bg-[#FFD700]"}`} />
          </div>
          <span className="text-[11px] font-semibold tracking-wider text-[#94A3B8]">
            {globeMode === "night" ? "NIGHT" : "DAY"}
          </span>
        </button>
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-6 left-6 z-10 px-4 py-3 bg-[#0A0E1A]/90 backdrop-blur-xl border border-[#2362DD]/20 rounded-lg pointer-events-none">
        <div className="text-[10px] text-[#60A5FA] font-bold tracking-[0.1em] mb-2">
          CONTROLS
        </div>
        <div className="space-y-1 text-[11px] text-[#94A3B8]">
          <div>DRAG &mdash; Rotate globe</div>
          <div>PINCH &mdash; Zoom in/out</div>
          <div>TAP &mdash; Select cable/point</div>
        </div>
      </div>
    </div>
  );
}
