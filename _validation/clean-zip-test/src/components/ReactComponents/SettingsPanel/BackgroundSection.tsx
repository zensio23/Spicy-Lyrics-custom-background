import { useStore } from "@nanostores/react";
import {
  $absoluteLoudnessScaling,
  $backgroundBeatBrightness,
  $backgroundBeatGlowStrength,
  $backgroundDropImpact,
  $backgroundMovementSpeed,
  $backgroundResponse,
  $beatdropSpeedMultiplier,
  $globalGlowLimit,
  $performanceMode,
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
  applyVisualizerPreset,
  markVisualizerPresetCustom,
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
        cinematic: "Best balanced default. Broad wave glow, smooth motion, premium fullscreen feel.",
        energetic: "Brighter waves, punchier drops, and faster motion when the song opens up.",
        insane:
          "Maximum intensity with strong color-driven glow, but still controlled and without white flashing.",
        eventually:
          "Dreamy, psychedelic motion with soft flowing waves and magical vocal-focused stars.",
        strokesSnowStrippers:
          "Sharper pulses, more sparkle, and a faster party-like response.",
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
    language: {
      label: "Language",
      description: "Choose the language used for these visualizer settings.",
      options: ["English", "German"],
    },
    movement: {
      label: "Background Movement Speed",
      description:
        "Adjust the original Kawarp motion speed. This changes the base drift all the time, not just on drops. Negative values calm it down. Positive values speed it up. 0 keeps the original behavior.",
    },
    beatdrop: {
      label: "Beatdrop Speed Multiplier",
      description:
        "Control how much drops, choruses, and strong beat hits accelerate the existing wave movement. Negative values keep those speed-ups softer. Positive values make them punchier.",
    },
    waveGlow: {
      label: "Wave Glow Strength",
      description:
        "Main glow control for the background. It decides how strongly the existing cover waves light up and how present the illuminated wave field feels.",
    },
    brightness: {
      label: "Music Brightness Reactivity",
      description:
        "Controls brightness after the waves are already reacting. Use this when the glow shape feels right but the lit waves still look too dim or too bright.",
    },
    impact: {
      label: "Impact Strength",
      description:
        "Controls how strongly the whole wave field joins in during louder sections. If you want more drama with one slider, start here.",
    },
    loudness: {
      label: "Absolute Loudness Scaling",
      description:
        "This is the quiet-vs-loud threshold for the whole effect. Negative values reserve strong glow for louder moments. Positive values let medium-energy sections join in sooner.",
    },
    glowLimit: {
      label: "Global Glow Limit",
      description:
        "Safety cap for very bright sections. This is most noticeable when many waves are glowing at once. Lower it if choruses start to wash out. Raise it if you want big sections to fill more of the screen.",
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
          "Der beste Standard. Breiter Wellen-Glow, ruhige Bewegung und ein hochwertiges Fullscreen-Gefuehl.",
        energetic:
          "Hellere Wellen, staerkere Drops und schnellere Bewegung bei energiereichen Stellen.",
        insane:
          "Maximale Intensitaet mit starkem farbbasiertem Glow, aber weiterhin kontrolliert und ohne weisses Blitzen.",
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
    language: {
      label: "Sprache",
      description: "Legt die Sprache fuer diese Visualizer-Einstellungen fest.",
      options: ["Englisch", "Deutsch"],
    },
    movement: {
      label: "Hintergrund-Bewegungsgeschwindigkeit",
      description:
        "Passt die originale Kawarp-Bewegung an. Das veraendert die Grundbewegung permanent, nicht nur bei Drops. Negative Werte beruhigen sie. Positive Werte beschleunigen sie. 0 behaelt das Originalverhalten.",
    },
    beatdrop: {
      label: "Beatdrop-Geschwindigkeits-Multiplikator",
      description:
        "Steuert, wie stark Drops, Refrains und starke Beat-Treffer die vorhandene Wellenbewegung beschleunigen. Negative Werte halten diese Beschleunigungen sanfter. Positive Werte machen sie markanter.",
    },
    waveGlow: {
      label: "Wellen-Glow-Staerke",
      description:
        "Die Hauptsteuerung fuer den Hintergrund-Glow. Sie bestimmt, wie stark die vorhandenen Cover-Wellen aufleuchten und wie praesent das leuchtende Wellenfeld wirkt.",
    },
    brightness: {
      label: "Musik-Helligkeits-Reaktivitaet",
      description:
        "Steuert die Helligkeit, nachdem die Wellen bereits reagieren. Nutze das, wenn die Glow-Form passt, die beleuchteten Wellen aber noch zu dunkel oder zu hell wirken.",
    },
    impact: {
      label: "Impact-Staerke",
      description:
        "Steuert, wie stark das ganze Wellenfeld in lauteren Stellen mitreagiert. Wenn du mit nur einem Slider mehr Dramatik willst, fang hier an.",
    },
    loudness: {
      label: "Absolute Lautheits-Skalierung",
      description:
        "Das ist die Leise-gegen-Laut-Schwelle fuer den ganzen Effekt. Negative Werte reservieren staerkeren Glow fuer lautere Momente. Positive Werte lassen auch mittelstarke Stellen frueher mitmachen.",
    },
    glowLimit: {
      label: "Globales Glow-Limit",
      description:
        "Sicherheitsgrenze fuer sehr helle Stellen. Das faellt vor allem auf, wenn viele Wellen gleichzeitig leuchten. Senke es, wenn Refrains ausbleichen. Erhoehe es, wenn grosse Stellen mehr vom Bildschirm fuellen sollen.",
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
  const visualizerLanguage = useStore($visualizerLanguage) as VisualizerLanguage;
  const backgroundMovementSpeed = useStore($backgroundMovementSpeed);
  const beatdropSpeedMultiplier = useStore($beatdropSpeedMultiplier);
  const backgroundBeatGlowStrength = useStore($backgroundBeatGlowStrength);
  const backgroundBeatBrightness = useStore($backgroundBeatBrightness);
  const backgroundDropImpact = useStore($backgroundDropImpact);
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

  const presetDescription = `${text.preset.description} ${text.preset.notes[visualizerPreset]}`;
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
    rowVisible(text.performance.label, performanceDescription) ||
    rowVisible(text.language.label, text.language.description);
  const motionVisible =
    rowVisible(text.movement.label, text.movement.description) ||
    rowVisible(text.beatdrop.label, text.beatdrop.description) ||
    rowVisible(text.response.label, text.response.description);
  const glowVisible =
    rowVisible(text.waveGlow.label, text.waveGlow.description) ||
    rowVisible(text.brightness.label, text.brightness.description) ||
    rowVisible(text.impact.label, text.impact.description) ||
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

  const presetLabels = VISUALIZER_PRESET_ORDER.map((preset) => text.preset.options[preset]);
  const starDisabledReason = dynamicDisabled ? text.disabledReason : text.starsDisabledReason;

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
            value={visualizerPreset}
            options={VISUALIZER_PRESET_ORDER}
            labels={presetLabels}
            onChange={(value) => {
              if (value === "custom") {
                $visualizerPreset.set("custom");
                return;
              }
              applyVisualizerPreset(value as Exclude<VisualizerPreset, "custom">);
            }}
          />
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
