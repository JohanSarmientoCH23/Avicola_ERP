import { Permiso } from '../../entities';

export interface IPermisoRepository {
  findById(id: string): Promise<Permiso | null>;
  findByCodigo(codigo: string): Promise<Permiso | null>;
  findAll(params?: { where?: any }): Promise<Permiso[]>;
  create(data: Partial<Permiso>): Promise<Permiso>;
  assignToRol(rol: string, permisoId: string): Promise<void>;
  removeFromRol(rol: string, permisoId: string): Promise<void>;
  findByRol(rol: string): Promise<Permiso[]>;
}
