"use strict";

// Route Navigation Tool - Find best routes between burgs
let navClickMode = null; // "from", "to", or null

function openRouteNavigation() {
  closeDialogs(".stable");

  // Ensure burgs layer is visible (safely)
  try {
    if (typeof layerIsOn === "function" && typeof toggleIcons === "function") {
      if (!layerIsOn("toggleIcons")) toggleIcons();
    }
  } catch (e) {
    // Ignore if layer functions don't exist
  }

  // Populate burg dropdowns
  populateBurgDropdowns();

  // Open dialog
  $("#routeNavigation").dialog({
    title: "Route Navigation",
    resizable: false,
    width: fitContent(),
    position: {my: "center", at: "center", of: "#map", collision: "fit"},
    close: closeRouteNavigation
  });

  // Enable map clicking for burg selection
  navClickMode = "from";
  viewbox.style("cursor", "crosshair");
  viewbox.on("click", handleNavMapClick);
  updateNavClickInstruction();

  // Add event listeners if not already added
  if (modules.routeNavigation) return;
  modules.routeNavigation = true;

  byId("navCalculate").on("click", calculateRoutes);
  byId("navReset").on("click", resetNavigation);
  byId("navFromBurg").on("change", () => {
    if (navClickMode === "from") navClickMode = "to";
    updateNavClickInstruction();
  });
  byId("navToBurg").on("change", () => {
    updateNavClickInstruction();
  });
}

function resetNavigation() {
  // Clear search inputs
  byId("navFromBurgSearch").value = "";
  byId("navToBurgSearch").value = "";

  // Clear results
  byId("navResults").innerHTML = "";

  // Remove map highlight
  byId("navHighlight")?.remove();

  // Reset to "from" mode
  navClickMode = "from";

  // Repopulate dropdowns
  populateBurgDropdowns();

  // Update instruction
  updateNavClickInstruction();

  tip("Selections cleared. Click on map to select starting burg.", true, "success", 2000);
}

function handleNavMapClick() {
  const point = d3.mouse(this);
  const cell = findCell(point[0], point[1]);
  const burgId = pack.cells.burg[cell];

  if (!burgId) {
    tip("No burg at this location. Click on a burg icon.", false, "warn", 2000);
    return;
  }

  const burg = pack.burgs[burgId];
  const stateName = pack.states[burg.state]?.name || "Unknown";
  const label = `${burg.name} (${stateName})`;

  if (navClickMode === "from") {
    // Set From burg and trigger search update
    const fromSearch = byId("navFromBurgSearch");
    fromSearch.value = label;

    // Trigger the input event to update the filtered list
    const inputEvent = new Event('input', { bubbles: true });
    fromSearch.dispatchEvent(inputEvent);

    // Select the burg in the dropdown
    setTimeout(() => {
      byId("navFromBurg").value = burgId;

      // Move to "To" mode after value is set
      navClickMode = "to";
      updateNavClickInstruction();
    }, 100);

    tip(`From: ${burg.name}. Now click on destination burg.`, true, "success", 3000);
  } else if (navClickMode === "to") {
    // Set To burg and trigger search update
    const toSearch = byId("navToBurgSearch");
    toSearch.value = label;

    // Trigger the input event to update the filtered list
    const inputEvent = new Event('input', { bubbles: true });
    toSearch.dispatchEvent(inputEvent);

    // Select the burg in the dropdown
    setTimeout(() => {
      byId("navToBurg").value = burgId;
      updateNavClickInstruction();

      // Auto-calculate if both are selected
      const fromBurgId = parseInt(byId("navFromBurg").value);
      const toBurgId = parseInt(byId("navToBurg").value);
      if (fromBurgId && toBurgId && fromBurgId !== toBurgId) {
        setTimeout(() => calculateRoutes(), 400);
      }
    }, 100);

    tip(`To: ${burg.name}. Ready to calculate route!`, true, "success", 3000);
  }
}

