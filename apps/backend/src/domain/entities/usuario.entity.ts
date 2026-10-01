export class Usuario {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly password: string,
    public readonly nombre: string,
    public readonly apellido: string,
    public readonly rol: string,
    public readonly estado: string = 'ACTIVO',
    public readonly avatar?: string,
    public readonly telefono?: string,
    public readonly lastLoginAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get fullName(): string {
    return `${this.nombre} ${this.apellido}`;
  }

  get isActive(): boolean {
    return this.estado === 'ACTIVO';
  }

  static create(data: {
    id?: string;
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    rol: string;
    avatar?: string;
    telefono?: string;
  }): Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> {
    return new Usuario(
      data.id || '',
      data.email,
      data.password,
      data.nombre,
      data.apellido,
      data.rol,
      'ACTIVO',
      data.avatar,
      data.telefono,
    );
  }
}
