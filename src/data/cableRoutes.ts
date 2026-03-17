import { CableRoute } from "@/lib/types";

export const cableRoutes: CableRoute[] = [
  // BDM - Batam Dumai Melaka
  // Traced from submarinecablemap.com — Y-shape: Melaka drops south to junction,
  // then forks west to Dumai (near Rupat Island) and east to Batam (through Strait of Malacca)
  {
    cableId: "bdm",
    segments: [
      {
        fromPoint: "Melaka",
        toPoint: "Dumai",
        coords: [
          [2.196, 102.2405],  // Melaka CLS
          [1.90, 101.80],     // Direct SW crossing — mid-strait (open water)
          [1.6944, 101.445],  // Dumai CLS
        ],
      },
      {
        fromPoint: "Dumai",
        toPoint: "Batam",
        coords: [
          [1.6944, 101.445],  // Dumai CLS
          [1.73, 102.00],     // East — north of Rupat Island (water channel)
          [1.70, 102.50],     // East — north of Bengkalis Island (water channel)
          [1.60, 103.00],     // Through strait, slight descent
          [1.40, 103.40],     // Descending toward Singapore Strait
          [1.25, 103.75],     // Through Singapore Strait (south of Singapore)
          [1.1494, 104.0249], // Batam CLS
        ],
      },
    ],
  },

  // MCT - Malaysia-Cambodia-Thailand
  // Traced from submarinecablemap.com — Y-shape: shared trunk from Cherating north,
  // branching to Rayong (NW through Gulf of Thailand) and Sihanoukville (NE)
  {
    cableId: "mct",
    segments: [
      {
        fromPoint: "Cherating",
        toPoint: "Rayong",
        coords: [
          [4.1259, 103.3939], // Cherating CLS
          [4.80, 103.55],     // North along east coast
          [5.50, 103.60],     // Past Kuantan coast
          [6.20, 103.45],     // East of Terengganu
          [6.80, 103.15],     // Southern Gulf entrance
          [7.30, 102.80],     // Junction zone (branch point)
          [7.90, 102.30],     // Curving NW into Gulf of Thailand
          [8.60, 101.80],     // Mid Gulf
          [9.50, 101.40],     // Upper Gulf
          [10.50, 101.20],    // Approaching Thai waters
          [11.50, 101.15],    // Near Thai coast
          [12.67, 101.27],    // Rayong CLS
        ],
      },
      {
        fromPoint: "Cherating",
        toPoint: "Sihanoukville",
        coords: [
          [4.1259, 103.3939], // Cherating CLS (shared trunk)
          [4.80, 103.55],     // Shared with Rayong branch
          [5.50, 103.60],     // Shared
          [6.20, 103.45],     // Shared
          [6.80, 103.15],     // Shared
          [7.30, 102.80],     // Junction zone — diverges NE here
          [7.90, 103.05],     // NE toward Cambodia
          [8.60, 103.20],     // Eastern Gulf of Thailand
          [9.40, 103.35],     // Approaching Cambodia coast
          [10.00, 103.45],    // Near Sihanoukville
          [10.5922, 103.5413], // Sihanoukville CLS
        ],
      },
    ],
  },

  // SKR1M - Sistem Kabel Rakyat 1Malaysia
  // Traced from submarinecablemap.com — large loop connecting Peninsular Malaysia to Borneo
  // Coastal route south (Cherating→Mersing), crossing to Borneo, coastal north along Borneo,
  // then return crossing at higher latitude back to Cherating
  {
    cableId: "skr1m",
    segments: [
      {
        fromPoint: "Cherating",
        toPoint: "Kuantan",
        coords: [
          [4.1259, 103.3939], // Cherating
          [3.95, 103.30],
          [3.7634, 103.2202], // Kuantan
        ],
      },
      {
        fromPoint: "Kuantan",
        toPoint: "Mersing",
        coords: [
          [3.7634, 103.2202], // Kuantan
          [3.30, 103.40],
          [2.90, 103.60],
          [2.4309, 103.8361], // Mersing
        ],
      },
      {
        // Crossing South China Sea — dips south before going east to Borneo
        fromPoint: "Mersing",
        toPoint: "Kuching",
        coords: [
          [2.4309, 103.8361], // Mersing
          [2.10, 104.30],     // SE into open sea
          [1.60, 105.20],     // Dipping south
          [1.20, 106.30],     // Low point of crossing
          [1.00, 107.50],     // Southern arc
          [1.10, 108.60],     // Curving NE toward Borneo
          [1.30, 109.50],     // Approaching Kuching
          [1.5531, 110.345],  // Kuching CLS
        ],
      },
      {
        // Borneo coast — goes offshore NW then back to Bintulu
        fromPoint: "Kuching",
        toPoint: "Bintulu",
        coords: [
          [1.5531, 110.345],  // Kuching CLS
          [2.00, 110.80],     // Offshore NE
          [2.60, 111.40],     // Out to sea
          [3.00, 112.10],     // Offshore arc
          [3.1943, 113.0953], // Bintulu CLS
        ],
      },
      {
        fromPoint: "Bintulu",
        toPoint: "Miri",
        coords: [
          [3.1943, 113.0953], // Bintulu CLS
          [3.50, 113.30],
          [3.90, 113.60],
          [4.3995, 113.9914], // Miri CLS
        ],
      },
      {
        fromPoint: "Miri",
        toPoint: "Kota Kinabalu",
        coords: [
          [4.3995, 113.9914], // Miri CLS
          [4.60, 114.30],
          [4.90, 114.80],
          [5.20, 115.20],
          [5.50, 115.60],
          [5.9804, 116.0735], // Kota Kinabalu CLS
        ],
      },
      {
        // Return crossing — goes NORTH first (lat ~6.5-7) then curves SW back to Cherating
        fromPoint: "Kota Kinabalu",
        toPoint: "Cherating",
        coords: [
          [5.9804, 116.0735], // Kota Kinabalu CLS
          [6.30, 115.00],     // NW from KK
          [6.50, 113.50],     // Reaching northern arc
          [6.40, 112.00],     // High latitude crossing
          [6.10, 110.50],     // Curving SW
          [5.70, 109.00],     // Continuing SW
          [5.30, 107.50],     // Descending
          [4.90, 106.00],     // Approaching Peninsular Malaysia
          [4.50, 104.80],     // Near east coast
          [4.1259, 103.3939], // Cherating CLS
        ],
      },
    ],
  },
];
