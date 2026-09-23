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
Officers:
1. Jax (Chief Engineer): Gruff, protective of engines, repairs hull, adjusts throttle/speed, diverts energy.
2. Elara (Science Officer): Cold, hyper-logical, British cadence, modulates shields, scans anomalies, siphons energy.

ROUTING RULES:
- If Captain addresses a specific officer (e.g., "Jax, ...", "Elara, ..."), route to that officer.
- For 1-on-1 checks or personal questions (e.g., "Elara, hows your stress?"), ONLY the addressed officer must respond. The other officer MUST NOT interrupt.
- If unaddressed, route according to domain: Jax for speed/throttle/engines/hull; Elara for shields/sensors/anomalies/science.
- If addressed to "Crew" or "Both", both may speak.

INTENT & ACTION RULES:
- "action": Captain demands a concrete physical action (e.g. "reduce throttle", "boost shields", "repair hull"). Return the corresponding state delta in "actions".
- "query" / "conversation": Captain asks a question, checks status, or asks about emotional state (e.g. "Elara, hows your stress?", "Jax, what's engine temp?"). "actions" MUST BE AN EMPTY ARRAY []. The officer must directly answer based on their current telemetry (stress, curiosity, etc.).

CRITICAL HULL STATE (<20%):
- If shipState.hull < 20, the ship is in extreme distress. All crew dialogue MUST convey acute urgency, panic from Jax regarding collapsing bulkheads, and alarming failure probability calculations from Elara.

Return valid JSON with:
{
  "routedOfficer": "Jax" | "Elara" | "Both" | "Ship AI",
  "intent": "action" | "query" | "conversation",
  "dialogue": [{"speaker": "Jax" | "Elara" | "Ship AI", "text": "string"}],
  "actions": [{"type": "change_speed" | "change_energy" | "change_hull" | "change_shields" | "scan_anomaly" | "evasive_burn", "value": number, "reason": "string"}],
  "analysis": "Short 1-sentence tactical summary"
}`,
              },
              {
                role: "user",
                content: `Current Telemetry:
