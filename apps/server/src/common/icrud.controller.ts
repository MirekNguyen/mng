export interface ICrudController<T> {
  get(...args: (string | number)[]): Promise<T[]>;
  create(createEntity: Omit<T, 'id'>): Promise<T>;
  update(id: number, updateEntity: Partial<T>): Promise<T>;
  delete(id: number): Promise<T>;
}
