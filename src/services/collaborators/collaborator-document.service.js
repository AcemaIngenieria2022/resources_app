// Servicio para gestionar documentos asociados a un colaborador y validar su unicidad.
import { AppError } from '@/lib/errors/AppError';
import {
  findAllCollaboratorDocuments,
  findDocumentsByEmployeeId,
  findDocumentById,
  createCollaboratorDocument,
  updateCollaboratorDocument,
  deleteCollaboratorDocument,
  countDocuments,
  documentNumberExists
} from '@/lib/repositories/collaborator-document.repository';
import { findEmployeeById } from '@/lib/repositories/employee.repository';

export async function listCollaboratorDocuments({ limit = 50 } = {}) {
  try {
    const documents = await findAllCollaboratorDocuments(limit);
    const total = await countDocuments();

    return {
      documents,
      total,
    };
  } catch (error) {
    throw new AppError('No se pudo obtener la lista de documentos', 500);
  }
}

export async function getDocumentsByEmployeeId(employee_id) {
  try {
    const employee = await findEmployeeById(employee_id);
    if (!employee) {
      throw new AppError('Empleado no encontrado', 404);
    }

    const documents = await findDocumentsByEmployeeId(employee_id);
    return documents || [];
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('No se pudo obtener los documentos del empleado', 500);
  }
}

export async function getDocumentById(id) {
  try {
    const document = await findDocumentById(id);

    if (!document) {
      throw new AppError('Documento no encontrado', 404);
    }

    return document;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('No se pudo consultar el documento', 500);
  }
}

export async function addCollaboratorDocument(data) {
  if (!data.employee_id || !data.document_number) {
    throw new AppError('ID de empleado y número de documento son requeridos', 400);
  }

  // Validar que el empleado existe
  const employee = await findEmployeeById(data.employee_id);
  if (!employee) {
    throw new AppError('Empleado no encontrado', 400);
  }

  // Validar que el número de documento es único
  const exists = await documentNumberExists(data.document_number);
  if (exists) {
    throw new AppError('El número de documento ya existe', 400);
  }

  const res = await createCollaboratorDocument({
    employee_id: data.employee_id,
    document_number: data.document_number,
  });

  return { id: res.insertId };
}

export async function editCollaboratorDocument(id, data) {
  const document = await findDocumentById(id);
  if (!document) throw new AppError('Documento no encontrado', 404);

  // Si se cambió el número de documento, validar que sea único
  if (data.document_number && data.document_number !== document.document_number) {
    const exists = await documentNumberExists(data.document_number, id);
    if (exists) {
      throw new AppError('El número de documento ya existe', 400);
    }
  }

  await updateCollaboratorDocument(id, {
    document_number: data.document_number || document.document_number,
  });

  return true;
}

export async function removeCollaboratorDocument(id) {
  const document = await findDocumentById(id);
  if (!document) throw new AppError('Documento no encontrado', 404);

  await deleteCollaboratorDocument(id);
  return true;
}
