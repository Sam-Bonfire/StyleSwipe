import { config } from '../config.js';

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

export interface ProxyProvider {
  getProxy(): Promise<ProxyConfig | undefined>;
}

export class EnvProxyProvider implements ProxyProvider {
  async getProxy(): Promise<ProxyConfig | undefined> {
    const { host, port, username, password } = config.proxy;

    if (!host || !port) {
      return undefined;
    }

    return {
      server: `http://${host}:${port}`,
      username,
      password,
    };
  }
}
