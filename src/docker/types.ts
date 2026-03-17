import type DockerModem = require("docker-modem");

export interface PostgresContainerConfig {
  containerName: string;
  image: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface DockerWithProgress {
  modem: DockerModem;
}
