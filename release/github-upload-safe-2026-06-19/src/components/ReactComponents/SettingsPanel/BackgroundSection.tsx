import { useStore } from "@nanostores/react";
import { toast } from "sonner";
import {
  $activeCustomVisualizerPresetId,
  $absoluteLoudnessScaling,
  $backgroundBeatBrightness,
  $backgroundBeatGlowStrength,
  $backgroundDropImpact,
  $backgroundMovementSpeed,
  $backgroundResponse,
  $beatdropSpeedMultiplier,
  $calmSectionIntensity,
  $customVisualizerPresets,
  $globalGlowLimit,
  $loudSectionIntensity,
  $performanceMode,
  $perColorReactivity,
  $showNpvDynamicBg,
  $starAmount,
  $starBeatSensitivity,
  $starBrightness,
  $starShape,
  $starSize,
  $starTwinkleSpeed,
  $starVocalSensitivity,
  $starsEnabled,
  $staticBackgroundMode,
  $visualizerLanguage,
  $visualizerPreset,
} from "../../../utils/stores.ts";
import {
  applyCustomVisualizerPreset,
  applyVisualizerPreset,
  createCustomVisualizerPreset,
  deleteCustomVisualizerPreset,
  duplicateVisualizerPreset,
  exportCustomVisualizerPresets,
  getCustomVisualizerPresets,
  importCustomVisualizerPresets,
  markVisualizerPresetCustom,
  renameCustomVisualizerPreset,
  resetCustomVisualizerPreset,
  updateCustomVisualizerPreset,
  type BuiltInVisualizerPreset,
  type VisualizerLanguage,
  type VisualizerPreset,
  VISUALIZER_PRESET_ORDER,
} from "../../../utils/visualizerSettings.ts";
import {
  matches,
  Row,
  SectionTitle,
  Select,
  Slider,
  SubsectionTitle,
  Toggle,
} from "./components.tsx";

const SECTION_NAME = "Background";
const bgModeOptions = ["off", "auto", "artistHeader", "coverArt", "color"];
const starShapeOptions = ["mixed", "softDot", "realStar", "sparkleStar", "crossStar"];
const languageOptions = ["english", "german"];
const performanceOptions = ["low", "medium", "high"];

interface Props {
  query: string;
  sectionFilter: string;
}