function updateNavClickInstruction() {
  const instructionDiv = byId("navClickInstruction");
  if (!instructionDiv) return;

  const fromBurgId = byId("navFromBurg").value;
  const toBurgId = byId("navToBurg").value;

  if (!fromBurgId) {
    instructionDiv.innerHTML = '<span style="color: #2196F3">👆 Click on map to select starting burg</span>';
    // Only set to "from" mode if not already set
    if (navClickMode !== "from") navClickMode = "from";
  } else if (!toBurgId) {
    instructionDiv.innerHTML = '<span style="color: #4caf50">👆 Click on map to select destination burg</span>';
    // Only set to "to" mode if not already set
    if (navClickMode !== "to") navClickMode = "to";
  } else {
    instructionDiv.innerHTML = '<span style="color: #666">✓ Both burgs selected. Click Calculate or select new burgs.</span>';
  }
}

function populateBurgDropdowns() {
  const fromSelect = byId("navFromBurg");
  const toSelect = byId("navToBurg");
  const fromSearch = byId("navFromBurgSearch");
  const toSearch = byId("navToBurgSearch");

  // Get all burgs, sort by name
  const burgs = pack.burgs
    .filter(b => b.i && !b.removed)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Store all burgs for filtering
  const allBurgsData = burgs.map(burg => ({
    id: burg.i,
    name: burg.name,
    state: pack.states[burg.state]?.name || "Unknown",
    label: `${burg.name} (${pack.states[burg.state]?.name || "Unknown"})`
  }));

  // Function to populate a select with filtered burgs
  const populateSelect = (select, filter = "") => {
    select.innerHTML = "";
    const filtered = filter
      ? allBurgsData.filter(b => b.label.toLowerCase().includes(filter.toLowerCase()))
      : allBurgsData;

    // Limit to first 100 for performance
    filtered.slice(0, 100).forEach(burg => {
      const option = document.createElement("option");
      option.value = burg.id;
      option.textContent = burg.label;
      select.appendChild(option);
    });

    if (filtered.length > 100) {
      const option = document.createElement("option");
      option.disabled = true;
      option.textContent = `... and ${filtered.length - 100} more (refine your search)`;
      select.appendChild(option);
    }

    if (filtered.length === 0) {
      const option = document.createElement("option");
      option.disabled = true;
      option.textContent = "No burgs found";
      select.appendChild(option);
    }
  };

  // Initial population
  populateSelect(fromSelect);
  populateSelect(toSelect);

  // Add search functionality
  fromSearch.addEventListener("input", (e) => {
    populateSelect(fromSelect, e.target.value);
  });

  toSearch.addEventListener("input", (e) => {
    populateSelect(toSelect, e.target.value);
  });

  // Double-click to select
  fromSelect.addEventListener("dblclick", () => {
    if (fromSelect.value) fromSearch.value = fromSelect.options[fromSelect.selectedIndex].text;
  });

  toSelect.addEventListener("dblclick", () => {
    if (toSelect.value) toSearch.value = toSelect.options[toSelect.selectedIndex].text;
  });
}

function calculateRoutes() {
  const fromBurgId = parseInt(byId("navFromBurg").value);
  const toBurgId = parseInt(byId("navToBurg").value);

  if (!fromBurgId || !toBurgId) {
    tip("Please select both start and destination burgs", false, "error", 3000);
    return;
  }

  if (fromBurgId === toBurgId) {
    tip("Start and destination must be different", false, "error", 3000);
    return;
  }

  const fromBurg = pack.burgs[fromBurgId];
  const toBurg = pack.burgs[toBurgId];

  // Find multiple paths
  const paths = findMultiplePaths(fromBurg.cell, toBurg.cell, 3);

  if (paths.length === 0) {
    byId("navResults").innerHTML = '<div style="color: #f44336; padding: 1em; text-align: center">No route found between these burgs!</div>';
    return;
  }

  // Display results
  displayNavigationResults(paths, fromBurg, toBurg);
}

// Find multiple paths using a modified Dijkstra's algorithm
function findMultiplePaths(startCell, endCell, maxPaths = 3) {
  const paths = [];
  const excludedEdges = new Set(); // Edges to exclude for alternative routes

  for (let pathIndex = 0; pathIndex < maxPaths; pathIndex++) {
    const path = findShortestPath(startCell, endCell, excludedEdges);

    if (!path) break; // No more paths found

    paths.push(path);

    // Exclude some edges from this path for the next iteration
    // Exclude middle 50% of edges to find truly different routes
    const startExclude = Math.floor(path.cells.length * 0.25);
    const endExclude = Math.floor(path.cells.length * 0.75);

    for (let i = startExclude; i < endExclude && i < path.cells.length - 1; i++) {
      const edgeKey = getEdgeKey(path.cells[i], path.cells[i + 1]);
      excludedEdges.add(edgeKey);
    }
  }

  return paths;
}

