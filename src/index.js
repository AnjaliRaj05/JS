const express = require("express");
const axios = require("axios");

const app = express();

// Helper: Sort keys alphabetically (recursively)
function sortKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  } else if (obj !== null && typeof obj === "object") {
    return Object.entries(obj)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc, [key, value]) => {
        acc[key] = sortKeys(value);
        return acc;
      }, {});
  }
  return obj;
}

// Helper: Remove duplicate objects from arrays
function removeDuplicates(arr) {
  const seen = new Set();
  return arr.filter((item) => {
    const stringified = JSON.stringify(item); // key order matters here due to earlier sort
    if (seen.has(stringified)) return false;
    seen.add(stringified);
    return true;
  });
}

// Helper: Remove empty or null-only object properties
function removeEmptyProps(obj) {
  if (Array.isArray(obj)) {
    return removeDuplicates(obj.map(removeEmptyProps));
  } else if (obj !== null && typeof obj === "object") {
    const cleaned = Object.entries(obj).reduce((acc, [key, value]) => {
      const val = removeEmptyProps(value);
      const isEmpty =
        val === null ||
        val === undefined ||
        val === "" ||
        (typeof val === "object" && Object.keys(val).length === 0);

      if (!isEmpty) acc[key] = val;
      return acc;
    }, {});
    return cleaned;
  }
  return obj;
}

app.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      "https://coderbyte.com/api/challenges/json/wizard-list"
    );
    const originalData = response.data;

    // Step 1: Sort object keys
    const sortedData = sortKeys(originalData);

    // Step 2 & 3: Remove duplicates and empty values
    const cleanedData = removeEmptyProps(sortedData);

    // Step 4: Log as string
    console.log(JSON.stringify(cleanedData));

    res.json(cleanedData);
  } catch (error) {
    console.error("Axios fetch error:", error.message);
    res.status(500).json({ error: "Error fetching wizard data" });
  }
});

app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
