import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasServerKey: !!process.env.GEMINI_API_KEY,
  });
});

// API: Check config / provider status
app.get("/api/config", (req, res) => {
  res.json({
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    defaultModel: "gemini-3.8-flash",
  });
});

// API: Process player command to autonomous AI crew
app.post("/api/crew-command", async (req, res) => {
  try {
    const {
      command,
      shipState,
      crewStatus,
      currentEncounter,
      recentHistory = [],
      provider = "gemini",
      customKey,
    } = req.body;

    if (!command || typeof command !== "string") {
      return res.status(400).json({ error: "Command string is required." });
    }

    const effectiveGeminiKey = customKey || process.env.GEMINI_API_KEY;

    // Handle OpenAI if user selected OpenAI and provided their custom key
    if (provider === "openai" && customKey) {
      try {
        const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You simulate the AI crew of a starship in Sector Null.
Crew:
1. Jax (Chief Engineer): Gruff, neurotic, protective of engines, panics if Hull < 50%. Capabilities: repair hull, divert energy, adjust speed, emergency engine patch.
2. Elara (Science Officer): Cold, logical, analytical, fascinated by spatial anomalies. Capabilities: scan anomalies, modulate shields, siphon energy, calculate trajectories.

Rules:
Return ONLY a valid JSON object matching:
{
  "dialogue": [
    {"speaker": "Jax" | "Elara" | "Ship AI", "text": "In-character response"}
  ],
  "actions": [
    {"type": "change_speed" | "change_energy" | "change_hull" | "change_shields" | "scan_anomaly" | "repair_engines", "value": number, "reason": "why"}
  ],
  "analysis": "Short 1-sentence tactical summary"
}`,
              },
              {
                role: "user",
                content: `Ship State: Hull ${shipState.hull}%, Energy ${shipState.energy}%, Speed ${shipState.speed}/5, Shields ${shipState.shields}%, Distance ${shipState.distance}ly.
Encounter: ${currentEncounter ? `${currentEncounter.title} (${currentEncounter.dangerLevel} danger) - ${currentEncounter.description}` : "Deep Space Cruise - No immediate threat"}
Crew Stress: Jax ${crewStatus.jaxStress}%, Elara curiosity ${crewStatus.elaraCuriosity}%.
Player Captain Command: "${command}"`,
              },
            ],
          }),
        });

        if (!openAiResponse.ok) {
          const errData = await openAiResponse.json().catch(() => ({}));
          throw new Error(errData.error?.message || `OpenAI API returned status ${openAiResponse.status}`);
        }

        const openAiData = await openAiResponse.json();
        const contentStr = openAiData.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(contentStr);
        return res.json(parsed);
      } catch (err: unknown) {
        console.error("OpenAI call error:", err);
        return res.status(500).json({
          error: (err as Error).message || "OpenAI execution error",
          fallbackNeeded: true,
        });
      }
    }

    // Default: Gemini via @google/genai
    if (!effectiveGeminiKey) {
      return res.status(401).json({
        error: "No Gemini API key available. Provide a custom key in Settings or use Simulation mode.",
        fallbackNeeded: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveGeminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `You simulate the AI crew of a starship in Sector Null.
The ship's crew consists of two primary autonomous officers:
1. Jax (Chief Engineer):
   - Persona: Gruff, blue-collar, neurotic, treats the ship's reactor like his baby. Constantly complains about overtaxing the warp coils.
   - Panic threshold: Prone to yelling and panic if Hull drops below 50% or if speed is set to 5 with low energy.
   - Capabilities: Can repair hull (consumes energy, e.g. +15 hull, -20 energy), divert energy (+/- energy), adjust speed (0 to 5), overhaul thrusters.
2. Elara (Science Officer):
   - Persona: Cold, hyper-logical, refined British cadence, endlessly curious about dangerous anomalies. Often ignores immediate danger if an anomaly is "fascinating" or mathematically sublime.
   - Capabilities: Can scan anomalies (reveals rewards/hazards), siphon cosmic energy from dust clouds/anomalies (+10 to +25 energy), modulate shields (+shields for -energy), calculate evasive vectors.

Game Rules & Constraints:
- Speed range is 0 to 5.
- Hull is 0 to 100. If 0, ship is destroyed.
- Energy is 0 to 100.
- Shields is 0 to 100.
- When Captain gives an order, BOTH Jax and Elara should react in-character. They can banter, argue, or agree based on their personalities.
- Generate realistic, balanced actions that reflect what the crew actually did.
- If the captain asks to repair without enough energy, Jax should protest. If scanning an anomaly, Elara leads.

Return strictly JSON matching the response schema.`;

    const encounterContext = currentEncounter
      ? `CURRENT THREAT/ENCOUNTER:
Title: ${currentEncounter.title}
Danger Level: ${currentEncounter.dangerLevel}
Status: ${currentEncounter.description}
Distance to clear: ${currentEncounter.distanceRemaining} km / ticks. Scanned: ${currentEncounter.scanned ? "YES" : "NO"}`
      : "CURRENT ENVIRONMENT: Deep space cruising. Sensors clear of active hazards.";

    const promptText = `CURRENT SHIP TELEMETRY:
- Hull Integrity: ${shipState.hull}%
- Auxiliary Energy Grid: ${shipState.energy}%
- Deflector Shields: ${shipState.shields}%
- Engine Speed: ${shipState.speed}/5
- Current Sector: ${shipState.sector} (Depth Level ${shipState.sectorLevel})
- Jax Stress Level: ${crewStatus.jaxStress}% (${crewStatus.jaxStatus})
- Elara Curiosity Level: ${crewStatus.elaraCuriosity}% (${crewStatus.elaraStatus})

${encounterContext}

CAPTAIN'S ORDER:
"${command}"

Interpret the captain's order in character, engage in realistic bridge dialogue between Jax and Elara (and optional Ship AI confirmation), and output actionable game system state changes.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogue: {
              type: Type.ARRAY,
              description: "Crew dialogue spoken in response to the captain",
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: {
                    type: Type.STRING,
                    description: "Speaker name: 'Jax', 'Elara', or 'Ship AI'",
                  },
                  text: {
                    type: Type.STRING,
                    description: "Spoken line in distinct persona",
                  },
                },
                required: ["speaker", "text"],
              },
            },
            actions: {
              type: Type.ARRAY,
              description: "Game engine state delta actions executed by the crew",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description:
                      "Action type: change_speed, change_energy, change_hull, change_shields, scan_anomaly, repair_engines, evasive_burn",
                  },
                  value: {
                    type: Type.NUMBER,
                    description: "Numeric adjustment value (can be negative or positive)",
                  },
                  reason: {
                    type: Type.STRING,
                    description: "Reason for this action",
                  },
                },
                required: ["type", "value"],
              },
            },
            analysis: {
              type: Type.STRING,
              description: "Short 1-sentence tactical officer log summary",
            },
          },
          required: ["dialogue", "actions"],
        },
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    res.json(parsed);
  } catch (error: unknown) {
    console.error("Crew command endpoint error:", error);
    res.status(500).json({
      error: (error as Error).message || "Internal server error during LLM generation",
      fallbackNeeded: true,
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sector Null Bridge Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
