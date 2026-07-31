declare module "sharp" {
  type SharpInput =
    | Buffer
    | {
        create: {
          width: number;
          height: number;
          channels: 1 | 2 | 3 | 4;
          background: string;
        };
      };

  type SharpOptions = {
    limitInputPixels?: number;
  };

  type Metadata = {
    format?: string;
    width?: number;
    height?: number;
  };

  type Sharp = {
    metadata(): Promise<Metadata>;
    png(): Sharp;
    toBuffer(): Promise<Buffer>;
  };

  const sharp: (input?: SharpInput, options?: SharpOptions) => Sharp;
  export default sharp;
}
