export class NotFoundError extends Error {
  status = 404 as const;
  constructor(public message: string) {
    super(message);
  }
}
