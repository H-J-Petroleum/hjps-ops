import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.resolve('.hubspot-token');

let cachedToken = null;

export function getToken() {
  if (cachedToken) return cachedToken;
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Token file .hubspot-token not found.');
  }
  const token = fs.readFileSync(TOKEN_PATH, 'utf8').trim();
  if (!token) {
    throw new Error('Token file is empty.');
  }
  cachedToken = token;
  return cachedToken;
}

export async function hubspotRequest(pathname, { method = 'GET', body, query } = {}) {
  const token = getToken();
  const url = new URL(`https://api.hubapi.com${pathname}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });
  }
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) {
    const snippet = text.slice(0, 500);
    throw new Error(`HubSpot request failed (${res.status} ${res.statusText}): ${snippet}`);
  }
  return text ? JSON.parse(text) : {};
}

export function readJson(filePath) {
  const abs = path.resolve(filePath);
  const content = fs.readFileSync(abs, 'utf8');
  return JSON.parse(content);
}

export function writeJson(targetDir, prefix, payload) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${prefix}-${timestamp}.json`;
  const absDir = path.resolve(targetDir);
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }
  const absFile = path.join(absDir, filename);
  fs.writeFileSync(absFile, JSON.stringify(payload, null, 2));
  return absFile;
}

export const logStep = message => console.log(`\n=== ${message} ===`);
