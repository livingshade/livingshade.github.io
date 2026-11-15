function squaredDistance(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

export function inspectAssignment(cells, query, probeCount) {
  const dense = probeCount === null;
  const selected = dense
    ? cells
    : cells
        .map(cell => ({ cell, distance: squaredDistance(cell, query) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, probeCount)
        .map(({ cell }) => cell);
  const candidates = selected.flatMap(cell => cell.centroids);
  let nearest = null;
  let bestDistance = Infinity;
  for (const centroid of candidates) {
    const distance = squaredDistance(centroid, query);
    if (distance < bestDistance) {
      nearest = centroid;
      bestDistance = distance;
    }
  }
  return { selected, candidates, nearest, cellChecks: dense ? 0 : cells.length };
}
