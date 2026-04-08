
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { UserProfile, DossierEntry } from "../types";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

// --- NEW TOOL DEFINITIONS BASED ON SCHEMA ---

const updateHunterLicenseTool: FunctionDeclaration = {
  name: 'update_hunter_license',
  description: 'Updates profile basic facts. Keep data brief.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      codename: { type: Type.STRING, description: "Short Codename" },
      realname_title: { type: Type.STRING, description: "Short Title" },
      dob: { type: Type.STRING, description: "DD/MM/YYYY" },
      location: { type: Type.STRING },
      annual_goal: { type: Type.STRING, description: "Max 5 words" },
      monthly_goal: { type: Type.STRING },
      weekly_goal: { type: Type.STRING }
    }
  }
};

const manageDossierEntryTool: FunctionDeclaration = {
  name: 'manage_dossier_entry',
  description: 'Creates or updates a page in the Secret Dossier. EXTREMELY CONCISE content.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Unique title (Max 2-3 words)" },
      type: { type: Type.STRING, enum: ['TEXT', 'RADAR_CHART', 'BAR_CHART'], description: "Visual format" },
      content: { type: Type.STRING, description: "Markdown text. BULLET POINTS ONLY. NO PARAGRAPHS. Brief." },
      chart_data: { 
         type: Type.ARRAY, 
         items: { 
            type: Type.OBJECT, 
            properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER },
                maxValue: { type: Type.NUMBER }
            }
         },
         description: "Array of data points."
      },
      level: { type: Type.INTEGER, description: "Skill level (e.g. 5)" },
      current_progress: { type: Type.NUMBER, description: "Progress (e.g. 3)" },
      max_progress: { type: Type.NUMBER, description: "Target (e.g. 10)" },
      progress_label: { type: Type.STRING, description: "Short label (e.g. '3/10')" }
    },
    required: ['title', 'type', 'content']
  }
};

const createQuestTool: FunctionDeclaration = {
  name: 'create_quest',
  description: 'Creates NEW quests. Used by CLI only.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Max 3 words title" },
      description: { type: Type.STRING, description: "Max 10 words" },
      subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
      difficulty: { type: Type.STRING, enum: ['EASY', 'NORMAL', 'HARD', 'EXTREME', 'ABSURD'] },
      quest_type: { type: Type.STRING, enum: ['DAILY', 'WEEKLY', 'MAIN', 'SUDDEN'] },
      status: { type: Type.STRING, enum: ['Not started', 'On hold', 'In process', 'High priority', 'Archived', 'Cancelled', 'Failed', 'Done'] },
      time_mode: { type: Type.STRING, enum: ['Keine', 'Deadline', 'Termin', 'Zeitraum'] },
      start_date: { type: Type.STRING, description: "ISO 8601 or HH:MM" },
      due_date: { type: Type.STRING, description: "ISO 8601 or HH:MM" },
      duration_minutes: { type: Type.INTEGER },
      recurrence_active: { type: Type.BOOLEAN },
      recurrence_interval: { type: Type.STRING, enum: ['Täglich', 'Wöchentlich', 'Intervall'] },
      interval_days: { type: Type.INTEGER },
      skip_days: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] } },
      alarm_active: { type: Type.BOOLEAN },
      warn_start_min: { type: Type.INTEGER },
      warn_end_min: { type: Type.INTEGER },
      main_classes: { type: Type.ARRAY, items: { type: Type.STRING } },
      sub_classes: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['title']
  }
};

const updateQuestTool: FunctionDeclaration = {
  name: 'update_quest',
  description: 'Modifies an EXISTING quest. Used by GARDENER. Provide ID or exact Title.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      identifier: { type: Type.STRING, description: "The ID (preferred) or Exact Title of the quest to update." },
      title: { type: Type.STRING, description: "New title (optional)" },
      description: { type: Type.STRING },
      difficulty: { type: Type.STRING, enum: ['EASY', 'NORMAL', 'HARD', 'EXTREME', 'ABSURD'] },
      status: { type: Type.STRING, enum: ['Not started', 'On hold', 'In process', 'High priority', 'Archived', 'Cancelled', 'Failed', 'Done'] },
      
      // Time updates
      time_mode: { type: Type.STRING, enum: ['Keine', 'Deadline', 'Termin', 'Zeitraum'] },
      start_date: { type: Type.STRING },
      due_date: { type: Type.STRING },
      duration_minutes: { type: Type.INTEGER },
      
      recurrence_active: { type: Type.BOOLEAN },
      recurrence_interval: { type: Type.STRING, enum: ['Täglich', 'Wöchentlich', 'Intervall'] },
      
      main_classes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Replaces existing classes" },
      sub_classes: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['identifier']
  }
};

const deleteElementTool: FunctionDeclaration = {
  name: 'delete_element',
  description: 'Permanently deletes a Quest or Class.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['QUEST', 'CLASS', 'SUBCLASS'] },
      identifier: { type: Type.STRING, description: "ID (preferred) or Title" },
      parent_id: { type: Type.STRING, description: "Required only if deleting SUBCLASS (ID of parent)" }
    },
    required: ['type', 'identifier']
  }
};

