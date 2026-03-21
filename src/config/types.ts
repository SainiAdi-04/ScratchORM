export interface ScratchORMConfig {
  database: {
    containerName: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
}
