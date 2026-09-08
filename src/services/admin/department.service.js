import { AppError } from '@/lib/errors/AppError';
import * as deptRepo from '@/lib/repositories/department.repository';

export async function listDepartments({ limit = 200 } = {}) {
  const departments = await deptRepo.findAllDepartments(limit);
  return { departments, total: departments.length };
}

export async function getDepartment(id) {
  const dept = await deptRepo.findDepartmentById(id);
  if (!dept) throw new AppError('Departamento no encontrado', 404);
  return dept;
}

export async function createDepartment(data) {
  if (!data.name) throw new AppError('El nombre es requerido', 400);
  const res = await deptRepo.createDepartment({ name: data.name, description: data.description || null });
  return { id: res.insertId };
}

export async function updateDepartment(id, data) {
  const dept = await deptRepo.findDepartmentById(id);
  if (!dept) throw new AppError('Departamento no encontrado', 404);
  await deptRepo.updateDepartment(id, { name: data.name, description: data.description || null });
  return true;
}

export async function removeDepartment(id) {
  const dept = await deptRepo.findDepartmentById(id);
  if (!dept) throw new AppError('Departamento no encontrado', 404);
  await deptRepo.deleteDepartment(id);
  return true;
}

export default {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  removeDepartment,
};
