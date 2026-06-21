const storage = new Map();

globalThis.Spicetify = {
  LocalStorage: {
    get(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    set(key, value) {
      storage.set(key, value);
    },
  },
};

globalThis.window = {
  _spicy_lyrics_metadata: {
    LoadedVersion: "test",
  },
};

const stores = await import("../src/utils/stores.ts");
const visualizerSettings = await import("../src/utils/visualizerSettings.ts");

const sampleValues = {
  backgroundBeatBrightness: 196,
  backgroundBeatGlowStrength: 155,
  backgroundDropImpact: 47,
  backgroundMovementSpeed: 73,
  beatdropSpeedMultiplier: 134,
  perColorReactivity: -30,
  calmSectionIntensity: 172,
  loudSectionIntensity: 78,
  globalGlowLimit: 300,
  backgroundResponse: 300,
  absoluteLoudnessScaling: 25,
  starsEnabled: true,
  starShape: "mixed",
  starAmount: 44,
  starBrightness: 60,
  starSize: 44,
  starTwinkleSpeed: 68,
  starVocalSensitivity: 76,
  starBeatSensitivity: 22,
};

stores.$customVisualizerPresets.set([]);
stores.$backgroundBeatBrightness.set(sampleValues.backgroundBeatBrightness);
stores.$backgroundBeatGlowStrength.set(sampleValues.backgroundBeatGlowStrength);
stores.$backgroundDropImpact.set(sampleValues.backgroundDropImpact);
stores.$backgroundMovementSpeed.set(sampleValues.backgroundMovementSpeed);
stores.$beatdropSpeedMultiplier.set(sampleValues.beatdropSpeedMultiplier);
stores.$perColorReactivity.set(sampleValues.perColorReactivity);
stores.$calmSectionIntensity.set(sampleValues.calmSectionIntensity);
stores.$loudSectionIntensity.set(sampleValues.loudSectionIntensity);
stores.$globalGlowLimit.set(sampleValues.globalGlowLimit);
stores.$backgroundResponse.set(sampleValues.backgroundResponse);
stores.$absoluteLoudnessScaling.set(sampleValues.absoluteLoudnessScaling);
stores.$starsEnabled.set(sampleValues.starsEnabled);
stores.$starShape.set(sampleValues.starShape);
stores.$starAmount.set(sampleValues.starAmount);
stores.$starBrightness.set(sampleValues.starBrightness);
stores.$starSize.set(sampleValues.starSize);
stores.$starTwinkleSpeed.set(sampleValues.starTwinkleSpeed);
stores.$starVocalSensitivity.set(sampleValues.starVocalSensitivity);
stores.$starBeatSensitivity.set(sampleValues.starBeatSensitivity);

const created = visualizerSettings.createCustomVisualizerPreset("Roundtrip Test");
if (!created) {
  throw new Error("Failed to create test preset");
}

const exported = visualizerSettings.exportCustomVisualizerPresets();
const payload = JSON.parse(exported);
if (payload.version !== 1 || !Array.isArray(payload.presets) || payload.presets.length !== 1) {
  throw new Error("Exported payload does not match the expected preset envelope");
}

const importedCount = visualizerSettings.importCustomVisualizerPresets(exported);
if (importedCount !== 1) {
  throw new Error(`Expected to import 1 preset, imported ${importedCount}`);
}

const presets = visualizerSettings.getCustomVisualizerPresets();
if (presets.length !== 2) {
  throw new Error(`Expected 2 presets after roundtrip, found ${presets.length}`);
}

const [original, imported] = presets;
if (!original || !imported) {
  throw new Error("Roundtrip presets are missing");
}

if (original.id === imported.id) {
  throw new Error("Imported preset ID was not regenerated on conflict");
}

if (imported.name !== original.name) {
  throw new Error("Imported preset name was not preserved");
}

const originalValues = JSON.stringify(original.values);
const importedValues = JSON.stringify(imported.values);
if (originalValues !== importedValues) {
  throw new Error("Imported preset values do not match exported values");
}

console.log("Visualizer preset roundtrip passed");