// Dijkstra's shortest path algorithm
function findShortestPath(startCell, endCell, excludedEdges = new Set()) {
  if (!pack.cells.routes) {
    return null; // No routes data available
  }

  const distances = new Map();
  const previous = new Map();
  const routeUsed = new Map(); // Track which route was used to reach each cell
  const unvisited = new Set();

  // Initialize
  pack.cells.i.forEach(cellId => {
    if (cellId) {
      distances.set(cellId, Infinity);
      unvisited.add(cellId);
    }
  });
  distances.set(startCell, 0);

  while (unvisited.size > 0) {
    // Find unvisited cell with minimum distance
    let currentCell = null;
    let minDistance = Infinity;

    for (const cell of unvisited) {
      const dist = distances.get(cell);
      if (dist < minDistance) {
        minDistance = dist;
        currentCell = cell;
      }
    }

    if (currentCell === null || minDistance === Infinity) break;
    if (currentCell === endCell) break; // Found destination

    unvisited.delete(currentCell);

    // Check neighbors connected by routes
    const connections = pack.cells.routes[currentCell];
    if (!connections) continue;

    for (const [neighborCell, routeId] of Object.entries(connections)) {
      const neighbor = parseInt(neighborCell);
      if (!unvisited.has(neighbor)) continue;

      // Check if this edge is excluded
      const edgeKey = getEdgeKey(currentCell, neighbor);
      if (excludedEdges.has(edgeKey)) continue;

      // Calculate distance (edge weight)
      const route = pack.routes.find(r => r.i === routeId);
      if (!route) continue;

      // Get physical distance
      const [x1, y1] = pack.cells.p[currentCell];
      const [x2, y2] = pack.cells.p[neighbor];
      const physicalDistance = Math.hypot(x2 - x1, y2 - y1);

      // Get elevation change
      const h1 = pack.cells.h[currentCell];
      const h2 = pack.cells.h[neighbor];
      const elevationChange = h2 - h1;

      // Calculate time weight based on route type and speed limits
      // route-a (highway): 120 km/h, route-c (secondary): 100 km/h, route-e (tertiary): 90 km/h
      let speedFactor = 1; // Base speed for default routes
      if (route.group === "route-a") speedFactor = 120 / 100; // Highway, fastest
      else if (route.group === "route-c") speedFactor = 100 / 100; // Secondary, medium speed
      else if (route.group === "route-e") speedFactor = 90 / 100; // Tertiary, slower
      else if (route.group === "roads") speedFactor = 100 / 100; // Default roads
      else if (route.group === "trails") speedFactor = 60 / 100; // Trails are slower
      else if (route.group === "searoutes") speedFactor = 80 / 100; // Sea routes
      else speedFactor = 80 / 100; // Custom routes

      // Elevation penalty: uphill slows you down, downhill slightly helps
      let elevationPenalty = 1;
      if (elevationChange > 0) {
        // Going uphill - add penalty proportional to elevation gain
        elevationPenalty = 1 + (elevationChange / 100) * 0.3; // 30% slower per 100 height units gained
      } else if (elevationChange < 0) {
        // Going downhill - slight speed bonus but not as much
        elevationPenalty = 1 + (elevationChange / 100) * 0.1; // 10% faster per 100 height units lost
      }

      // Weight = time to traverse = distance / speed * elevation penalty
      // Lower weight = faster route = preferred
      const weight = (physicalDistance / speedFactor) * elevationPenalty;

      const altDistance = distances.get(currentCell) + weight;

      if (altDistance < distances.get(neighbor)) {
        distances.set(neighbor, altDistance);
        previous.set(neighbor, currentCell);
        routeUsed.set(neighbor, routeId);
      }
    }
  }

  // Reconstruct path
  if (!previous.has(endCell)) return null;

  const cells = [];
  const routes = [];
  let current = endCell;

  while (current !== startCell) {
    cells.unshift(current);
    const routeId = routeUsed.get(current);
    if (routeId) routes.unshift(routeId);
    current = previous.get(current);
    if (!current) return null; // Path broken
  }
  cells.unshift(startCell);

  // Group consecutive cells by route to calculate distances per route segment
  const routeSegments = [];
  let currentRouteId = routes[0];
  let currentSegmentCells = [cells[0], cells[1]];

  for (let i = 1; i < routes.length; i++) {
    if (routes[i] === currentRouteId) {
      currentSegmentCells.push(cells[i + 1]);
    } else {
      routeSegments.push({routeId: currentRouteId, cells: currentSegmentCells});
      currentRouteId = routes[i];
      currentSegmentCells = [cells[i], cells[i + 1]];
    }
  }
  if (currentSegmentCells.length > 1) {
    routeSegments.push({routeId: currentRouteId, cells: currentSegmentCells});
  }

  // Calculate total distance, travel time, and toll costs by route segment
  let totalDistance = 0;
  let totalTime = 0; // in hours
  let totalTollCost = 0; // in euros
  const tollRate = 0.0055; // €0.0055 per km for route-a highways

  routeSegments.forEach(segment => {
    const route = pack.routes.find(r => r.i === segment.routeId);
    if (!route) return;

    // Calculate segment distance - just use start and end points
    const startCell = segment.cells[0];
    const endCell = segment.cells[segment.cells.length - 1];
    const [x1, y1] = pack.cells.p[startCell];
    const [x2, y2] = pack.cells.p[endCell];
    const straightLineDistance = Math.hypot(x2 - x1, y2 - y1);

    // Apply a winding factor (routes are typically 1.2-1.5x longer than straight line)
    let windingFactor = 1.3;
    if (route.group === "route-a") windingFactor = 1.1; // Highways are straighter
    else if (route.group === "route-c") windingFactor = 1.2;
    else if (route.group === "route-e") windingFactor = 1.3;
    else if (route.group === "trails") windingFactor = 1.5; // Trails wind more

    const segmentDistance = straightLineDistance * windingFactor;
    totalDistance += segmentDistance;

    // Get route speed for time calculation
    let speed = 100;
    if (route.group === "route-a") speed = 120;
    else if (route.group === "route-c") speed = 100;
    else if (route.group === "route-e") speed = 90;
    else if (route.group === "roads") speed = 100;
    else if (route.group === "trails") speed = 60;
    else if (route.group === "searoutes") speed = 80;
    else speed = 80;

    // Get average elevation change for time adjustment
    const h1 = pack.cells.h[startCell];
    const h2 = pack.cells.h[endCell];
    const elevationChange = h2 - h1;

    let elevationPenalty = 1;
    if (elevationChange > 0) {
      elevationPenalty = 1 + (elevationChange / 100) * 0.3;
    } else if (elevationChange < 0) {
      elevationPenalty = 1 + (elevationChange / 100) * 0.1;
    }

    // Convert to actual distance using distanceScale
    const actualDistance = segmentDistance * distanceScale;

    // Time = distance / speed * elevation penalty
    totalTime += (actualDistance / speed) * elevationPenalty;

    // Calculate toll cost for route-a highways
    if (route.group === "route-a") {
      totalTollCost += actualDistance * tollRate;
    }
  });

  // Convert to actual distance
  const actualTotalDistance = totalDistance * distanceScale;

  return {
    cells,
    routes,
    distance: actualTotalDistance,
    time: totalTime, // in hours
    tollCost: totalTollCost // in euros
  };
}

