/**
 * VedAI 2.0 — 2D Maze Generator Utility
 * 
 * Uses Depth-First Search with Recursive Backtracking to generate guaranteed solvable mazes.
 */

export function generateMaze(rows = 15, cols = 15) {
  // Ensure odd dimensions for clean walls/passages
  const r = rows % 2 === 0 ? rows + 1 : rows;
  const c = cols % 2 === 0 ? cols + 1 : cols;

  // 1 = wall, 0 = path
  const grid = Array.from({ length: r }, () => Array(c).fill(1));

  function isValid(x, y) {
    return x > 0 && x < r - 1 && y > 0 && y < c - 1;
  }

  // Carve passages
  function carve(x, y) {
    grid[x][y] = 0;

    const directions = [
      [-2, 0], [2, 0], [0, -2], [0, 2]
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (isValid(nx, ny) && grid[nx][ny] === 1) {
        // Carve wall between
        grid[x + dx / 2][y + dy / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  // Set entrance and exit
  grid[1][0] = 0; // Entrance
  grid[r - 2][c - 1] = 0; // Exit

  return {
    grid,
    rows: r,
    cols: c,
    start: { x: 1, y: 0 },
    exit: { x: r - 2, y: c - 1 }
  };
}