const copy = {
  english: {
    sectionTitle: "Background",
    disabledReason: "Set Static Background to Off to use the animated Kawarp background.",
    starsDisabledReason: "Enable Stars to tune the optional vocal star layer.",
    valueWords: {
      original: "Original",
      calmer: "Calmer",
      faster: "Faster",
      punchier: "Punchier",
      softer: "Softer",
      stronger: "Stronger",
      focused: "Focused",
      broader: "Broader",
      stricter: "Stricter",
      sensitive: "More Sensitive",
      safer: "Safer",
      open: "More Open",
      smoother: "Smoother",
      quicker: "Quicker",
      slower: "Slower",
      livelier: "Livelier",
      subtler: "Subtler",
      voiceLed: "More Vocal",
      gentler: "Gentler",
      beatLed: "More Beat-Led",
      sparse: "Sparse",
      balanced: "Balanced",
      dense: "Dense",
      dimmer: "Dimmer",
      brighter: "Brighter",
      smaller: "Smaller",
      larger: "Larger",
      darker: "Darker",
      local: "More Local",
      quieter: "Quieter",
      louder: "Louder",
    },
    groups: {
      setup: "Starting point",
      motion: "Wave motion",
      glow: "Wave glow",
      stars: "Star layer",
    },
    staticBackground: {
      label: "Static Background",
      description: "Pin the background to a fixed image or color instead of animating the cover.",
      options: ["Off", "Auto", "Artist Header", "Cover Art", "Color"],
    },
    npvBackground: {
      label: "Display Dynamic Background in Now Playing View",
      description: "Show the animated background in the Now Playing panel.",
    },
    preset: {
      label: "Preset",
      description:
        "Choose a ready-made starting point. Start with Cinematic if you want the best all-round preset. Vanilla restores the original Spicy Lyrics behavior.",
      notes: {
        custom:
          "Keeps your manual tuning exactly as it is. Pick another preset anytime to snap back to a clean starting point.",
        vanilla: "Exactly the stock Spicy Lyrics look. No added glow, stars, or extra energy.",
        smooth: "Calm and slow with a clearly visible but gentle wave glow.",
        cinematic: "Best balanced default. Deep contrast, smooth motion, and visible cover-color glow.",
        energetic: "Stronger local wave reactions, punchier drops, and controlled faster motion.",
        insane:
          "Maximum impact with strong color-driven glow, capped to avoid flat white flashing.",
        eventually:
          "Dreamy, psychedelic motion with soft flowing waves and magical vocal-focused stars.",
        strokesSnowStrippers:
          "Sharper pulses, more sparkle, and a lively party response without messy washout.",
      },
      options: {
        vanilla: "Vanilla",
        cinematic: "Cinematic",
        smooth: "Smooth",
        energetic: "Energetic",
        insane: "Insane",
        eventually: "Tame Impala / Eventually",
        strokesSnowStrippers: "Strokes / Snow Strippers",
        custom: "Custom (Manual)",
      },
    },
    customPresets: {
      label: "Custom Presets",
      description:
        "Save, duplicate, rename, reset, import, or export your own visualizer presets. Built-in presets stay protected.",
      saveNew: "Save New",
      saveSelected: "Save Selected",
      duplicate: "Duplicate",
      rename: "Rename",
      reset: "Reset",
      delete: "Delete",
      export: "Export",
      import: "Import",
      prefix: "Custom",
      manualOnly: "Manual settings",
      namePrompt: "Preset name",
      renamePrompt: "New preset name",
      importPrompt: "Paste exported custom preset JSON",
      deleteConfirm: "Delete this custom preset?",
      duplicatePrefix: "Copy of",
      selectedSuffix: "is selected.",
      copied: "Custom presets copied to clipboard.",
      imported: "custom preset(s) imported.",
      saved: "Custom preset saved.",
      updated: "Custom preset updated.",
      renamed: "Custom preset renamed.",
      resetDone: "Custom preset restored.",
      deleted: "Custom preset deleted.",
      failed: "Could not update custom presets.",
    },
    language: {
      label: "Language",
      description: "Choose the language used for these visualizer settings.",
      options: ["English", "German"],
    },
    movement: {
      label: "Movement Speed",
      description:
        "Changes the base Kawarp drift. Negative values slow the background down. Positive values speed it up. 0 keeps the original motion.",
    },
    beatdrop: {
      label: "Beatdrop Movement Boost",
      description:
        "Controls how much drops, choruses, and strong beat hits accelerate the waves. Higher values only push movement when the music earns it.",
    },
    waveGlow: {
      label: "Overall Wave Glow",
      description:
        "Main glow amount for the existing cover waves. Raise it for more illuminated color, lower it for a darker Kawarp look.",
    },
    localVariation: {
      label: "Local Wave Variation",
      description:
        "Controls how differently individual cover-color regions react. Higher values make some waves glow more than others instead of lifting the whole screen equally.",
    },
    brightness: {
      label: "Music Brightness",
      description:
        "Fine-tunes brightness after the glow shape is right. Lower it to preserve dark areas. Raise it if lit waves still feel too dim.",
    },
    impact: {
      label: "Impact Strength",
      description:
        "Controls how many wave regions activate and how strongly they participate during louder moments. It should add drama without flattening contrast.",
    },
    loudness: {
      label: "Quiet/Loud Detection",
      description:
        "Sets how selective the effect is about real song loudness. Negative values reserve strong glow for louder moments. Positive values let medium sections react sooner.",
    },
    calmIntensity: {
      label: "Calm Section Intensity",
      description:
        "Controls the glow floor during quiet parts. Lower values keep verses and piano sections darker. Higher values leave a soft ambient glow.",
    },
    loudIntensity: {
      label: "Loud Section Intensity",
      description:
        "Controls how far choruses and drops can open up. Higher values make more regions glow strongly while still using cover colors.",
    },
    glowLimit: {
      label: "Global Brightness Limit",
      description:
        "Caps the total light added by all glowing regions. Lower it if choruses wash out. Raise it only when you want louder sections to fill more of the field.",
    },
    response: {
      label: "Smoothing / Response",
      description:
        "Balance calmer smoothing against faster music response. Negative values feel more liquid and fluid. Positive values feel more immediate.",
    },
    performance: {
      label: "Performance Mode",
      description:
        "Trade overlay detail for lower render cost. This changes render detail, not the preset's personality. The Kawarp base remains intact in every mode.",
      notes: {
        low: "Uses fewer glow regions and stars with a lighter render load.",
        medium: "Balanced detail and performance for most systems.",
        high: "Fullest glow detail, highest render resolution, and the smoothest polish.",
      },
      options: ["Low", "Medium", "High"],
    },
    starsEnabled: {
      label: "Stars On/Off",
      description:
        "Enable the optional vocal/high-note star layer. Vanilla and the wave-only looks keep this off by default.",
    },
    starShape: {
      label: "Star Shape",
      description: "Choose how stars are drawn when the star layer is enabled.",
      notes: {
        mixed: "Cycles through all star types for a more varied field.",
        softDot: "Most subtle and ambient.",
        realStar: "Classic starburst with balanced spokes.",
        sparkleStar: "Sharper shimmer peaks with glittery diagonals.",
        crossStar: "Longer cross-shaped rays for a poppier look.",
      },
      options: ["Mixed", "Soft Dot", "Real Star", "Sparkle Star", "Cross Star"],
    },
    starAmount: {
      label: "Star Amount",
      description:
        "Adjust how many stars are visible when the layer is enabled. This changes scene density, not vocal sensitivity.",
    },
    starBrightness: {
      label: "Star Brightness",
      description:
        "Main control for visible twinkle strength. Increase this before adding more stars if you want more sparkle.",
    },
    starSize: {
      label: "Star Size",
      description:
        "Adjust the star size. This changes how present and readable each star shape feels, not the reaction timing.",
    },
    starTwinkle: {
      label: "Twinkle Speed",
      description:
        "Controls how quickly each star's shimmer pattern evolves. Lower values feel floatier. Higher values feel more lively.",
    },
    starVocalSensitivity: {
      label: "Vocal Sensitivity",
      description:
        "Controls how strongly singing and sustained vocal moments drive the star layer.",
    },
    starBeatSensitivity: {
      label: "Beat Sensitivity",
      description:
        "Controls how much drums and instrumental hits can push the stars. Keep this lower if you want stars to stay voice-led.",
    },
  },
  german: {
    sectionTitle: "Hintergrund",
    disabledReason:
      "Stelle den statischen Hintergrund auf Aus, um den animierten Kawarp-Hintergrund zu nutzen.",
    starsDisabledReason: "Aktiviere Sterne, um die optionale Vocal-Sternebene anzupassen.",
    valueWords: {
      original: "Original",
      calmer: "Ruhiger",
      faster: "Schneller",
      punchier: "Markanter",
      softer: "Sanfter",
      stronger: "Staerker",
      focused: "Fokussierter",
      broader: "Breiter",
      stricter: "Strenger",
      sensitive: "Sensibler",
      safer: "Sicherer",
      open: "Offener",
      smoother: "Weicher",
      quicker: "Direkter",
      slower: "Langsamer",
      livelier: "Lebendiger",
      subtler: "Subtiler",
      voiceLed: "Mehr Vocals",
      gentler: "Sanfter",
      beatLed: "Mehr Beat",
      sparse: "Weniger",
      balanced: "Ausgewogen",
      dense: "Dichter",
      dimmer: "Dunkler",
      brighter: "Heller",
      smaller: "Kleiner",
      larger: "Groesser",
      darker: "Dunkler",
      local: "Lokaler",
      quieter: "Leiser",
      louder: "Lauter",
    },
    groups: {
      setup: "Startpunkt",
      motion: "Wellenbewegung",
      glow: "Wellen-Glow",
      stars: "Sternebene",
    },
    staticBackground: {
      label: "Statischer Hintergrund",
      description:
        "Fixiert den Hintergrund auf ein festes Bild oder eine feste Farbe statt das Cover zu animieren.",
      options: ["Aus", "Auto", "Kuenstler-Header", "Cover-Art", "Farbe"],
    },
    npvBackground: {
      label: "Dynamischen Hintergrund in der Now-Playing-Ansicht anzeigen",
      description: "Zeigt den animierten Hintergrund auch im Now-Playing-Bereich an.",
    },
    preset: {
      label: "Preset",
      description:
        "Waehle einen guten Startpunkt. Wenn du den besten Allround-Preset willst, starte mit Cinematic. Vanilla stellt das originale Spicy-Lyrics-Verhalten wieder her.",
      notes: {
        custom:
          "Behaelt deine manuelle Abstimmung unveraendert bei. Du kannst jederzeit ein anderes Preset waehlen, um auf einen klaren Ausgangspunkt zurueckzugehen.",
        vanilla:
          "Genau der originale Spicy-Lyrics-Look. Kein zusaetzlicher Glow, keine Sterne und keine Extra-Energie.",
        smooth: "Ruhig und langsam mit einem klar sichtbaren, aber sanften Wellen-Glow.",
        cinematic:
          "Der beste Standard. Tiefer Kontrast, ruhige Bewegung und sichtbarer Coverfarben-Glow.",
        energetic:
          "Staerkere lokale Wellenreaktionen, markantere Drops und kontrolliert schnellere Bewegung.",
        insane:
          "Maximaler Impact mit starkem farbbasiertem Glow, aber begrenzt gegen flaches weisses Blitzen.",
        eventually:
          "Traeumerische, psychedelische Bewegung mit weichen Wellen und magischen, vocal-fokussierten Sternen.",
        strokesSnowStrippers:
          "Schaerfere Pulse, mehr Funkeln und eine schnellere, partyartige Reaktion.",
      },
      options: {
        vanilla: "Vanilla",
        cinematic: "Cinematic",
        smooth: "Sanft",
        energetic: "Energetisch",
        insane: "Extrem",
        eventually: "Tame Impala / Eventually",
        strokesSnowStrippers: "Strokes / Snow Strippers",
        custom: "Individuell (Manuell)",
      },
    },
    customPresets: {
      label: "Eigene Presets",
      description:
        "Speichere, dupliziere, benenne, setze zurueck, importiere oder exportiere eigene Visualizer-Presets. Eingebaute Presets bleiben geschuetzt.",
      saveNew: "Neu speichern",
      saveSelected: "Auswahl speichern",
      duplicate: "Duplizieren",
      rename: "Umbenennen",
      reset: "Zuruecksetzen",
      delete: "Loeschen",
      export: "Export",
      import: "Import",
      prefix: "Eigen",
      manualOnly: "Manuelle Werte",
      namePrompt: "Preset-Name",
      renamePrompt: "Neuer Preset-Name",
      importPrompt: "Exportiertes Custom-Preset-JSON einfuegen",
      deleteConfirm: "Dieses eigene Preset loeschen?",
      duplicatePrefix: "Kopie von",
      selectedSuffix: "ist ausgewaehlt.",
      copied: "Eigene Presets wurden in die Zwischenablage kopiert.",
      imported: "eigene(s) Preset(s) importiert.",
      saved: "Eigenes Preset gespeichert.",
      updated: "Eigenes Preset aktualisiert.",
      renamed: "Eigenes Preset umbenannt.",
      resetDone: "Eigenes Preset wiederhergestellt.",
      deleted: "Eigenes Preset geloescht.",
      failed: "Eigene Presets konnten nicht aktualisiert werden.",
    },
    language: {
      label: "Sprache",
      description: "Legt die Sprache fuer diese Visualizer-Einstellungen fest.",
      options: ["Englisch", "Deutsch"],
    },
    movement: {
      label: "Bewegungsgeschwindigkeit",
      description:
        "Veraendert die Kawarp-Grundbewegung. Negative Werte verlangsamen den Hintergrund. Positive Werte beschleunigen ihn. 0 behaelt die originale Bewegung.",
    },
    beatdrop: {
      label: "Beatdrop-Bewegungsboost",
      description:
        "Steuert, wie stark Drops, Refrains und Beat-Treffer die Wellen beschleunigen. Hoehere Werte greifen nur deutlich ein, wenn die Musik es hergibt.",
    },
    waveGlow: {
      label: "Gesamter Wellen-Glow",
      description:
        "Die Hauptmenge fuer den Glow der vorhandenen Cover-Wellen. Hoeher bedeutet mehr leuchtende Farbe, niedriger bedeutet dunklerer Kawarp-Look.",
    },
    localVariation: {
      label: "Lokale Wellenvariation",
      description:
        "Steuert, wie unterschiedlich einzelne Coverfarben-Regionen reagieren. Hoehere Werte lassen manche Wellen staerker leuchten statt den ganzen Bildschirm gleichmaessig anzuheben.",
    },
    brightness: {
      label: "Musik-Helligkeit",
      description:
        "Feinabstimmung der Helligkeit, nachdem die Glow-Form passt. Senke sie fuer dunklere Bereiche. Erhoehe sie, wenn beleuchtete Wellen zu dunkel wirken.",
    },
    impact: {
      label: "Impact-Staerke",
      description:
        "Steuert, wie viele Wellenregionen bei lauten Momenten aktiv werden und wie stark sie teilnehmen. Das bringt Drama, ohne den Kontrast flach zu machen.",
    },
    loudness: {
      label: "Leise/Laut-Erkennung",
      description:
        "Legt fest, wie selektiv der Effekt echte Song-Lautheit bewertet. Negative Werte reservieren starken Glow fuer laute Momente. Positive Werte lassen mittlere Stellen frueher reagieren.",
    },
    calmIntensity: {
      label: "Intensitaet ruhiger Stellen",
      description:
        "Steuert den Glow-Grundpegel in ruhigen Parts. Niedrigere Werte halten Strophen und Piano-Stellen dunkler. Hoehere Werte lassen einen weichen Ambient-Glow stehen.",
    },
    loudIntensity: {
      label: "Intensitaet lauter Stellen",
      description:
        "Steuert, wie weit Refrains und Drops aufgehen duerfen. Hoehere Werte lassen mehr Regionen stark leuchten, weiterhin mit Coverfarben.",
    },
    glowLimit: {
      label: "Globales Helligkeitslimit",
      description:
        "Begrenzt das gesamte Licht aller leuchtenden Regionen. Senke es, wenn Refrains ausbleichen. Erhoehe es nur, wenn laute Stellen mehr Feld fuellen sollen.",
    },
    response: {
      label: "Glaettung / Reaktion",
      description:
        "Balanciert ruhigere Glaettung gegen schnellere Musikreaktion. Negative Werte wirken fluessiger und weicher. Positive Werte reagieren direkter.",
    },
    performance: {
      label: "Performance-Modus",
      description:
        "Tauscht Overlay-Details gegen geringere Renderkosten. Das veraendert den Render-Detailgrad, nicht den Charakter des Presets. Die Kawarp-Basis bleibt in jedem Modus erhalten.",
      notes: {
        low: "Weniger Glow-Regionen und Sterne bei geringerer Last.",
        medium: "Ausgewogene Detailstufe fuer die meisten Systeme.",
        high: "Vollste Glow-Details, hoehere Render-Aufloesung und das sauberste Finish.",
      },
      options: ["Niedrig", "Mittel", "Hoch"],
    },
    starsEnabled: {
      label: "Sterne An/Aus",
      description:
        "Aktiviert die optionale Sternebene fuer Vocals/hohe Noten. Vanilla und die reinen Wellen-Looks lassen sie standardmaessig ausgeschaltet.",
    },
    starShape: {
      label: "Sternform",
      description: "Legt fest, wie Sterne gezeichnet werden, wenn die Sternebene aktiv ist.",
      notes: {
        mixed: "Mischt alle Sternformen fuer ein abwechslungsreicheres Feld.",
        softDot: "Am subtilsten und am atmosphaerischsten.",
        realStar: "Klassischer Stern mit ausgewogenen Spitzen.",
        sparkleStar: "Schaerfere Funkelspitzen mit glitzernden Diagonalen.",
        crossStar: "Laengere Kreuzstrahlen fuer einen poppigeren Look.",
      },
      options: ["Gemischt", "Weicher Punkt", "Echter Stern", "Funkelstern", "Kreuzstern"],
    },
    starAmount: {
      label: "Sternanzahl",
      description:
        "Bestimmt, wie viele Sterne sichtbar sind, wenn die Ebene aktiv ist. Das veraendert die Szenen-Dichte, nicht die Vocal-Empfindlichkeit.",
    },
    starBrightness: {
      label: "Sternhelligkeit",
      description:
        "Die Hauptsteuerung fuer sichtbare Twinkle-Staerke. Erhoehe das zuerst, bevor du mehr Sterne hinzufuegst, wenn du mehr Funkeln willst.",
    },
    starSize: {
      label: "Sterngroesse",
      description:
        "Passt die Stern-Groesse an. Das veraendert, wie praesent und lesbar die Sternform wirkt, nicht das Timing der Reaktion.",
    },
    starTwinkle: {
      label: "Twinkle-Geschwindigkeit",
      description:
        "Steuert, wie schnell sich das Funkelmuster jedes Sterns veraendert. Niedrigere Werte wirken schwebender. Hoehere Werte lebendiger.",
    },
    starVocalSensitivity: {
      label: "Vocal-Empfindlichkeit",
      description:
        "Steuert, wie stark Gesang und gehaltene Vocal-Momente die Sternebene antreiben.",
    },
    starBeatSensitivity: {
      label: "Beat-Empfindlichkeit",
      description:
        "Steuert, wie stark Drums und Instrumental-Treffer die Sterne anschieben duerfen. Halte das niedriger, wenn Sterne vor allem vocals folgen sollen.",
    },
  },
} as const;

