import { cableRoutes } from "@/data/cableRoutes";
import { landingPoints } from "@/data/landingPoints";
import { RouteStep } from "./types";

interface GraphEdge {
  neighbor: string; // city name
  cableId: string;
  segment: { fromPoint: string; toPoint: string; coords: [number, number][] };
}

// Build adjacency list from cable segments (bidirectional)
function buildGraph(): Map<string, GraphEdge[]> {
  const graph = new Map<string, GraphEdge[]>();

  for (const route of cableRoutes) {
    for (const seg of route.segments) {
      // Forward: from → to
      if (!graph.has(seg.fromPoint)) graph.set(seg.fromPoint, []);
      graph.get(seg.fromPoint)!.push({
        neighbor: seg.toPoint,
        cableId: route.cableId,
        segment: seg,
      });

      // Reverse: to → from
      if (!graph.has(seg.toPoint)) graph.set(seg.toPoint, []);
      graph.get(seg.toPoint)!.push({
        neighbor: seg.fromPoint,
        cableId: route.cableId,
        segment: seg,
      });
    }
  }

  return graph;
}

const graph = buildGraph();

// Map landing point ID to city name
export function idToCity(id: string): string | null {
  const point = landingPoints.find((p) => p.id === id);
  return point?.city ?? null;
}

/**
 * Find the cable route between two landing points (by ID).
 * Returns ordered RouteSteps with coords oriented in travel direction.
 */
export function findRoute(originId: string, destId: string): RouteStep[] | null {
  const originCity = idToCity(originId);
  const destCity = idToCity(destId);
  if (!originCity || !destCity || originCity === destCity) return null;

  // BFS to find shortest path
  const visited = new Set<string>();
  const parent = new Map<string, { city: string; edge: GraphEdge }>();
  const queue: string[] = [originCity];
  visited.add(originCity);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === destCity) break;

    const edges = graph.get(current) || [];
    for (const edge of edges) {
      if (!visited.has(edge.neighbor)) {
        visited.add(edge.neighbor);
        parent.set(edge.neighbor, { city: current, edge });
        queue.push(edge.neighbor);
      }
    }
  }

  if (!parent.has(destCity)) return null; // No route found

  // Reconstruct path
  const steps: RouteStep[] = [];
  let current = destCity;
  while (parent.has(current)) {
    const { city: prev, edge } = parent.get(current)!;
    // Orient coords in travel direction
    const isForward = edge.segment.fromPoint === prev;
    const coords = isForward
      ? edge.segment.coords
      : ([...edge.segment.coords].reverse() as [number, number][]);

    steps.unshift({
      cableId: edge.cableId,
      segment: edge.segment,
      coords,
    });
    current = prev;
  }

  return steps;
}
