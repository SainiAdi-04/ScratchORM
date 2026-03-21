import Docker = require("dockerode");
import { existsSync } from "fs";
import { Socket } from "net";
import type { ContainerInfo, ContainerCreateOptions } from "dockerode";
import type { DockerWithProgress, PostgresContainerConfig } from "./types";

const POSTGRES_CONTAINER_PORT = "5432/tcp";
const POSTGRES_VOLUME_NAME = "scratchorm-pgdata";

function resolveDockerSocket(): string {
  const desktopSocket = `${process.env["HOME"] ?? ""}/.docker/desktop/docker.sock`;
  const defaultSocket = "/var/run/docker.sock";
  const userSocket = `/run/user/${process.getuid?.() ?? 1000}/docker.sock`;

  if (existsSync(desktopSocket)) return desktopSocket;
  if (existsSync(userSocket)) return userSocket;
  return defaultSocket;
}

export class DockerManager {
  private readonly docker: Docker;

  public constructor(docker?: Docker) {
    if (docker !== undefined) {
      this.docker = docker;
      return;
    }

    this.docker = new Docker({ socketPath: resolveDockerSocket() });
  }

  public async isDockerRunning(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  public async containerExists(name: string): Promise<boolean> {
    const containers = await this.findContainersByName(name);
    return containers.some((container) => this.containerHasName(container, name));
  }

  public async isContainerRunning(name: string): Promise<boolean> {
    const containers = await this.findContainersByName(name);

    return containers.some(
      (container) =>
        this.containerHasName(container, name) && container.State.toLowerCase() === "running",
    );
  }

  public async startContainer(name: string): Promise<void> {
    const containerInfo = await this.findExactContainer(name);

    if (containerInfo === null) {
      throw new Error(`Container "${name}" does not exist.`);
    }

    const container = this.docker.getContainer(containerInfo.Id);
    await container.start();
  }

  public async createAndStartPostgres(config: PostgresContainerConfig): Promise<void> {
    await this.ensureImagePresent(config.image);
    await this.ensureVolumeExists(POSTGRES_VOLUME_NAME);

    const createOptions: ContainerCreateOptions = {
      name: config.containerName,
      Image: config.image,
      Env: [
        `POSTGRES_DB=${config.database}`,
        `POSTGRES_USER=${config.user}`,
        `POSTGRES_PASSWORD=${config.password}`,
      ],
      ExposedPorts: {
        [POSTGRES_CONTAINER_PORT]: {},
      },
      HostConfig: {
        PortBindings: {
          [POSTGRES_CONTAINER_PORT]: [
            {
              HostPort: String(config.port),
            },
          ],
        },
        RestartPolicy: {
          Name: "unless-stopped",
        },
        Binds: [`${POSTGRES_VOLUME_NAME}:/var/lib/postgresql`],
      },
    };

    const container = await this.docker.createContainer(createOptions);
    await container.start();
  }

  public async waitForReady(host: string, port: number, retries = 20): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt += 1) {
      try {
        await this.tryConnect(host, port);
        return;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error("Unknown connection error.");
      }

      await this.delay(500);
    }

    const reason = lastError instanceof Error ? lastError.message : "unknown error";
    throw new Error(
      `PostgreSQL did not become ready on ${host}:${port} after ${retries} attempts: ${reason}`,
    );
  }

  private async ensureImagePresent(image: string): Promise<void> {
    const imageHandle = this.docker.getImage(image);

    try {
      await imageHandle.inspect();
      return;
    } catch {
      const stream = await this.docker.pull(image);
      const dockerWithProgress = this.docker as DockerWithProgress;

      await new Promise<void>((resolve, reject) => {
        dockerWithProgress.modem.followProgress(stream, (error) => {
          if (error instanceof Error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  }

  private async ensureVolumeExists(name: string): Promise<void> {
    const volumes = await this.docker.listVolumes();
    const volumeExists = volumes.Volumes.some((volume) => volume.Name === name);

    if (!volumeExists) {
      await this.docker.createVolume({ Name: name });
    }
  }

  private async findContainersByName(name: string): Promise<ContainerInfo[]> {
    return this.docker.listContainers({
      all: true,
      filters: {
        name: [name],
      },
    });
  }

  private async findExactContainer(name: string): Promise<ContainerInfo | null> {
    const containers = await this.findContainersByName(name);
    return containers.find((container) => this.containerHasName(container, name)) ?? null;
  }

  private containerHasName(container: ContainerInfo, name: string): boolean {
    const expectedName = `/${name}`;
    return container.Names.some((containerName) => containerName === expectedName);
  }

  private async tryConnect(host: string, port: number): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const socket = new Socket();
      let settled = false;

      const finish = (callback: () => void): void => {
        if (settled) {
          return;
        }

        settled = true;
        socket.removeAllListeners();
        socket.destroy();
        callback();
      };

      socket.setTimeout(500);
      socket.once("connect", () => {
        finish(resolve);
      });
      socket.once("timeout", () => {
        finish(() => reject(new Error(`Timed out connecting to ${host}:${port}.`)));
      });
      socket.once("error", (error: Error) => {
        finish(() => reject(error));
      });
      socket.connect(port, host);
    });
  }

  private async delay(milliseconds: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}