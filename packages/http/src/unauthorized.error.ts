export class UnauthorizedError extends Error {
  status = 401 as const;
  constructor(public message: string) {
    super(message);
  }
}
