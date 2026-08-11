import { AppError } from '@/lib/errors/AppError';
import { countEmployees, findAllEmployees, findEmployeeById } from '@/lib/repositories/employee.repository';

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

export const employeeService = {
  listEmployees,
  getEmployeeById,
};

export default employeeService;
