import { AppError } from '@/lib/errors/AppError';
import { query } from '@/lib/db/mysql';
import {
  countEmployees,
  findAllEmployees,
  findEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  findEmployeesByDepartment,
  findEmployeesByPosition
} from '@/lib/repositories/employee.repository';
import * as deptRepo from '@/lib/repositories/department.repository';
import * as posRepo from '@/lib/repositories/position.repository';

const COLLABORATOR_ROLE_NAME = 'collaborator';

export async function listEmployees({ limit = 50 } = {}) {
  try {
    const employees = await findAllEmployees(limit);
    const total = await countEmployees();

    return {
      employees,
      total,
    };
  } catch (error) {
    throw new AppError('No se pudo obtener la lista de empleados', 500);
  }
}

export async function getEmployeeById(id) {
  try {
    const employee = await findEmployeeById(id);

    if (!employee) {
      throw new AppError('Empleado no encontrado', 404);
    }

    return employee;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('No se pudo consultar el empleado', 500);
  }
}

export async function addEmployee(data) {
  if (!data.employeedID || !data.personName) {
    throw new AppError('ID de empleado y nombre son requeridos', 400);
  }

  // Validar FK si se proporciona
  if (data.department_id) {
    const dept = await deptRepo.findDepartmentById(data.department_id);
    if (!dept) throw new AppError('Departamento no existe', 400);
  }

  if (data.position_id) {
    const pos = await posRepo.findPositionById(data.position_id);
    if (!pos) throw new AppError('Cargo no existe', 400);
  }

  const roleId = data.role_id || await getCollaboratorRoleId();
  if (roleId) {
    const role = await findRoleById(roleId);
    if (!role) throw new AppError('Rol no existe', 400);
  }

  const res = await createEmployee({
    employeedID: data.employeedID,
    personName: data.personName,
    department_id: data.department_id || null,
    position_id: data.position_id || null,
    role_id: roleId,
    user_id: data.user_id || null,
    active: data.active !== false,
  });

  return { id: res.insertId };
}

export async function editEmployee(id, data) {
  const emp = await findEmployeeById(id);
  if (!emp) throw new AppError('Empleado no encontrado', 404);

  if (data.department_id) {
    const dept = await deptRepo.findDepartmentById(data.department_id);
    if (!dept) throw new AppError('Departamento no existe', 400);
  }

  if (data.position_id) {
    const pos = await posRepo.findPositionById(data.position_id);
    if (!pos) throw new AppError('Cargo no existe', 400);
  }

  if (data.role_id) {
    const role = await findRoleById(data.role_id);
    if (!role) throw new AppError('Rol no existe', 400);
  }

  await updateEmployee(id, {
    personName: data.personName || emp.personName,
    department_id: data.department_id !== undefined ? data.department_id : emp.department_id,
    position_id: data.position_id !== undefined ? data.position_id : emp.position_id,
    role_id: data.role_id !== undefined ? data.role_id : emp.role_id,
    user_id: data.user_id !== undefined ? data.user_id : emp.user_id,
    active: data.active !== undefined ? data.active : emp.active,
  });

  return true;
}

async function getCollaboratorRoleId() {
  const rows = await query('SELECT id FROM roles WHERE name = ? LIMIT 1', [COLLABORATOR_ROLE_NAME]);
  return rows?.[0]?.id || null;
}

async function findRoleById(id) {
  const rows = await query('SELECT id FROM roles WHERE id = ? LIMIT 1', [Number(id)]);
  return rows?.[0] || null;
}

export async function removeEmployee(id) {
  const emp = await findEmployeeById(id);
  if (!emp) throw new AppError('Empleado no encontrado', 404);
  await deleteEmployee(id);
  return true;
}

export const employeeService = {
  listEmployees,
  getEmployeeById,
  addEmployee,
  editEmployee,
  removeEmployee,
};

export default employeeService;
