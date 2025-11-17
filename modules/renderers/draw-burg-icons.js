"use strict";

function drawBurgIcons() {
  TIME && console.time("drawBurgIcons");

  icons.selectAll("circle, rect, polygon, path, use").remove(); // cleanup

  // capitals
  const capitals = pack.burgs.filter(b => b.capital && !b.removed);
  const capitalIcons = burgIcons.select("#cities");
  const capitalSize = capitalIcons.attr("size") || 1;
  const capitalAnchors = anchors.selectAll("#cities");
  const capitalAnchorsSize = capitalAnchors.attr("size") || 2;

  // Group capitals by shape type for efficient rendering
  const capitalsByShape = {circle: [], square: [], diamond: [], star: []};
  capitals.forEach(burg => {
    const style = getPopulationStyle(burg.population);
    const shape = style.icon.shape;
    if (capitalsByShape[shape]) {
      capitalsByShape[shape].push(burg);
    } else {
      capitalsByShape.circle.push(burg); // fallback to circle
    }
  });

  // Render circles
  if (capitalsByShape.circle.length > 0) {
    capitalIcons
      .selectAll("circle.capital-circle")
      .data(capitalsByShape.circle)
      .enter()
      .append("circle")
      .attr("class", "capital-circle")
      .attr("id", d => "burg" + d.i)
      .attr("data-id", d => d.i)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => capitalSize * getPopulationStyle(d.population).icon.sizeMultiplier)
      .attr("fill", d => getPopulationStyle(d.population).icon.color || null);
  }

  // Render squares
  if (capitalsByShape.square.length > 0) {
    capitalIcons
      .selectAll("rect.capital-square")
      .data(capitalsByShape.square)
      .enter()
      .append("rect")
      .attr("class", "capital-square")
      .attr("id", d => "burg" + d.i)
      .attr("data-id", d => d.i)
      .attr("x", d => d.x - (capitalSize * getPopulationStyle(d.population).icon.sizeMultiplier))
      .attr("y", d => d.y - (capitalSize * getPopulationStyle(d.population).icon.sizeMultiplier))
      .attr("width", d => capitalSize * getPopulationStyle(d.population).icon.sizeMultiplier * 2)
      .attr("height", d => capitalSize * getPopulationStyle(d.population).icon.sizeMultiplier * 2)
      .attr("fill", d => getPopulationStyle(d.population).icon.color || null);
  }

  // Render diamonds (rotated squares using polygon)
  if (capitalsByShape.diamond.length > 0) {
    capitalIcons
      .selectAll("polygon.capital-diamond")
      .data(capitalsByShape.diamond)
      .enter()
      .append("polygon")
      .attr("class", "capital-diamond")
      .attr("id", d => "burg" + d.i)
      .attr("data-id", d => d.i)
      .attr("points", d => {
        const size = capitalSize * getPopulationStyle(d.population).icon.sizeMultiplier * 1.4;
        return `${d.x},${d.y - size} ${d.x + size},${d.y} ${d.x},${d.y + size} ${d.x - size},${d.y}`;
      })
      .attr("fill", d => getPopulationStyle(d.population).icon.color || null);
  }

  // Render stars
  if (capitalsByShape.star.length > 0) {
    capitalIcons
      .selectAll("path.capital-star")
      .data(capitalsByShape.star)
      .enter()
      .append("path")
      .attr("class", "capital-star")
      .attr("id", d => "burg" + d.i)
      .attr("data-id", d => d.i)
      .attr("d", d => {
        const size = capitalSize * getPopulationStyle(d.population).icon.sizeMultiplier;
        return createStarPath(d.x, d.y, 5, size * 1.5, size * 0.6);
      })
      .attr("fill", d => getPopulationStyle(d.population).icon.color || null);
  }

  capitalAnchors
    .selectAll("use")
    .data(capitals.filter(c => c.port))
    .enter()
    .append("use")
    .attr("xlink:href", "#icon-anchor")
    .attr("data-id", d => d.i)
    .attr("x", d => rn(d.x - capitalAnchorsSize * 0.47, 2))
    .attr("y", d => rn(d.y - capitalAnchorsSize * 0.47, 2))
    .attr("width", capitalAnchorsSize)
    .attr("height", capitalAnchorsSize);

  // towns
  const towns = pack.burgs.filter(b => b.i && !b.capital && !b.removed);
  const townIcons = burgIcons.select("#towns");
  const townSize = townIcons.attr("size") || 0.5;
  const townsAnchors = anchors.selectAll("#towns");
  const townsAnchorsSize = townsAnchors.attr("size") || 1;

  // Group towns by shape type for efficient rendering
  const townsByShape = {circle: [], square: [], diamond: [], star: []};
  towns.forEach(burg => {
    const style = getPopulationStyle(burg.population);
    const shape = style.icon.shape;
    if (townsByShape[shape]) {
      townsByShape[shape].push(burg);
    } else {
      townsByShape.circle.push(burg); // fallback to circle
    }
  });

  // Render circles
  if (townsByShape.circle.length > 0) {
    townIcons
      .selectAll("circle.town-circle")
      .data(townsByShape.circle)
      .enter()
      .append("circle")
      .attr("class", "town-circle")
      .attr("id", d => "burg" + d.i)
      .attr("data-id", d => d.i)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => townSize * getPopulationStyle(d.population).icon.sizeMultiplier)
      .attr("fill", d => getPopulationStyle(d.population).icon.color || null);
  }

  // Render squares
  if (townsByShape.square.length > 0) {
    townIcons
      .selectAll("rect.town-square")
      .data(townsByShape.square)
      .enter()
      .append("rect")
      .attr("class", "town-square")
      .attr("id", d => "burg" + d.i)
      .attr("data-id", d => d.i)
      .attr("x", d => d.x - (townSize * getPopulationStyle(d.population).icon.sizeMultiplier))
      .attr("y", d => d.y - (townSize * getPopulationStyle(d.population).icon.sizeMultiplier))
      .attr("width", d => townSize * getPopulationStyle(d.population).icon.sizeMultiplier * 2)
      .attr("height", d => townSize * getPopulationStyle(d.population).icon.sizeMultiplier * 2)
      .attr("fill", d => getPopulationStyle(d.population).icon.color || null);
  }

  // Render diamonds (rotated squares using polygon)
  if (townsByShape.diamond.length > 0) {
    townIcons
      .selectAll("polygon.town-diamond")
      .data(townsByShape.diamond)
      .enter()
      .append("polygon")
      .attr("class", "town-diamond")
      .attr("id", d => "burg" + d.i)
      .attr("data-id", d => d.i)
      .attr("points", d => {
        const size = townSize * getPopulationStyle(d.population).icon.sizeMultiplier * 1.4;
        return `${d.x},${d.y - size} ${d.x + size},${d.y} ${d.x},${d.y + size} ${d.x - size},${d.y}`;
      })
      .attr("fill", d => getPopulationStyle(d.population).icon.color || null);
  }

  // Render stars
  if (townsByShape.star.length > 0) {
    townIcons
      .selectAll("path.town-star")
      .data(townsByShape.star)
      .enter()
      .append("path")
      .attr("class", "town-star")
      .attr("id", d => "burg" + d.i)
      .attr("data-id", d => d.i)
      .attr("d", d => {
        const size = townSize * getPopulationStyle(d.population).icon.sizeMultiplier;
        return createStarPath(d.x, d.y, 5, size * 1.5, size * 0.6);
      })
      .attr("fill", d => getPopulationStyle(d.population).icon.color || null);
  }

  townsAnchors
    .selectAll("use")
    .data(towns.filter(c => c.port))
    .enter()
    .append("use")
    .attr("xlink:href", "#icon-anchor")
    .attr("data-id", d => d.i)
    .attr("x", d => rn(d.x - townsAnchorsSize * 0.47, 2))
    .attr("y", d => rn(d.y - townsAnchorsSize * 0.47, 2))
    .attr("width", townsAnchorsSize)
    .attr("height", townsAnchorsSize);

  TIME && console.timeEnd("drawBurgIcons");
}

// Helper function to create a star path
function createStarPath(cx, cy, points, outerRadius, innerRadius) {
  let path = "";
  const angle = Math.PI / points;

  for (let i = 0; i < 2 * points; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + radius * Math.sin(i * angle);
    const y = cy - radius * Math.cos(i * angle);
    path += (i === 0 ? "M" : "L") + x + "," + y;
  }

  return path + "Z";
}
