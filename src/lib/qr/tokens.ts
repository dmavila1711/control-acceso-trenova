import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { getServerEnv } from "@/lib/env";

const QR_PREFIX = "access:";

function hmac(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function encryptionKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function encrypt(value: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decrypt(value: string, secret: string) {
  const [iv, tag, encrypted] = value.split(".");
  if (!iv || !tag || !encrypted) {
    return null;
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

export function generateQrToken() {
  return randomBytes(32).toString("base64url");
}

export function toQrPayload(token: string) {
  return `${QR_PREFIX}${token}`;
}

export function parseQrPayload(payload: string) {
  if (!payload.startsWith(QR_PREFIX)) {
    return null;
  }

  const token = payload.slice(QR_PREFIX.length);
  return token.length >= 24 ? token : null;
}

export function generateNumericCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashQrToken(token: string) {
  return hmac(token, getServerEnv().qrSecret);
}

export function hashNumericCode(code: string) {
  return hmac(code, getServerEnv().numericCodeSecret);
}

export function encryptQrToken(token: string) {
  return encrypt(token, getServerEnv().qrSecret);
}

export function decryptQrToken(ciphertext: string | null) {
  return ciphertext ? decrypt(ciphertext, getServerEnv().qrSecret) : null;
}

export function encryptNumericCode(code: string) {
  return encrypt(code, getServerEnv().numericCodeSecret);
}

export function decryptNumericCode(ciphertext: string | null) {
  return ciphertext ? decrypt(ciphertext, getServerEnv().numericCodeSecret) : null;
}

export function last4(value: string) {
  return value.slice(-4);
}
