import { query } from '@/lib/db/mysql';

export async function findAllCompanies(limit = 200) {
  return query(
    `SELECT id, name, city, address, color FROM company ORDER BY name ASC LIMIT ?`,
    [Number(limit)]
  );
}

export async function findCompanyById(id) {
  const rows = await query(
    `SELECT id, name, city, address, color FROM company WHERE id = ? LIMIT 1`,
    [Number(id)]
  );
  return rows?.[0] ?? null;
}

export async function createCompany({ name, city, address, color }) {
  const result = await query(
    `INSERT INTO company (name, city, address, color) VALUES (?, ?, ?, ?)`,
    [name, city || null, address || null, color]
  );
  return { insertId: result.insertId };
}

export async function updateCompany(id, { name, city, address, color }) {
  return query(
    `UPDATE company SET name = ?, city = ?, address = ?, color = ? WHERE id = ?`,
    [name, city || null, address || null, color, Number(id)]
  );
}

export async function deleteCompany(id) {
  return query(`DELETE FROM company WHERE id = ?`, [Number(id)]);
}

const companyRepository = {
  findAllCompanies,
  findCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};

export default companyRepository;
