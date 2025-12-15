export class ServerError extends Error {
  status = 500 as const;
  constructor(public message: string) {
    super(message);
  }
}
