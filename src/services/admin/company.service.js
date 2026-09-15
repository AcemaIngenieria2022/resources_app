import { AppError } from '@/lib/errors/AppError';
import * as companyRepo from '@/lib/repositories/company.repository';

const DEFAULT_COMPANY_COLOR = '#36BBA7';

function normalizeColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color || '') ? color.toUpperCase() : DEFAULT_COMPANY_COLOR;
}

export async function listCompanies({ limit = 200 } = {}) {
  const companies = await companyRepo.findAllCompanies(limit);
  return { companies, total: companies.length };
}

export async function getCompany(id) {
  const company = await companyRepo.findCompanyById(id);
  if (!company) throw new AppError('Empresa no encontrada', 404);
  return company;
}

export async function createCompany(data) {
  if (!data.name?.trim()) throw new AppError('El nombre de la empresa es requerido', 400);
  const result = await companyRepo.createCompany({
    name: data.name.trim(),
    city: data.city,
    address: data.address,
    color: normalizeColor(data.color),
  });
  return { id: result.insertId };
}

export async function updateCompany(id, data) {
  await getCompany(id);
  if (!data.name?.trim()) throw new AppError('El nombre de la empresa es requerido', 400);
  await companyRepo.updateCompany(id, {
    name: data.name.trim(),
    city: data.city,
    address: data.address,
    color: normalizeColor(data.color),
  });
  return true;
}

export async function removeCompany(id) {
  await getCompany(id);
  await companyRepo.deleteCompany(id);
  return true;
}
