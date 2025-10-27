export interface ICrudController<T> {
  create(createEntity: Omit<T, 'id'>): Promise<T>;
  update(id: number, updateEntity: Partial<T>): Promise<T>;
  delete(id: number): Promise<T>;
}

export interface ICrudRepository<T> extends ICrudController<T> {}
