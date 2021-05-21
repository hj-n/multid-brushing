


export function getMouseoverPoints(radius, bx, by, emb) {
  const rad_sq = radius * radius;
  return emb.reduce((acc, pos, i) => {
    const dx = bx - pos[0];
    const dy = by - pos[1];
    if (dx * dx + dy * dy < rad_sq) acc.push(i);
    return acc;
  }, [])
}