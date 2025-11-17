"use strict";

// Configuration for population-based burg styling
// Population ranges are checked from highest to lowest
// IMPORTANT: Use REAL population values (as displayed in UI), conversion is automatic
const populationStyles = [
  {
    name: "metropolis",
    minPopulation: 250000, // 500k+ population (REAL displayed value)
    label: {
      textTransform: "uppercase", // uppercase, lowercase, capitalize, none
      fontWeight: "bold", // bold, normal
      fontSize: 1.4, // multiplier for base font size
      color: "#110A08"
    },
    icon: {
      shape: "square", // square, circle, diamond, star
      sizeMultiplier: 2.0, // Big Square
      color: "black"
    }
  },
  {
    name: "major-city",
    minPopulation: 100000, // 100k-500k population (REAL displayed value)
    label: {
      textTransform: "uppercase",
      fontWeight: "bold",
      fontSize: 1.2,
      color: "#110A08"
    },
    icon: {
      shape: "square",
      sizeMultiplier: 1.6, // Square
      color: "black"
    }
  },
  {
    name: "city",
    minPopulation: 50000, // 50k-100k population (REAL displayed value)
    label: {
      textTransform: "capitalize",
      fontWeight: "bold",
      fontSize: 1.0,
      color: "#110A08"
    },
    icon: {
      shape: "square",
      sizeMultiplier: 1.2, // Square
      color: "black"
    }
  },
  {
    name: "medium-town",
    minPopulation: 20000, // 20k-50k population (REAL displayed value)
    label: {
      textTransform: "capitalize",
      fontWeight: "normal",
      fontSize: 0.8,
      color: "#110A08"
    },
    icon: {
      shape: "circle",
      sizeMultiplier: 1.2, // Circle
      color: "black"
    }
  },
  {
    name: "small-town",
    minPopulation: 10000, // 10k-20k population (REAL displayed value)
    label: {
      textTransform: "capitalize",
      fontWeight: "normal",
      fontSize: 0.7,
      color: "#110A08"
    },
    icon: {
      shape: "circle",
      sizeMultiplier: 1.0, // Circle
      color: "black"
    }
  },
  {
    name: "village",
    minPopulation: 0, // < 10k population (REAL displayed value)
    label: {
      textTransform: "none",
      fontWeight: "normal",
      fontSize: 0.6,
      color: "#110A08"
    },
    icon: {
      shape: "circle",
      sizeMultiplier: 0.8, // Circle
      color: "black"
    }
  }
];

// Debug flag - set to true to see population styling in console
const DEBUG_POPULATION_STYLES = true;

// Get style for a given population
// population: stored population value (small decimal like 2.247, 11.977, etc.)
function getPopulationStyle(population) {
  // Convert stored population to real (displayed) population
  // Formula: realPopulation = storedPopulation * populationRate * urbanization
  const realPopulation = population * populationRate * urbanization;

  if (DEBUG_POPULATION_STYLES) {
    console.log(`=== getPopulationStyle: stored=${population}, real=${Math.round(realPopulation)}`);
  }

  // Find the first style where real population meets the minimum requirement
  for (const style of populationStyles) {
    if (DEBUG_POPULATION_STYLES) {
      console.log(`  Checking: ${Math.round(realPopulation)} >= ${style.minPopulation} (${style.name}) = ${realPopulation >= style.minPopulation}`);
    }
    if (realPopulation >= style.minPopulation) {
      if (DEBUG_POPULATION_STYLES) {
        console.log(`  ✓ MATCHED style: ${style.name}`);
      }
      return style;
    }
  }

  // Fallback to the last (smallest) style
  if (DEBUG_POPULATION_STYLES) {
    console.log(`  ✗ No match, using fallback: village`);
  }
  return populationStyles[populationStyles.length - 1];
}

// Apply text transform to a string
function applyTextTransform(text, transform) {
  switch (transform) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "capitalize":
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    case "none":
    default:
      return text;
  }
}

// Log that the population styling system is loaded
console.log(`Population-based styling loaded with ${populationStyles.length} tiers`);
if (DEBUG_POPULATION_STYLES) {
  console.table(populationStyles.map(s => ({
    name: s.name,
    minPopulation: s.minPopulation,
    labelTransform: s.label.textTransform,
    iconShape: s.icon.shape
  })));
}
