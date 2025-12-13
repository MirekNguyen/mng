export class BadRequestError extends Error {
  status = 400 as const;
  constructor(public message: string) {
    super(message);
  }
}