Hull: ${shipState.hull}%, Energy: ${shipState.energy}%, Speed: ${shipState.speed}/5, Shields: ${shipState.shields}%
Jax: Stress ${crewStatus.jaxStress}% (${crewStatus.jaxStatus})
Elara: Stress ${crewStatus.elaraStress ?? 12}%, Curiosity ${crewStatus.elaraCuriosity}% (${crewStatus.elaraStatus})
Encounter: ${currentEncounter ? `${currentEncounter.title} (${currentEncounter.dangerLevel} danger) - ${currentEncounter.description}` : "Clear space"}
Captain's Order: "${command}"`,
              },
            ],
          }),
        });

        if (!openAiResponse.ok) {
          const errData = await openAiResponse.json().catch(() => ({}));
          const status = openAiResponse.status >= 400 && openAiResponse.status < 600 ? openAiResponse.status : 500;
          return res.status(status).json({
            error: errData.error?.message || `OpenAI API returned status ${openAiResponse.status}`,
            fallbackNeeded: true,
          });
        }

        const openAiData = await openAiResponse.json();
        const contentStr = openAiData.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(contentStr);
        return res.json(parsed);
      } catch (err: unknown) {
        console.error("OpenAI call error:", err);
        const errObj = err as any;
        let status = typeof errObj?.status === "number" ? errObj.status : 500;
        const msg = (err as Error)?.message || "";
        if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) {
          status = 429;
        }
        return res.status(status >= 400 && status < 600 ? status : 500).json({
          error: msg || "OpenAI execution error",
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
The bridge officers are:
1. Jax (Chief Engineer):
   - Persona: Gruff, blue-collar, protective of engines, treats the reactor like his baby. Complains about overtaxing the warp coils, prone to panic if Hull < 50%.
   - Domain & Capabilities: Engine throttle & speed adjustments (0-5), emergency nanite hull repair (costs energy), auxiliary energy rerouting, thruster maintenance.
2. Elara (Science Officer):
   - Persona: Cold, hyper-logical, refined British cadence, endlessly curious about dangerous spatial phenomena.
   - Domain & Capabilities: Deflector shield modulation (costs energy), deep sensor sweeps of anomalies/hazards, siphoning cosmic/ambient energy (+energy), calculating evasive trajectories.

ROUTING RULES (STRICT):
1. Specifically Addressed:
   - If the Captain explicitly names or addresses an officer (e.g., "Jax, ...", "Elara, ...", "Chief", "Engineer", "Science Officer"):
     - That officer MUST be the primary respondent.
     - For 1-on-1 personal queries or status inquiries (such as "Elara, hows your stress?" or "Jax, how are you feeling?"): ONLY the addressed officer speaks! The other officer MUST NOT chime in or interrupt.
2. Unaddressed or General Orders:
   - If the Captain gives an unaddressed order without naming anyone (e.g. "Reduce throttle", "Raise shields", "Scan the nebula"):
     - Route to the officer responsible for that domain:
       * Jax for speed, throttle, propulsion, engines, hull repairs.
       * Elara for shields, sensor scans, spatial anomalies, energy harvesting.
3. Both / All Hands:
   - If addressed to "Crew", "Bridge", "All hands", or an event requiring dual action, both Jax and Elara may speak and coordinate.

INTENT & ACTION DISCRIMINATION RULES (STRICT):
1. Action Orders (intent = "action"):
   - The Captain is ordering an operational, mechanical, energetic, or navigational change (e.g. "Jax, reduce throttle", "Elara, raise shields", "repair hull", "full stop", "scan the hazard", "evasive roll").
   - The routed officer acknowledges and executes the action.
   - Return the concrete state deltas in the "actions" array:
     * change_speed: Delta to current speed (e.g. current speed 2, "reduce throttle" or "slow down" -> value: -1 resulting in speed 1; "full stop" -> value: -currentSpeed; "speed 4" -> value: +(4 - currentSpeed)). Speed is constrained between 0 and 5.
     * change_shields: Delta to shields (e.g. +20 to +25, costs energy).
     * change_energy: Delta to energy (e.g. -15 to -20 for shield boost or repairs; +20 to +30 for solar/tachyon siphon).
     * change_hull: Delta to hull (+15 to +20 for nanite patch, costs energy).
     * scan_anomaly: value 1 when scanning an active encounter.
     * evasive_burn: value 1 for evasive dodge maneuver.
2. Informational Queries & Status Checks (intent = "query" or "conversation"):
   - The Captain asks a question, checks status, inquires about crew condition, or engages in conversation (e.g., "Elara, hows your stress?", "Jax, what's our engine temp?", "Elara, what are the sensor readings?", "How is the reactor holding up?", "Good morning crew").
   - "actions" MUST BE AN EMPTY ARRAY []! Absolutely NO ship system modifications, throttle changes, or energy drains may occur.
   - For "Elara, hows your stress?": Elara MUST state her exact stress level as provided in telemetry (e.g. "My stress level is currently measured at ${crewStatus.elaraStress ?? 12}%, Captain...") and provide a calm, analytical explanation based on current environmental hazards and ship state.
   - For Jax's stress or status inquiries: Jax quotes his stress percentage and complains or responds in character.

Return strictly JSON conforming to the response schema.`;

    const encounterContext = currentEncounter
      ? `CURRENT THREAT/ENCOUNTER:
Title: ${currentEncounter.title}
Danger Level: ${currentEncounter.dangerLevel}
Status: ${currentEncounter.description}
Distance to clear: ${Math.round(currentEncounter.distanceRemaining)} km. Scanned: ${currentEncounter.scanned ? "YES" : "NO"}`
      : "CURRENT ENVIRONMENT: Deep space cruising. Sensors clear of active hazards.";

    const promptText = `CURRENT SHIP TELEMETRY:
- Hull Integrity: ${Math.round(shipState.hull)}%${shipState.hull < 20 ? ' [CRITICAL ALERT: HULL INTEGRITY < 20% - ACUTE DECOMPRESSION RISK! CREW IN PANIC!]' : ''}
- Auxiliary Energy Grid: ${Math.round(shipState.energy)}%
- Deflector Shields: ${Math.round(shipState.shields)}%
- Engine Speed: ${shipState.speed}/5
- Current Sector: ${shipState.sector} (Depth Level ${shipState.sectorLevel})
- Jax Stress Level: ${crewStatus.jaxStress}% (${crewStatus.jaxStatus})
- Elara Stress Level: ${crewStatus.elaraStress ?? 12}%
- Elara Curiosity Level: ${crewStatus.elaraCuriosity}% (${crewStatus.elaraStatus})

${encounterContext}

CAPTAIN'S INPUT:
"${command}"

Determine the routed officer, classify the intent ("action", "query", or "conversation"), formulate the in-character dialogue, and if and ONLY if it is an action order, provide the ship state delta actions. If it is a query (like asking Elara about her stress), provide a direct, accurate answer in dialogue and leave "actions" as an empty array [].`;

    const config = {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          routedOfficer: {
            type: Type.STRING,
            description: "The officer this command/query was routed to: 'Jax', 'Elara', 'Both', or 'Ship AI'",
          },
          intent: {
            type: Type.STRING,
            description: "Classification: 'action' if the order commands a ship action, 'query' if asking a question or checking status, or 'conversation'",
          },
          dialogue: {
            type: Type.ARRAY,
            description: "Crew spoken dialogue. If addressed directly to one officer (especially personal questions like stress), only that officer should speak.",
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: {
                  type: Type.STRING,
                  description: "Speaker name: 'Jax', 'Elara', or 'Ship AI'",
                },
                text: {
                  type: Type.STRING,
                  description: "In-character spoken line. If answering a status question (e.g. stress), include the accurate metric.",
                },
              },
              required: ["speaker", "text"],
            },
          },
          actions: {
            type: Type.ARRAY,
            description: "Game system state delta actions. MUST BE EMPTY [] if intent is 'query' or 'conversation' or if the order does not request a physical action.",
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description:
                    "Action type: change_speed, change_energy, change_hull, change_shields, scan_anomaly, evasive_burn",
                },
                value: {
                  type: Type.NUMBER,
                  description: "Numeric adjustment value (delta relative to current value)",
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
            description: "Short 1-sentence tactical summary",
          },
        },
        required: ["routedOfficer", "intent", "dialogue", "actions"],
      },
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptText,
        config,
      });
    } catch (primaryErr: any) {
      const errMsg = (primaryErr as Error)?.message || "";
      if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
        console.warn("Primary model 503 high demand, attempting fallback to gemini-3.1-flash-lite...");
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: promptText,
          config,
        });
      } else {
        throw primaryErr;
      }
    }

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    res.json(parsed);
  } catch (error: unknown) {
    console.error("Crew command endpoint error:", error);
    const errObj = error as any;
    let status = typeof errObj?.status === "number" ? errObj.status : 500;
    const msg = (error as Error)?.message || "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("rate limit") || msg.includes("quota")) {
      status = 429;
    }
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: msg || "Internal server error during LLM generation",
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
