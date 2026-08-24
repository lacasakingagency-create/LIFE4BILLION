import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

let founderSpotsRemaining = 23;
const FOUNDER_SPOTS_FILE = path.join("/tmp", ".founder_spots.json");

function getFounderSpots(): { remaining: number; total: number; soldOut: boolean } {
  try {
    if (fs.existsSync(FOUNDER_SPOTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(FOUNDER_SPOTS_FILE, "utf-8"));
      if (typeof data.remaining === "number") {
        founderSpotsRemaining = Math.max(0, data.remaining);
      }
    } else {
      try {
        fs.writeFileSync(FOUNDER_SPOTS_FILE, JSON.stringify({ remaining: 23, total: 30 }));
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    // ignore
  }

  return {
    remaining: founderSpotsRemaining,
    total: 30,
    soldOut: founderSpotsRemaining <= 0
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const spots = getFounderSpots();
  return res.status(200).json(spots);
}

