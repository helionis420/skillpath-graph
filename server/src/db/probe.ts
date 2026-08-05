import net from "net";
import tls from "tls";
import dns from "dns";
import { URL } from "url";

export interface ProbeResult {
  host: string;
  port: number;
  scheme: string;
  dns: { ok: boolean; addresses?: string[]; error?: string; ms: number };
  tcp: { ok: boolean; error?: string; ms: number };
  tls: { ok: boolean; error?: string; ms: number } | null;
}

function parseBoltUri(uri: string): { host: string; port: number; scheme: string } {
  // neo4j-driver accepts bolt+s://host[:port]; URL() needs a known scheme shape
  const match = /^([a-z+]+):\/\/([^/:?#]+)(?::(\d+))?/i.exec(uri);
  if (match) {
    return { scheme: match[1], host: match[2], port: match[3] ? Number(match[3]) : 7687 };
  }
  const parsed = new URL(uri);
  return {
    scheme: parsed.protocol.replace(":", ""),
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 7687,
  };
}

function timed<T>(fn: () => Promise<T>): Promise<{ value?: T; error?: string; ms: number }> {
  const start = Date.now();
  return fn()
    .then((value) => ({ value, ms: Date.now() - start }))
    .catch((err: unknown) => ({
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - start,
    }));
}

function connectTcp(host: string, port: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port, family: 4 });
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      socket.destroy();
      resolve();
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error(`TCP connect timed out after ${timeoutMs}ms`));
    });
    socket.once("error", (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

function connectTls(host: string, port: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, timeout: timeoutMs });
    socket.once("secureConnect", () => {
      socket.destroy();
      resolve();
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error(`TLS handshake timed out after ${timeoutMs}ms`));
    });
    socket.once("error", (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

/**
 * Distinguishes DNS / TCP / TLS failures from Bolt-level auth errors.
 * Used by /api/diagnostics to explain why a deployment cannot reach CognoDB.
 */
export async function probeDatabase(uri: string, timeoutMs = 4_000): Promise<ProbeResult> {
  const { host, port, scheme } = parseBoltUri(uri);

  // lookup() uses the OS resolver (same path the driver takes); resolve4()
  // queries configured nameservers directly and can fail in sandboxes.
  const dnsResult = await timed(async () => {
    const records = await dns.promises.lookup(host, { all: true });
    return records.map((r) => `${r.address} (IPv${r.family})`);
  });
  const tcpResult = await timed(() => connectTcp(host, port, timeoutMs));

  const needsTls = scheme.includes("+s");
  const tlsResult =
    needsTls && !tcpResult.error ? await timed(() => connectTls(host, port, timeoutMs)) : null;

  return {
    host,
    port,
    scheme,
    dns: {
      ok: !dnsResult.error,
      addresses: dnsResult.value as string[] | undefined,
      error: dnsResult.error,
      ms: dnsResult.ms,
    },
    tcp: { ok: !tcpResult.error, error: tcpResult.error, ms: tcpResult.ms },
    tls: tlsResult
      ? { ok: !tlsResult.error, error: tlsResult.error, ms: tlsResult.ms }
      : null,
  };
}
