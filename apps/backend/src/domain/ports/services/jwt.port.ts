export interface IJwtPort {
  sign(payload: any, options?: any): string;
  verify(token: string): any;
}
