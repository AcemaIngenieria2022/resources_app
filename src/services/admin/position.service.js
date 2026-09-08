import { AppError } from '@/lib/errors/AppError';
import * as posRepo from '@/lib/repositories/position.repository';

export async function listPositions({ limit = 200 } = {}) {
  const positions = await posRepo.findAllPositions(limit);
  return { positions, total: positions.length };
}

export async function getPosition(id) {
  const pos = await posRepo.findPositionById(id);
  if (!pos) throw new AppError('Cargo no encontrado', 404);
  return pos;
}

export async function createPosition(data) {
  if (!data.name) throw new AppError('El nombre es requerido', 400);
  const res = await posRepo.createPosition({ name: data.name, description: data.description || null });
  return { id: res.insertId };
}

export async function updatePosition(id, data) {
  const pos = await posRepo.findPositionById(id);
  if (!pos) throw new AppError('Cargo no encontrado', 404);
  await posRepo.updatePosition(id, { name: data.name, description: data.description || null });
  return true;
}

export async function removePosition(id) {
  const pos = await posRepo.findPositionById(id);
  if (!pos) throw new AppError('Cargo no encontrado', 404);
  await posRepo.deletePosition(id);
  return true;
}

export default {
  listPositions,
  getPosition,
  createPosition,
  updatePosition,
  removePosition,
};
