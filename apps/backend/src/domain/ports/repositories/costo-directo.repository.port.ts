import { CostoDirecto } from '../../entities';

export interface ICostoDirectoRepository {
  findById(id: string): Promise<any>;
  findMany(params?: { where?: any; include?: any; orderBy?: any; skip?: number; take?: number }): Promise<any[]>;
  count(params?: { where?: any }): Promise<number>;
  aggregate(params: { where?: any; _sum?: any }): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
}
