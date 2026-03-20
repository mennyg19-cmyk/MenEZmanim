declare module 'express' {
  const express: {
    (): {
      use: (middleware: unknown) => unknown;
      get: (path: string, handler: (req: unknown, res: { json: (x: unknown) => void }) => void) => unknown;
      listen: (port: number, callback?: () => void) => unknown;
    };
    static: (root: string) => unknown;
  };
  export default express;
}
