const NAMESTONE_API_BASE = "https://namestone.com/api/public_v1";

interface NameStoneConfig {
  apiKey: string;
  domain: string;
}

export interface NameStoneTextRecords {
  avatar?: string;
  display?: string;
  description?: string;
}

export interface NameStoneProfile {
  name: string;
  address: string;
  domain: string;
  text_records?: NameStoneTextRecords;
}

function getConfig(): NameStoneConfig {
  const apiKey = process.env.NAMESTONE_API_KEY;
  const domain = process.env.NAMESTONE_DOMAIN;

  if (!apiKey) {
    throw new Error("NAMESTONE_API_KEY is not set");
  }
  if (!domain) {
    throw new Error("NAMESTONE_DOMAIN is not set");
  }

  return { apiKey, domain };
}

export async function setName(params: {
  name: string;
  address: string;
  textRecords?: NameStoneTextRecords;
}): Promise<void> {
  const { apiKey, domain } = getConfig();

  const res = await fetch(`${NAMESTONE_API_BASE}/set-name`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      name: params.name,
      domain,
      address: params.address,
      text_records: params.textRecords ?? {},
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NameStone set-name failed: ${res.status} ${text}`);
  }
}

export async function getNamesByAddress(
  address: string,
): Promise<NameStoneProfile[]> {
  const { apiKey, domain } = getConfig();

  const params = new URLSearchParams({
    domain,
    address,
    text_records: "1",
  });

  const res = await fetch(`${NAMESTONE_API_BASE}/get-names?${params}`, {
    headers: { Authorization: apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NameStone get-names failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function searchNames(
  name: string,
  exactMatch = false,
): Promise<NameStoneProfile[]> {
  const { apiKey, domain } = getConfig();

  const params = new URLSearchParams({
    domain,
    name,
    text_records: "1",
    ...(exactMatch && { exact_match: "1" }),
  });

  const res = await fetch(`${NAMESTONE_API_BASE}/search-names?${params}`, {
    headers: { Authorization: apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NameStone search-names failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function deleteName(name: string): Promise<void> {
  const { apiKey, domain } = getConfig();

  const res = await fetch(`${NAMESTONE_API_BASE}/delete-name`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ name, domain }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NameStone delete-name failed: ${res.status} ${text}`);
  }
}
