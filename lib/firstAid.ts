export interface FirstAidTopic {
  id: string;
  title: string;
  emoji: string;
  /** keywords / synonyms used for intent matching */
  triggers: string[];
  /** ordered, do-this-now steps */
  steps: string[];
  /** the single most important warning */
  warning?: string;
}

export const FIRST_AID_TOPICS: FirstAidTopic[] = [
  {
    id: "bleeding",
    title: "Severe Bleeding",
    emoji: "🩸",
    triggers: ["bleed", "bleeding", "blood", "cut", "wound", "haemorrhage", "hemorrhage"],
    steps: [
      "Call the ambulance number shown at the top of the app first.",
      "Press firmly on the wound with a clean cloth or your hand. Do not stop to wash it.",
      "Keep pressing continuously — at least 10 minutes — without lifting to peek.",
      "If blood soaks through, add more cloth on top; do NOT remove the first layer.",
      "If you can, raise the injured limb above the level of the heart.",
      "Keep the person warm and lying down until help arrives.",
    ],
    warning: "Do not apply a tourniquet unless bleeding is life-threatening and you are trained.",
  },
  {
    id: "unconscious",
    title: "Unconscious / Not Responding",
    emoji: "😵",
    triggers: ["unconscious", "not breathing", "no pulse", "passed out", "fainted", "unresponsive", "not responding", "collapse"],
    steps: [
      "Call emergency services immediately — use the ambulance button above.",
      "Check if they respond: tap shoulders and shout. Check for normal breathing for 10 seconds.",
      "If breathing: gently roll them onto their side (recovery position) and tilt head back to keep the airway open.",
      "If NOT breathing: start CPR — push hard and fast in the centre of the chest, ~2 per second, 30 pushes.",
      "Then give 2 rescue breaths if trained, and continue 30 pushes : 2 breaths.",
      "Do not stop CPR until help arrives or the person starts breathing.",
    ],
    warning: "Do not move someone with a suspected spinal injury unless they are in immediate danger.",
  },
  {
    id: "burns",
    title: "Burns",
    emoji: "🔥",
    triggers: ["burn", "burnt", "fire", "scald", "hot"],
    steps: [
      "Move the person away from the heat source / vehicle if it is safe.",
      "Cool the burn under cool (not ice-cold) running water for at least 20 minutes.",
      "Remove rings, watches and tight clothing near the burn before it swells — unless stuck to the skin.",
      "Cover loosely with cling film or a clean, non-fluffy cloth.",
      "Do NOT apply creams, butter, ice, or burst any blisters.",
    ],
    warning: "Call emergency services for any large, deep, facial, or electrical/chemical burn.",
  },
  {
    id: "fracture",
    title: "Broken Bone / Fracture",
    emoji: "🦴",
    triggers: ["fracture", "broken", "bone", "limb", "arm", "leg", "sprain", "dislocat"],
    steps: [
      "Keep the injured part still — do not try to straighten or push bones back.",
      "Support the limb in the position found using rolled clothing or a cushion.",
      "Apply something cold (wrapped) to reduce swelling, for up to 20 minutes.",
      "Do not give food or drink in case surgery is needed.",
      "Watch for signs of shock (pale, cold, fast breathing) and keep them warm.",
    ],
    warning: "If a bone breaks the skin, cover it with a clean dressing and do not press directly on it.",
  },
  {
    id: "shock",
    title: "Shock",
    emoji: "💧",
    triggers: ["shock", "pale", "cold sweat", "dizzy", "faint", "weak pulse"],
    steps: [
      "Lay the person down and raise their legs above the level of their heart.",
      "Loosen tight clothing at the neck, chest and waist.",
      "Keep them warm with a coat or blanket.",
      "Reassure them and keep them still. Do not give food or drink.",
      "Monitor breathing and be ready to start CPR if they stop breathing.",
    ],
    warning: "Shock after a crash can be life-threatening even without visible injury — get medical help.",
  },
  {
    id: "spinal",
    title: "Head / Neck / Spine Injury",
    emoji: "🧠",
    triggers: ["spine", "spinal", "neck", "head", "back injury", "paralys", "whiplash", "can't move"],
    steps: [
      "Do NOT move the person unless they are in immediate danger (fire, traffic).",
      "Tell them to stay still and keep their head in line with their body.",
      "Steady and support their head with your hands in the position you found it.",
      "Call emergency services and keep monitoring their breathing.",
      "If they vomit or stop breathing, you may need to move them — do so keeping the head and spine aligned.",
    ],
    warning: "Wrong movement can cause permanent paralysis — keep them still and wait for trained help.",
  },
  {
    id: "trapped",
    title: "Trapped in Vehicle / Fire Risk",
    emoji: "🚗",
    triggers: ["trapped", "stuck", "vehicle on fire", "car fire", "smoke", "fuel leak", "petrol", "smell"],
    steps: [
      "Turn off the engine if you can reach the ignition safely.",
      "If there is fire, smoke, or fuel smell, get everyone out and at least 50 m away.",
      "Do not remove a trapped, injured person unless there is fire or immediate danger.",
      "Put on hazard lights and place a warning triangle ~45 m behind the vehicle if available.",
      "Call emergency services and tell them how many people are involved and if anyone is trapped.",
    ],
    warning: "Never go back into a burning vehicle for belongings.",
  },
  {
    id: "choking",
    title: "Choking",
    emoji: "🫁",
    triggers: ["chok", "can't breathe", "obstruct", "swallow", "airway"],
    steps: [
      "Encourage them to cough if they can.",
      "If they cannot breathe or speak, give up to 5 sharp back blows between the shoulder blades.",
      "If that fails, give up to 5 abdominal thrusts (hands above the navel, pull in and up).",
      "Alternate 5 back blows and 5 thrusts until the object clears.",
      "If they become unconscious, call emergency services and start CPR.",
    ],
  },
];

const GENERIC_GUIDANCE: string[] = [
  "Make sure you and the scene are safe before helping — watch for traffic and fire.",
  "Call the emergency numbers shown at the top of the app.",
  "Check the injured person: are they responsive? Are they breathing?",
  "Control any heavy bleeding with firm, continuous pressure.",
  "Keep them still and warm, and reassure them until help arrives.",
];

export interface AssistantResult {
  topic?: FirstAidTopic;
  matched: boolean;
  steps: string[];
  warning?: string;
  intro: string;
}

// Lightweight offline intent matcher — scores each topic by trigger hits.
export function answerFirstAid(question: string): AssistantResult {
  const q = question.toLowerCase();
  let best: FirstAidTopic | null = null;
  let bestScore = 0;

  for (const topic of FIRST_AID_TOPICS) {
    let score = 0;
    for (const t of topic.triggers) {
      if (q.includes(t)) score += t.length; // longer matches weigh more
    }
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }

  if (best && bestScore > 0) {
    return {
      topic: best,
      matched: true,
      steps: best.steps,
      warning: best.warning,
      intro: `Here's what to do for ${best.title.toLowerCase()}. Stay calm — act on each step in order.`,
    };
  }

  return {
    matched: false,
    steps: GENERIC_GUIDANCE,
    intro:
      "I'll guide you through the basics. If this is life-threatening, call the emergency number at the top now.",
  };
}