function getEdgeKey(cell1, cell2) {
  return cell1 < cell2 ? `${cell1}-${cell2}` : `${cell2}-${cell1}`;
}

function displayNavigationResults(paths, fromBurg, toBurg) {
  const resultsDiv = byId("navResults");
  resultsDiv.innerHTML = "";

  const distanceUnit = distanceUnitInput?.value || "km";

  paths.forEach((path, index) => {
    const pathDiv = document.createElement("div");
    pathDiv.style.cssText = "border: 1px solid #ccc; padding: 1em; margin-bottom: 1em; border-radius: 4px; background: #f9f9f9";

    // Format travel time
    const hours = Math.floor(path.time);
    const minutes = Math.round((path.time - hours) * 60);
    let timeString = "";
    if (hours > 0) {
      timeString = `${hours}h ${minutes}m`;
    } else {
      timeString = `${minutes}m`;
    }

    // Format toll cost
    let tollString = "";
    if (path.tollCost > 0) {
      tollString = ` • <span style="color: #ff9800">€${path.tollCost.toFixed(2)}</span>`;
    }

    // Path header
    const header = document.createElement("div");
    header.style.cssText = "font-weight: bold; margin-bottom: 0.5em; font-size: 1.1em; display: flex; justify-content: space-between; align-items: center";
    header.innerHTML = `
      <span>Route ${index + 1}</span>
      <span style="color: #2196F3">${rn(path.distance || 0)} ${distanceUnit} • ${timeString}${tollString}</span>
    `;
    pathDiv.appendChild(header);

    // Generate navigation steps
    const steps = generateNavigationSteps(path, fromBurg, toBurg);

    const stepsList = document.createElement("ol");
    stepsList.style.cssText = "margin: 0.5em 0; padding-left: 1.5em";

    steps.forEach(step => {
      const stepItem = document.createElement("li");
      stepItem.style.cssText = "margin: 0.3em 0; line-height: 1.4";
      stepItem.innerHTML = step;
      stepsList.appendChild(stepItem);
    });

    pathDiv.appendChild(stepsList);

    // Add "Show on Map" button
    const showButton = document.createElement("button");
    showButton.textContent = "Show on Map";
    showButton.className = "icon-eye";
    showButton.style.cssText = "margin-top: 0.5em; padding: 0.3em 0.8em";
    showButton.onclick = () => highlightPathOnMap(path);
    pathDiv.appendChild(showButton);

    resultsDiv.appendChild(pathDiv);
  });
}

