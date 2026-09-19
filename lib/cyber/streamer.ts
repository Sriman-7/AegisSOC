import { TelemetryInput } from "./engine";

export interface SyntheticEventConfig {
  sourceType: "NETWORK" | "SYSTEM" | "AUTH" | "ALERT";
  action: string;
  hostname: string;
  sourceIp: string;
  username: string;
  isNoise?: boolean;
}

export const POISSON_BACKGROUND_EVENTS: SyntheticEventConfig[] = [
  { sourceType: "AUTH", action: "Kerberos TGT Ticket Renewal", hostname: "DC-CORP-PRIMARY", sourceIp: "10.0.0.5", username: "svc_backup" },
  { sourceType: "NETWORK", action: "HTTPS Ingress 443 -> Reverse Proxy", hostname: "GW-AUTH-EXTERNAL", sourceIp: "192.168.1.105", username: "system" },
  { sourceType: "SYSTEM", action: "Defender Antivirus Scheduled Signature Update", hostname: "WS-EXEC-01", sourceIp: "10.0.0.45", username: "SYSTEM" },
  { sourceType: "NETWORK", action: "DNS Query: api.internal.corp.local", hostname: "SRV-APPS-02", sourceIp: "10.0.1.12", username: "app_user" },
  { sourceType: "SYSTEM", action: "Log Rotation /var/log/secure.log", hostname: "DB-PAYMENTS-01", sourceIp: "10.0.3.15", username: "root" },
  { sourceType: "NETWORK", action: "VPC Flow Ingress TCP/8080", hostname: "AWS-PROD-VPC", sourceIp: "172.31.0.1", username: "cloud_admin" },
];

export function generateSyntheticTelemetryEvent(): TelemetryInput {
  const template = POISSON_BACKGROUND_EVENTS[Math.floor(Math.random() * POISSON_BACKGROUND_EVENTS.length)];
  return {
    entityId: template.hostname,
    sourceType: template.sourceType,
    sourceIp: template.sourceIp,
    destIp: "10.0.0.1",
    port: 443,
    protocol: "TCP",
    username: template.username,
    hostname: template.hostname,
    action: template.action,
    timestamp: new Date(),
    assetCriticality: "HIGH",
  };
}