const createClassTool: FunctionDeclaration = {
  name: 'create_class',
  description: 'Creates a main class category. Used by CLI.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "One word title" },
      subtitle: { type: Type.STRING, description: "Max 2 words" },
      icon_image: { type: Type.STRING }
    },
    required: ['title']
  }
};

const createSubclassTool: FunctionDeclaration = {
  name: 'create_subclass',
  description: 'Creates a subclass tied to a main class. Used by CLI.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "One word title" },
      parent_class_id: { type: Type.STRING, description: "The ID or the exact Name of the parent class" }
    },
    required: ['title', 'parent_class_id']
  }
};

const restructureClassesTool: FunctionDeclaration = {
  name: 'restructure_classes',
  description: 'Moves existing classes. Used by GARDENER.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      new_parent_class_name: { type: Type.STRING, description: "One word title" },
      classes_to_move: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Names or IDs"
      }
    },
    required: ['new_parent_class_name', 'classes_to_move']
  }
};

const createBlackMarketItemTool: FunctionDeclaration = {
  name: 'create_black_market_item',
  description: 'Creates a shop item.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Short Name" },
      item_type: { type: Type.STRING, enum: ['Reward', 'Penalty'] },
      frequency: { type: Type.STRING, enum: ['Multi', 'Once'] },
      rank: { type: Type.STRING, enum: ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] }
    },
    required: ['name', 'item_type', 'rank']
  }
};

const tools = [
    updateHunterLicenseTool, 
    manageDossierEntryTool, 
    createQuestTool, 
    updateQuestTool, // NEW
    deleteElementTool, // NEW
    createClassTool, 
    createSubclassTool, 
    restructureClassesTool, 
    createBlackMarketItemTool
];

// --- API FUNCTION ---

export const processSystemCommand = async (
  input: string,
  appContext: string,
  systemInstructionOverride?: string
) => {
  const ai = getClient();
  const now = new Date();
  
  // Base Time Context (Always included)
  const timeContext = `
  // --- REAL-TIME CONTEXT ---
  CURRENT YEAR: ${now.getFullYear()}
  CURRENT DATE: ${now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
  CURRENT TIME: ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
  `;

  // Use override if provided, otherwise default to SYSTEM_INSTRUCTION
  const baseInstruction = systemInstructionOverride || SYSTEM_INSTRUCTION;

  const fullSystemPrompt = `${baseInstruction}
  ${timeContext}
  
  // --- USER APP STATE ---
  ${appContext}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: input }] }],
    config: {
      systemInstruction: fullSystemPrompt,
      tools: [{ functionDeclarations: tools }],
      temperature: 0.1, 
    }
  });

  return response;
};

// Legacy Chat - Now constructs a lightweight profile context to save tokens
export const chatWithMentor = async (
  history: { role: string; text: string }[], 
  newMessage: string,
  profile: UserProfile
) => {
    // Optimized Context: Only Index of Dossier, not full content
    const dossierIndex = profile.dossier && profile.dossier.length > 0 
        ? profile.dossier.map(d => `"${d.title}" (${d.type})`).join(', ') 
        : "EMPTY";

    const context = `
    PROFILE SUMMARY:
    Name: ${profile.name}
    Title: ${profile.title}
    Stats: ${JSON.stringify(profile.stats)}
    Psychometrics: ${JSON.stringify(profile.psychometrics)}
    Current Focus: ${profile.dailyFocus}
    
    DOSSIER INDEX (Existing Pages): [${dossierIndex}]
    (Use 'manage_dossier_entry' to create pages. KEEP IT BRIEF.)
    `;

    return processSystemCommand(newMessage, context);
};

// NEW: Generates a specific profiling question based on existing dossier
export const generateProfilingQuestion = async (
    profile: UserProfile,
    activeEntry?: DossierEntry | null
) => {
    const ai = getClient();
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const currentWeek = Math.ceil((now.getDate() - 1 - now.getDay()) / 7);

    // Construct Dossier Summary
    const dossierIndex = profile.dossier && profile.dossier.length > 0
        ? profile.dossier.map(d => `[Titel: ${d.title} | Typ: ${d.type}]`).join(', ')
        : "Keine Einträge.";

    const prompt = `
    ROLLE: Elite Profiler / Auditor.
    
    KONTEXT:
    Heute: ${dateStr}
    Offenes Dok: "${activeEntry ? activeEntry.title : 'Deckblatt'}"
    
    OFFENES DOKUMENT (FOKUS):
    ${activeEntry ? JSON.stringify(activeEntry, null, 2) : "Kein spezifischer Eintrag offen."}
    
    AUFGABE:
    Generiere EINE einzige, direkte Frage an den User.
    
    LOGIK:
    1. Wenn Daten fehlen (aktuelle Woche), frage danach.
    2. Wenn alles da ist, frage nach dem nächsten Schritt.
    
    ANWEISUNGEN:
    - NUR die Frage.
    - DEUTSCH.
    - EXTREM KURZ (Max 10-15 Wörter).
    - Beispiel: "Wochenziel erreicht?", "Neuer Umsatz?", "Training erledigt?"
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.5 }
    });

    return response.text;
};
