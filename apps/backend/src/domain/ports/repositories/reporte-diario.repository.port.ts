import { ReporteDiario } from '../../entities';

export interface IReporteDiarioRepository {
  findById(id: string): Promise<any>;
  findMany(params?: { where?: any; include?: any; orderBy?: any; skip?: number; take?: number }): Promise<any[]>;
  count(params?: { where?: any }): Promise<number>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
}
