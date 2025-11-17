# Population-Based Burg Styling

This feature allows towns and cities (burgs) to be displayed with different visual styles based on their population ranges.

## Overview

The system automatically applies different visual styles to burgs based on their population:
- **Text styling**: Control text case (uppercase, lowercase, capitalize), font weight, and size
- **Icon shapes**: Use different marker shapes (circle, square, diamond, star)
- **Size variations**: Scale markers and labels based on population

## Current Configuration

The default configuration in `config/population-styles.js` defines 5 population tiers:

| Tier | Population Range | Label Style | Icon Shape | Example |
|------|------------------|-------------|------------|---------|
| Metropolis | 500k+ | UPPERCASE, bold, 1.3x size | Square | NEW YORK |
| Major City | 100k-500k | UPPERCASE, bold, 1.15x size | Circle (large) | BOSTON |
| City | 50k-100k | Capitalize, bold, 1.0x size | Circle (medium) | Portland |
| Town | 10k-50k | Capitalize, normal, 0.9x size | Circle (small) | Salem |
| Village | < 10k | Normal, normal, 0.75x size | Circle (tiny) | greenville |

## Customizing Styles

To customize the styling, edit `config/population-styles.js`:

### 1. Modify Existing Tiers

Change the `minPopulation` threshold or styling properties:

```javascript
{
  name: "metropolis",
  minPopulation: 500, // Change this threshold
  label: {
    textTransform: "uppercase", // Options: uppercase, lowercase, capitalize, none
    fontWeight: "bold",         // Options: bold, normal
    fontSize: 1.3               // Multiplier for base font size
  },
  icon: {
    shape: "square",            // Options: square, circle, diamond, star
    sizeMultiplier: 1.5         // Multiplier for base icon size
  }
}
```

### 2. Add New Tiers

Add new population ranges to the `populationStyles` array. Make sure to keep them sorted from highest to lowest `minPopulation`:

```javascript
{
  name: "megacity",
  minPopulation: 1000, // 1 million+
  label: {
    textTransform: "uppercase",
    fontWeight: "bold",
    fontSize: 1.5
  },
  icon: {
    shape: "star",
    sizeMultiplier: 2.0
  }
}
```

### 3. Remove Tiers

Simply delete unwanted entries from the `populationStyles` array.

## Available Options

### Text Transform Options
- `uppercase`: ALL CAPS
- `lowercase`: all lowercase
- `capitalize`: First Letter Caps
- `none`: Original Case

### Icon Shape Options
- `circle`: Traditional circular marker ●
- `square`: Rectangular marker ■
- `diamond`: Diamond/rotated square marker ◆
- `star`: Star-shaped marker ★

### Size Multipliers
- `fontSize`: Multiplies the base label font size (recommended: 0.5 - 2.0)
- `sizeMultiplier`: Multiplies the base icon size (recommended: 0.5 - 2.5)

## How It Works

1. When rendering burgs, the system checks each burg's `population` property
2. It finds the matching style tier by comparing against `minPopulation` thresholds
3. It applies the corresponding label and icon styling
4. Burgs are grouped by shape type for efficient rendering

## Population Units

Population values in the map are abstract units. Common reference points:
- Small villages: 1-10
- Towns: 10-50
- Cities: 50-100
- Major cities: 100-500
- Metropolises: 500+

Adjust the `minPopulation` values in the configuration to match your map's scale.

## Examples

### Simple Two-Tier System
```javascript
const populationStyles = [
  {
    name: "large",
    minPopulation: 50,
    label: { textTransform: "uppercase", fontWeight: "bold", fontSize: 1.2 },
    icon: { shape: "square", sizeMultiplier: 1.5 }
  },
  {
    name: "small",
    minPopulation: 0,
    label: { textTransform: "capitalize", fontWeight: "normal", fontSize: 1.0 },
    icon: { shape: "circle", sizeMultiplier: 1.0 }
  }
];
```

### Four-Tier With Stars
```javascript
const populationStyles = [
  {
    name: "capital",
    minPopulation: 200,
    label: { textTransform: "uppercase", fontWeight: "bold", fontSize: 1.4 },
    icon: { shape: "star", sizeMultiplier: 2.0 }
  },
  {
    name: "major",
    minPopulation: 100,
    label: { textTransform: "uppercase", fontWeight: "bold", fontSize: 1.2 },
    icon: { shape: "square", sizeMultiplier: 1.5 }
  },
  {
    name: "minor",
    minPopulation: 25,
    label: { textTransform: "capitalize", fontWeight: "normal", fontSize: 1.0 },
    icon: { shape: "diamond", sizeMultiplier: 1.0 }
  },
  {
    name: "hamlet",
    minPopulation: 0,
    label: { textTransform: "lowercase", fontWeight: "normal", fontSize: 0.8 },
    icon: { shape: "circle", sizeMultiplier: 0.7 }
  }
];
```

## Files Modified

- `config/population-styles.js` - Configuration and helper functions (NEW)
- `modules/renderers/draw-burg-labels.js` - Label rendering with population styles
- `modules/renderers/draw-burg-icons.js` - Icon rendering with different shapes
- `index.html` - Added script reference to load configuration

## Troubleshooting

**Styles not appearing?**
- Clear browser cache and reload
- Check browser console for JavaScript errors
- Verify `config/population-styles.js` is loaded before renderer modules

**Wrong population ranges?**
- Check your map's actual population values using the burg editor
- Adjust `minPopulation` thresholds accordingly

**Performance issues?**
- Reduce the number of style tiers
- Use simpler shapes (circles are fastest to render)
- Consider increasing minimum population thresholds to reduce the number of small burgs

## Reloading the Map

After making changes to `config/population-styles.js`:
1. Save the file
2. Reload the page in your browser (Ctrl+R or Cmd+R)
3. If you have an existing .map file, load it to see the new styling applied