function generateNavigationSteps(path, fromBurg, toBurg) {
  const steps = [];
  const distanceUnit = distanceUnitInput?.value || "km";

  // Start
  steps.push(`<strong>Start at ${fromBurg.name}</strong>`);

  // Group consecutive cells by route
  const routeSegments = [];
  let currentRouteId = null;
  let currentSegment = {cells: [path.cells[0]]};

  for (let i = 0; i < path.routes.length; i++) {
    const routeId = path.routes[i];
    const nextCell = path.cells[i + 1];

    if (routeId !== currentRouteId) {
      if (currentRouteId !== null) {
        routeSegments.push(currentSegment);
      }
      currentRouteId = routeId;
      currentSegment = {
        routeId: routeId,
        cells: [path.cells[i], nextCell]
      };
    } else {
      currentSegment.cells.push(nextCell);
    }
  }
  if (currentSegment.routeId) {
    routeSegments.push(currentSegment);
  }

  // Generate steps for each segment
  routeSegments.forEach((segment, index) => {
    const route = pack.routes.find(r => r.i === segment.routeId);
    if (!route) return;

    const routeName = route.name || Routes.generateName(route);
    const routeType = route.group;

    // Calculate segment distance - use start and end points with winding factor
    const startCell = segment.cells[0];
    const endCell = segment.cells[segment.cells.length - 1];
    const [x1, y1] = pack.cells.p[startCell];
    const [x2, y2] = pack.cells.p[endCell];
    const straightLineDistance = Math.hypot(x2 - x1, y2 - y1);

    // Apply winding factor based on route type
    let windingFactor = 1.3;
    if (route.group === "route-a") windingFactor = 1.1;
    else if (route.group === "route-c") windingFactor = 1.2;
    else if (route.group === "route-e") windingFactor = 1.3;
    else if (route.group === "trails") windingFactor = 1.5;

    const segmentDistance = straightLineDistance * windingFactor * distanceScale;

    // Get route speed
    let speed = 100;
    if (route.group === "route-a") speed = 120;
    else if (route.group === "route-c") speed = 100;
    else if (route.group === "route-e") speed = 90;
    else if (route.group === "roads") speed = 100;
    else if (route.group === "trails") speed = 60;
    else if (route.group === "searoutes") speed = 80;
    else speed = 80;

    // Get elevation change for time adjustment
    const h1 = pack.cells.h[startCell];
    const h2 = pack.cells.h[endCell];
    const elevationChange = h2 - h1;

    let elevationPenalty = 1;
    if (elevationChange > 0) {
      elevationPenalty = 1 + (elevationChange / 100) * 0.3;
    } else if (elevationChange < 0) {
      elevationPenalty = 1 + (elevationChange / 100) * 0.1;
    }

    // Calculate segment time
    const segmentTime = (segmentDistance / speed) * elevationPenalty;

    // Format segment time
    const segHours = Math.floor(segmentTime);
    const segMinutes = Math.round((segmentTime - segHours) * 60);
    let segTimeString = "";
    if (segHours > 0) {
      segTimeString = ` (${segHours}h ${segMinutes}m)`;
    } else if (segMinutes > 0) {
      segTimeString = ` (${segMinutes}m)`;
    }

    // Create route badge with color coding
    let badgeBg = "#666";
    let badgeColor = "#fff";
    if (route.group === "route-a") {
      badgeBg = "#4caf50"; // Green
      badgeColor = "#fff";
    } else if (route.group === "route-c") {
      badgeBg = "#f44336"; // Red
      badgeColor = "#fff";
    } else if (route.group === "route-e") {
      badgeBg = "#ffeb3b"; // Yellow
      badgeColor = "#000";
    }

    // Truncate route name to max 4 characters
    const shortName = routeName.substring(0, 4).toUpperCase();
    const routeBadge = `<span style="display: inline-block; background: ${badgeBg}; color: ${badgeColor}; padding: 2px 8px; border-radius: 12px; font-size: 0.85em; font-weight: bold; margin: 0 4px; vertical-align: middle">${shortName}</span>`;

    // Calculate toll cost for route-a segments
    const tollRate = 0.0055; // €0.0055 per km
    let segmentTollString = "";
    if (route.group === "route-a") {
      const segmentTollCost = segmentDistance * tollRate;
      segmentTollString = ` <span style="color: #ff9800; font-weight: bold">[€${segmentTollCost.toFixed(2)}]</span>`;
    }

    // Check for burgs along the way
    const burgsOnSegment = [];
    for (let i = 1; i < segment.cells.length - 1; i++) {
      const burgId = pack.cells.burg[segment.cells[i]];
      if (burgId && burgId !== fromBurg.i && burgId !== toBurg.i) {
        burgsOnSegment.push(pack.burgs[burgId].name);
      }
    }

    let stepText = `Follow ${routeBadge} for ${rn(segmentDistance || 0)} ${distanceUnit}${segTimeString}${segmentTollString}`;

    if (burgsOnSegment.length > 0) {
      stepText += ` <span style="color: #666">(passing through ${burgsOnSegment.join(", ")})</span>`;
    }

    steps.push(stepText);
  });

  // End
  steps.push(`<strong>Arrive at ${toBurg.name}</strong>`);

  return steps;
}

