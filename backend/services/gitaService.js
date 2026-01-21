const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../../docs/gitaData.json");

function getGitaGuidance(emotion) {
  const rawData = fs.readFileSync(dataPath);
  const gitaData = JSON.parse(rawData);
  console.log("Loading Gita data from:", dataPath);
  const entries = gitaData[emotion] || gitaData["neutral"];

  // Pick random verse
  const randomIndex = Math.floor(Math.random() * entries.length);
  return entries[randomIndex];
}

module.exports = { getGitaGuidance };
