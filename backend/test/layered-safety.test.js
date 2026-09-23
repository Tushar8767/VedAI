const test = require("node:test");
const assert = require("node:assert/strict");
const { assessSafety } = require("../services/safetyService");

test("SAFE-001: Layer 1 Explicit English crisis detection", () => {
  const inputs = [
    "I don't want to live",
    "I want to die",
    "I want to hurt myself",
    "I might kill myself",
    "there is no reason to live",
    "I cannot continue"
  ];
  for (const text of inputs) {
    const res = assessSafety(text);
    assert.equal(res.isHighRisk, true, `Failed on: ${text}`);
    assert.equal(res.riskLevel, "high");
    assert.match(res.message, /112/);
    assert.match(res.message, /Tele-MANAS/);
  }
});

test("SAFE-002: Layer 2 Common misspellings & phonetic variants", () => {
  const inputs = [
    "i want to suecide",
    "i want to kll myslf",
    "i might kms tonight",
    "i want to unalive myself"
  ];
  for (const text of inputs) {
    const res = assessSafety(text);
    assert.equal(res.isHighRisk, true, `Failed on: ${text}`);
    assert.equal(res.matchedLayer, "LAYER_2_MISSPELLINGS");
  }
});

test("SAFE-003: Layer 3 Hinglish crisis expressions", () => {
  const inputs = [
    "mujhe ab jeena nahi hai",
    "main apni jaan de dunga",
    "mera marne ka mann hai",
    "main apne aap ko khatam kar lunga"
  ];
  for (const text of inputs) {
    const res = assessSafety(text);
    assert.equal(res.isHighRisk, true, `Failed on: ${text}`);
    assert.equal(res.matchedLayer, "LAYER_3_HINGLISH");
  }
});

test("SAFE-004: Layer 4 Marathi crisis expressions", () => {
  const inputs = [
    "mala jagaycha nahiye",
    "mala marun jaavas vatta",
    "jeevan sampvaycha ahe",
    "aatmhatya karaychi vatate"
  ];
  for (const text of inputs) {
    const res = assessSafety(text);
    assert.equal(res.isHighRisk, true, `Failed on: ${text}`);
    assert.equal(res.matchedLayer, "LAYER_4_MARATHI");
  }
});

test("SAFE-005: Layer 5 Indirect burdensomeness and disappearance", () => {
  const inputs = [
    "I see no light at the end of the tunnel and want to disappear",
    "Everyone would be happier without me here",
    "I want to disappear forever",
    "tired of living this life"
  ];
  for (const text of inputs) {
    const res = assessSafety(text);
    assert.equal(res.isHighRisk, true, `Failed on: ${text}`);
    assert.equal(res.matchedLayer, "LAYER_5_INDIRECT_BURDEN");
  }
});

test("SAFE-006: Benign figurative idioms and resilient controls do NOT trigger crisis alarms", () => {
  const benign = [
    "I am killing it at work",
    "I want to end this project today",
    "I feel dead tired after running 10km",
    "I am dying of laughter bro",
    "feeling down today but ready to try",
    "i am tired of studying"
  ];
  for (const text of benign) {
    const res = assessSafety(text);
    assert.equal(res.isHighRisk, false, `False positive on: ${text}`);
    assert.equal(res.riskLevel, "low");
  }
});

test("SAFE-007: Contradictory statements preserve safety first", () => {
  const res = assessSafety("I want to die but I love my dog and don't want to leave him");
  assert.equal(res.isHighRisk, true);
  assert.equal(res.riskLevel, "high");
});