function highlightPathOnMap(path) {
  // Remove previous highlights
  byId("navHighlight")?.remove();

  if (!layerIsOn("toggleRoutes")) toggleRoutes();

  // Create highlight layer
  const svg = d3.select("#routes");
  const g = svg.insert("g", ":first-child").attr("id", "navHighlight");

  // Draw path
  const points = path.cells.map(cellId => pack.cells.p[cellId]);
  const line = d3.line();

  g.append("path")
    .attr("d", line(points))
    .attr("fill", "none")
    .attr("stroke", "#ff9800")
    .attr("stroke-width", 3)
    .attr("stroke-opacity", 0.8)
    .attr("stroke-dasharray", "10,5");

  // Add markers at start and end
  points.forEach((point, index) => {
    if (index === 0 || index === points.length - 1) {
      g.append("circle")
        .attr("cx", point[0])
        .attr("cy", point[1])
        .attr("r", 5)
        .attr("fill", index === 0 ? "#4caf50" : "#f44336")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2);
    }
  });

  tip("Route highlighted on map (orange). Green = start, Red = end", true, "success", 5000);
}

function closeRouteNavigation() {
  byId("navHighlight")?.remove();
  byId("navResults").innerHTML = "";

  // Restore default cursor and remove click handler
  navClickMode = null;
  restoreDefaultEvents();
  clearMainTip();

  modules.routeNavigation = false;
}
