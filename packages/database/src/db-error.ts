type DatabaseError = {
  message: string;
  code: string;
}

export const parseDatabaseError = (error: any): DatabaseError | null => {
  const dbError = error?.cause;
  if (!dbError) return null;
  return {
    message: dbError.message,
    code: dbError.code
  }
};
