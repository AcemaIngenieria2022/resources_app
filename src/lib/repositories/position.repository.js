import { query } from '@/lib/db/mysql';

export async function findAllPositions(limit = 200) {
  return query(
    `
      SELECT
        id,
        name,
        description
      FROM positions
      ORDER BY id ASC
      LIMIT ?
    `,
    [Number(limit)]
  );
}

export async function findPositionById(id) {
  const rows = await query(
    `
      SELECT id, name, description
      FROM positions
      WHERE id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows?.[0] ?? null;
}

export async function createPosition({ name, description }) {
  const result = await query(`INSERT INTO positions (name, description) VALUES (?, ?)`, [name, description]);
  return { insertId: result.insertId };
}

export async function updatePosition(id, { name, description }) {
  const result = await query(`UPDATE positions SET name = ?, description = ? WHERE id = ?`, [name, description, Number(id)]);
  return result;
}

export async function deletePosition(id) {
  const result = await query(`DELETE FROM positions WHERE id = ?`, [Number(id)]);
  return result;
}

export default {
  findAllPositions,
  findPositionById,
  createPosition,
  updatePosition,
  deletePosition,
};