function formatSignedValue(
  value: number,
  labels: { zero: string; negative: string; positive: string }
) {
  if (value === 0) {
    return `${labels.zero} | 0`;
  }

  const signed = value > 0 ? `+${value}` : `${value}`;
  return `${value < 0 ? labels.negative : labels.positive} | ${signed}`;
}

function formatPercentValue(
  value: number,
  labels: { low: string; medium: string; high: string }
) {
  const descriptor = value <= 33 ? labels.low : value >= 67 ? labels.high : labels.medium;
  return `${descriptor} | ${value}%`;
}

export default function BackgroundSection({ query, sectionFilter }: Props) {
  const staticBackgroundMode = useStore($staticBackgroundMode);
  const showNpvDynamicBg = useStore($showNpvDynamicBg);
  const visualizerPreset = useStore($visualizerPreset) as VisualizerPreset;
  const activeCustomPresetId = useStore($activeCustomVisualizerPresetId);
  useStore($customVisualizerPresets);
  const visualizerLanguage = useStore($visualizerLanguage) as VisualizerLanguage;
  const backgroundMovementSpeed = useStore($backgroundMovementSpeed);
  const beatdropSpeedMultiplier = useStore($beatdropSpeedMultiplier);
  const backgroundBeatGlowStrength = useStore($backgroundBeatGlowStrength);
  const perColorReactivity = useStore($perColorReactivity);
  const backgroundBeatBrightness = useStore($backgroundBeatBrightness);
  const backgroundDropImpact = useStore($backgroundDropImpact);
  const calmSectionIntensity = useStore($calmSectionIntensity);
  const loudSectionIntensity = useStore($loudSectionIntensity);
  const absoluteLoudnessScaling = useStore($absoluteLoudnessScaling);
  const globalGlowLimit = useStore($globalGlowLimit);
  const backgroundResponse = useStore($backgroundResponse);
  const performanceMode = useStore($performanceMode);
  const starsEnabled = useStore($starsEnabled);
  const starShape = useStore($starShape);
  const starAmount = useStore($starAmount);
  const starBrightness = useStore($starBrightness);
  const starSize = useStore($starSize);
  const starTwinkleSpeed = useStore($starTwinkleSpeed);
  const starVocalSensitivity = useStore($starVocalSensitivity);
  const starBeatSensitivity = useStore($starBeatSensitivity);

  if (sectionFilter !== "All" && sectionFilter !== SECTION_NAME) return null;

  const language = visualizerLanguage === "german" ? "german" : "english";
  const text = copy[language];
  const dynamicDisabled = staticBackgroundMode !== "off";
  const rowVisible = (label: string, description: string) => matches(query, label, description);
  const showStarDetails = starsEnabled || Boolean(query.trim());
  const customPresets = getCustomVisualizerPresets();
  const selectedCustomPreset =
    visualizerPreset === "custom"
      ? customPresets.find((preset) => preset.id === activeCustomPresetId)
      : undefined;

  const presetDescription = `${text.preset.description} ${text.preset.notes[visualizerPreset]}`;
  const customPresetDescription = selectedCustomPreset
    ? `${text.customPresets.description} ${selectedCustomPreset.name} ${text.customPresets.selectedSuffix}`
    : text.customPresets.description;
  const performanceKey = (
    performanceMode === "low" || performanceMode === "medium" || performanceMode === "high"
      ? performanceMode
      : "high"
  ) as "low" | "medium" | "high";
  const performanceDescription = `${text.performance.description} ${text.performance.notes[performanceKey]}`;
  const starShapeKey = (starShapeOptions.includes(starShape) ? starShape : "mixed") as keyof typeof text.starShape.notes;
  const starShapeDescription = `${text.starShape.description} ${text.starShape.notes[starShapeKey]}`;
  const setupVisible =
    rowVisible(text.staticBackground.label, text.staticBackground.description) ||
    rowVisible(text.npvBackground.label, text.npvBackground.description) ||
    rowVisible(text.preset.label, presetDescription) ||
    rowVisible(text.customPresets.label, customPresetDescription) ||
    rowVisible(text.performance.label, performanceDescription) ||
    rowVisible(text.language.label, text.language.description);
  const motionVisible =
    rowVisible(text.movement.label, text.movement.description) ||
    rowVisible(text.beatdrop.label, text.beatdrop.description) ||
    rowVisible(text.response.label, text.response.description);
  const glowVisible =
    rowVisible(text.waveGlow.label, text.waveGlow.description) ||
    rowVisible(text.localVariation.label, text.localVariation.description) ||
    rowVisible(text.brightness.label, text.brightness.description) ||
    rowVisible(text.impact.label, text.impact.description) ||
    rowVisible(text.calmIntensity.label, text.calmIntensity.description) ||
    rowVisible(text.loudIntensity.label, text.loudIntensity.description) ||
    rowVisible(text.loudness.label, text.loudness.description) ||
    rowVisible(text.glowLimit.label, text.glowLimit.description);
  const starsVisible =
    rowVisible(text.starsEnabled.label, text.starsEnabled.description) ||
    (showStarDetails &&
      (rowVisible(text.starShape.label, starShapeDescription) ||
        rowVisible(text.starAmount.label, text.starAmount.description) ||
        rowVisible(text.starBrightness.label, text.starBrightness.description) ||
        rowVisible(text.starSize.label, text.starSize.description) ||
        rowVisible(text.starTwinkle.label, text.starTwinkle.description) ||
        rowVisible(text.starVocalSensitivity.label, text.starVocalSensitivity.description) ||
        rowVisible(text.starBeatSensitivity.label, text.starBeatSensitivity.description)));
  const hasVisibleRow = setupVisible || motionVisible || glowVisible || starsVisible;

  if (!hasVisibleRow) return null;

  const setManualNumber = (setter: (value: number) => void, value: number) => {
    setter(value);
    markVisualizerPresetCustom();
  };

  const setManualBoolean = (setter: (value: boolean) => void, value: boolean) => {
    setter(value);
    markVisualizerPresetCustom();
  };

  const setManualString = (setter: (value: string) => void, value: string) => {
    setter(value);
    markVisualizerPresetCustom();
  };

  const builtInPresetOrder = VISUALIZER_PRESET_ORDER.filter(
    (preset): preset is BuiltInVisualizerPreset => preset !== "custom"
  );
  const presetOptions = [
    ...builtInPresetOrder,
    ...customPresets.map((preset) => `custom:${preset.id}`),
    "custom",
  ];
  const presetLabels = [
    ...builtInPresetOrder.map((preset) => text.preset.options[preset]),
    ...customPresets.map((preset) => `${text.customPresets.prefix}: ${preset.name}`),
    text.preset.options.custom,
  ];
  const selectedPresetValue = selectedCustomPreset ? `custom:${selectedCustomPreset.id}` : visualizerPreset;
  const starDisabledReason = dynamicDisabled ? text.disabledReason : text.starsDisabledReason;

  const promptPresetName = (message: string, fallback = "") => {
    const value = window.prompt(message, fallback);
    return value?.trim() ?? "";
  };

  const getSelectedBuiltInPreset = (): BuiltInVisualizerPreset | null => {
    return visualizerPreset !== "custom" ? (visualizerPreset as BuiltInVisualizerPreset) : null;
  };

  const handlePresetSelect = (value: string) => {
    if (value.startsWith("custom:")) {
      const id = value.slice("custom:".length);
      if (!applyCustomVisualizerPreset(id)) {
        toast.error(text.customPresets.failed);
      }
      return;
    }

    if (value === "custom") {
      $activeCustomVisualizerPresetId.set("");
      $visualizerPreset.set("custom");
      return;
    }

    applyVisualizerPreset(value as BuiltInVisualizerPreset);
  };

  const handleSaveNewPreset = () => {
    const name = promptPresetName(text.customPresets.namePrompt);
    if (!name) return;

    const preset = createCustomVisualizerPreset(name);
    if (!preset) {
      toast.error(text.customPresets.failed);
      return;
    }
    toast.success(text.customPresets.saved);
  };

  const handleSaveSelectedPreset = () => {
    if (!selectedCustomPreset) return;
    if (!updateCustomVisualizerPreset(selectedCustomPreset.id)) {
      toast.error(text.customPresets.failed);
      return;
    }
    toast.success(text.customPresets.updated);
  };

  const handleDuplicatePreset = () => {
    const source = selectedCustomPreset ?? getSelectedBuiltInPreset();
    if (!source) {
      handleSaveNewPreset();
      return;
    }

    const sourceName = typeof source === "string" ? text.preset.options[source] : source.name;
    const name = promptPresetName(
      text.customPresets.namePrompt,
      `${text.customPresets.duplicatePrefix} ${sourceName}`
    );
    if (!name) return;

    const preset = duplicateVisualizerPreset(source, name);
    if (!preset) {
      toast.error(text.customPresets.failed);
      return;
    }
    void applyCustomVisualizerPreset(preset.id);
    toast.success(text.customPresets.saved);
  };

  const handleRenamePreset = () => {
    if (!selectedCustomPreset) return;
    const name = promptPresetName(text.customPresets.renamePrompt, selectedCustomPreset.name);
    if (!name) return;

    if (!renameCustomVisualizerPreset(selectedCustomPreset.id, name)) {
      toast.error(text.customPresets.failed);
      return;
    }
    toast.success(text.customPresets.renamed);
  };

  const handleResetPreset = () => {
    if (!selectedCustomPreset) return;
    if (!resetCustomVisualizerPreset(selectedCustomPreset.id)) {
      toast.error(text.customPresets.failed);
      return;
    }
    toast.success(text.customPresets.resetDone);
  };

  const handleDeletePreset = () => {
    if (!selectedCustomPreset || !window.confirm(text.customPresets.deleteConfirm)) return;
    if (!deleteCustomVisualizerPreset(selectedCustomPreset.id)) {
      toast.error(text.customPresets.failed);
      return;
    }
    toast.success(text.customPresets.deleted);
  };

  const handleExportPresets = () => {
    const exported = exportCustomVisualizerPresets();
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(exported).then(
        () => toast.success(text.customPresets.copied),
        () => window.prompt(text.customPresets.export, exported)
      );
      return;
    }

    window.prompt(text.customPresets.export, exported);
  };

  const handleImportPresets = () => {
    const raw = window.prompt(text.customPresets.importPrompt, "");
    if (!raw) return;

    try {
      const count = importCustomVisualizerPresets(raw);
      if (count <= 0) {
        toast.error(text.customPresets.failed);
        return;
      }
      toast.success(`${count} ${text.customPresets.imported}`);
    } catch {
      toast.error(text.customPresets.failed);
    }
  };

  return (
    <>
      <SectionTitle>{text.sectionTitle}</SectionTitle>

      {setupVisible && <SubsectionTitle>{text.groups.setup}</SubsectionTitle>}

      {rowVisible(text.staticBackground.label, text.staticBackground.description) && (
        <Row label={text.staticBackground.label} description={text.staticBackground.description}>
          <Select
            value={staticBackgroundMode}
            options={bgModeOptions}
            labels={text.staticBackground.options}
            onChange={(value) => $staticBackgroundMode.set(value)}
          />
        </Row>
      )}

      {rowVisible(text.npvBackground.label, text.npvBackground.description) && (
        <Row label={text.npvBackground.label} description={text.npvBackground.description}>
          <Toggle checked={showNpvDynamicBg} onChange={(value) => $showNpvDynamicBg.set(value)} />
        </Row>
      )}

      {rowVisible(text.preset.label, presetDescription) && (
        <Row label={text.preset.label} description={presetDescription}>
          <Select
            value={selectedPresetValue}
            options={presetOptions}
            labels={presetLabels}
            onChange={handlePresetSelect}
          />
        </Row>
      )}

      {rowVisible(text.customPresets.label, customPresetDescription) && (
        <Row label={text.customPresets.label} description={customPresetDescription}>
          <div className="sl-sp-preset-actions">
            {selectedCustomPreset && (
              <button className="sl-sp-btn" type="button" onClick={handleSaveSelectedPreset}>
                {text.customPresets.saveSelected}
              </button>
            )}
            <button className="sl-sp-btn" type="button" onClick={handleSaveNewPreset}>
              {text.customPresets.saveNew}
            </button>
            <button className="sl-sp-btn" type="button" onClick={handleDuplicatePreset}>
              {text.customPresets.duplicate}
            </button>
            {selectedCustomPreset && (
              <>
                <button className="sl-sp-btn" type="button" onClick={handleRenamePreset}>
                  {text.customPresets.rename}
                </button>
                <button className="sl-sp-btn" type="button" onClick={handleResetPreset}>
                  {text.customPresets.reset}
                </button>
                <button
                  className="sl-sp-btn sl-sp-btn--danger"
                  type="button"
                  onClick={handleDeletePreset}
                >
                  {text.customPresets.delete}
                </button>
              </>
            )}
            <button className="sl-sp-btn" type="button" onClick={handleExportPresets}>
              {text.customPresets.export}
            </button>
            <button className="sl-sp-btn" type="button" onClick={handleImportPresets}>
              {text.customPresets.import}
            </button>
          </div>
        </Row>
      )}

      {rowVisible(text.performance.label, performanceDescription) && (
        <Row
          label={text.performance.label}
          description={performanceDescription}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Select
            value={performanceMode}
            options={performanceOptions}
            labels={text.performance.options}
            onChange={(value) => setManualString($performanceMode.set, value)}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.language.label, text.language.description) && (
        <Row label={text.language.label} description={text.language.description}>
          <Select
            value={visualizerLanguage}
            options={languageOptions}
            labels={text.language.options}
            onChange={(value) => $visualizerLanguage.set(value)}
          />
        </Row>
      )}

      {motionVisible && <SubsectionTitle>{text.groups.motion}</SubsectionTitle>}

      {rowVisible(text.movement.label, text.movement.description) && (
        <Row
          label={text.movement.label}
          description={text.movement.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={backgroundMovementSpeed}
            onChange={(value) => setManualNumber($backgroundMovementSpeed.set, value)}
            valueLabel={formatSignedValue(backgroundMovementSpeed, {
              zero: text.valueWords.original,
              negative: text.valueWords.calmer,
              positive: text.valueWords.faster,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.beatdrop.label, text.beatdrop.description) && (
        <Row
          label={text.beatdrop.label}
          description={text.beatdrop.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={beatdropSpeedMultiplier}
            onChange={(value) => setManualNumber($beatdropSpeedMultiplier.set, value)}
            valueLabel={formatSignedValue(beatdropSpeedMultiplier, {
              zero: text.valueWords.original,
              negative: text.valueWords.softer,
              positive: text.valueWords.punchier,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.response.label, text.response.description) && (
        <Row
          label={text.response.label}
          description={text.response.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={backgroundResponse}
            onChange={(value) => setManualNumber($backgroundResponse.set, value)}
            valueLabel={formatSignedValue(backgroundResponse, {
              zero: text.valueWords.original,
              negative: text.valueWords.smoother,
              positive: text.valueWords.quicker,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {glowVisible && <SubsectionTitle>{text.groups.glow}</SubsectionTitle>}

      {rowVisible(text.waveGlow.label, text.waveGlow.description) && (
        <Row
          label={text.waveGlow.label}
          description={text.waveGlow.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={backgroundBeatGlowStrength}
            onChange={(value) => setManualNumber($backgroundBeatGlowStrength.set, value)}
            valueLabel={formatSignedValue(backgroundBeatGlowStrength, {
              zero: text.valueWords.original,
              negative: text.valueWords.softer,
              positive: text.valueWords.stronger,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.localVariation.label, text.localVariation.description) && (
        <Row
          label={text.localVariation.label}
          description={text.localVariation.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={perColorReactivity}
            onChange={(value) => setManualNumber($perColorReactivity.set, value)}
            valueLabel={formatSignedValue(perColorReactivity, {
              zero: text.valueWords.original,
              negative: text.valueWords.broader,
              positive: text.valueWords.local,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.brightness.label, text.brightness.description) && (
        <Row
          label={text.brightness.label}
          description={text.brightness.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={backgroundBeatBrightness}
            onChange={(value) => setManualNumber($backgroundBeatBrightness.set, value)}
            valueLabel={formatSignedValue(backgroundBeatBrightness, {
              zero: text.valueWords.original,
              negative: text.valueWords.dimmer,
              positive: text.valueWords.brighter,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.impact.label, text.impact.description) && (
        <Row
          label={text.impact.label}
          description={text.impact.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={backgroundDropImpact}
            onChange={(value) => setManualNumber($backgroundDropImpact.set, value)}
            valueLabel={formatSignedValue(backgroundDropImpact, {
              zero: text.valueWords.original,
              negative: text.valueWords.focused,
              positive: text.valueWords.broader,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.calmIntensity.label, text.calmIntensity.description) && (
        <Row
          label={text.calmIntensity.label}
          description={text.calmIntensity.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={calmSectionIntensity}
            onChange={(value) => setManualNumber($calmSectionIntensity.set, value)}
            valueLabel={formatSignedValue(calmSectionIntensity, {
              zero: text.valueWords.original,
              negative: text.valueWords.darker,
              positive: text.valueWords.brighter,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.loudIntensity.label, text.loudIntensity.description) && (
        <Row
          label={text.loudIntensity.label}
          description={text.loudIntensity.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={loudSectionIntensity}
            onChange={(value) => setManualNumber($loudSectionIntensity.set, value)}
            valueLabel={formatSignedValue(loudSectionIntensity, {
              zero: text.valueWords.original,
              negative: text.valueWords.quieter,
              positive: text.valueWords.louder,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.loudness.label, text.loudness.description) && (
        <Row
          label={text.loudness.label}
          description={text.loudness.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={absoluteLoudnessScaling}
            onChange={(value) => setManualNumber($absoluteLoudnessScaling.set, value)}
            valueLabel={formatSignedValue(absoluteLoudnessScaling, {
              zero: text.valueWords.original,
              negative: text.valueWords.stricter,
              positive: text.valueWords.sensitive,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {rowVisible(text.glowLimit.label, text.glowLimit.description) && (
        <Row
          label={text.glowLimit.label}
          description={text.glowLimit.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Slider
            min={-100}
            max={300}
            value={globalGlowLimit}
            onChange={(value) => setManualNumber($globalGlowLimit.set, value)}
            valueLabel={formatSignedValue(globalGlowLimit, {
              zero: text.valueWords.original,
              negative: text.valueWords.safer,
              positive: text.valueWords.open,
            })}
            disabled={dynamicDisabled}
          />
        </Row>
      )}

      {starsVisible && <SubsectionTitle>{text.groups.stars}</SubsectionTitle>}

      {rowVisible(text.starsEnabled.label, text.starsEnabled.description) && (
        <Row
          label={text.starsEnabled.label}
          description={text.starsEnabled.description}
          disabled={dynamicDisabled}
          disabledReason={text.disabledReason}
        >
          <Toggle
            checked={starsEnabled}
            onChange={(value) => setManualBoolean($starsEnabled.set, value)}
          />
        </Row>
      )}

      {showStarDetails && rowVisible(text.starShape.label, starShapeDescription) && (
        <Row
          label={text.starShape.label}
          description={starShapeDescription}
          disabled={dynamicDisabled || !starsEnabled}
          disabledReason={starDisabledReason}
        >
          <Select
            value={starShape}
            options={starShapeOptions}
            labels={text.starShape.options}
            onChange={(value) => setManualString($starShape.set, value)}
            disabled={dynamicDisabled || !starsEnabled}
          />
        </Row>
      )}

      {showStarDetails && rowVisible(text.starAmount.label, text.starAmount.description) && (
        <Row
          label={text.starAmount.label}
          description={text.starAmount.description}
          disabled={dynamicDisabled || !starsEnabled}
          disabledReason={starDisabledReason}
        >
          <Slider
            value={starAmount}
            onChange={(value) => setManualNumber($starAmount.set, value)}
            valueLabel={formatPercentValue(starAmount, {
              low: text.valueWords.sparse,
              medium: text.valueWords.balanced,
              high: text.valueWords.dense,
            })}
            disabled={dynamicDisabled || !starsEnabled}
          />
        </Row>
      )}

      {showStarDetails &&
        rowVisible(text.starBrightness.label, text.starBrightness.description) && (
        <Row
          label={text.starBrightness.label}
          description={text.starBrightness.description}
          disabled={dynamicDisabled || !starsEnabled}
          disabledReason={starDisabledReason}
        >
          <Slider
            value={starBrightness}
            onChange={(value) => setManualNumber($starBrightness.set, value)}
            valueLabel={formatPercentValue(starBrightness, {
              low: text.valueWords.dimmer,
              medium: text.valueWords.balanced,
              high: text.valueWords.brighter,
            })}
            disabled={dynamicDisabled || !starsEnabled}
          />
        </Row>
      )}

      {showStarDetails && rowVisible(text.starSize.label, text.starSize.description) && (
        <Row
          label={text.starSize.label}
          description={text.starSize.description}
          disabled={dynamicDisabled || !starsEnabled}
          disabledReason={starDisabledReason}
        >
          <Slider
            value={starSize}
            onChange={(value) => setManualNumber($starSize.set, value)}
            valueLabel={formatPercentValue(starSize, {
              low: text.valueWords.smaller,
              medium: text.valueWords.balanced,
              high: text.valueWords.larger,
            })}
            disabled={dynamicDisabled || !starsEnabled}
          />
        </Row>
      )}

      {showStarDetails && rowVisible(text.starTwinkle.label, text.starTwinkle.description) && (
        <Row
          label={text.starTwinkle.label}
          description={text.starTwinkle.description}
          disabled={dynamicDisabled || !starsEnabled}
          disabledReason={starDisabledReason}
        >
          <Slider
            value={starTwinkleSpeed}
            onChange={(value) => setManualNumber($starTwinkleSpeed.set, value)}
            valueLabel={formatPercentValue(starTwinkleSpeed, {
              low: text.valueWords.slower,
              medium: text.valueWords.balanced,
              high: text.valueWords.livelier,
            })}
            disabled={dynamicDisabled || !starsEnabled}
          />
        </Row>
      )}

      {showStarDetails &&
        rowVisible(text.starVocalSensitivity.label, text.starVocalSensitivity.description) && (
        <Row
          label={text.starVocalSensitivity.label}
          description={text.starVocalSensitivity.description}
          disabled={dynamicDisabled || !starsEnabled}
          disabledReason={starDisabledReason}
        >
          <Slider
            value={starVocalSensitivity}
            onChange={(value) => setManualNumber($starVocalSensitivity.set, value)}
            valueLabel={formatPercentValue(starVocalSensitivity, {
              low: text.valueWords.subtler,
              medium: text.valueWords.balanced,
              high: text.valueWords.voiceLed,
            })}
            disabled={dynamicDisabled || !starsEnabled}
          />
        </Row>
      )}

      {showStarDetails &&
        rowVisible(text.starBeatSensitivity.label, text.starBeatSensitivity.description) && (
        <Row
          label={text.starBeatSensitivity.label}
          description={text.starBeatSensitivity.description}
          disabled={dynamicDisabled || !starsEnabled}
          disabledReason={starDisabledReason}
        >
          <Slider
            value={starBeatSensitivity}
            onChange={(value) => setManualNumber($starBeatSensitivity.set, value)}
            valueLabel={formatPercentValue(starBeatSensitivity, {
              low: text.valueWords.gentler,
              medium: text.valueWords.balanced,
              high: text.valueWords.beatLed,
            })}
            disabled={dynamicDisabled || !starsEnabled}
          />
        </Row>
      )}
    </>
  );
}
