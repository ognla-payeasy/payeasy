const KNOWN_EVENT_TYPES = ["Contribution", "AgreementReleased"] as const;

export type ContractEventType = (typeof KNOWN_EVENT_TYPES)[number];

export interface ContributionEvent {
  id: string;
  cursor: string;
  contractId: string;
  txHash: string;
  ledger: number;
  timestamp: string;
  type: "Contribution";
  contributor: string;
  amount: string;
}

export interface AgreementReleasedEvent {
  id: string;
  cursor: string;
  contractId: string;
  txHash: string;
  ledger: number;
  timestamp: string;
  type: "AgreementReleased";
  amount: string;
  landlord?: string;
}

export type ParsedContractEvent = ContributionEvent | AgreementReleasedEvent;

export interface RpcEventFilter {
  type?: "contract";
  contractIds?: string[];
}

export interface RpcGetEventsRequest {
  startLedger?: number;
  pagination?: {
    cursor?: string;
    limit?: number;
  };
  filters?: RpcEventFilter[];
}

export interface RpcEvent {
  id?: string;
  pagingToken?: string;
  contractId?: string;
  topic?: unknown[];
  value?: unknown;
  txHash?: string;
  ledger?: number;
  ledgerClosedAt?: string;
}

export interface RpcGetEventsResponse {
  events?: RpcEvent[];
  latestLedger?: number;
}

export interface SorobanRpcServer {
  getEvents(request: RpcGetEventsRequest): Promise<RpcGetEventsResponse>;
}

export interface FetchContractEventsOptions {
  server: SorobanRpcServer;
  contractId?: string;
  eventTypes?: ContractEventType[];
  cursor?: string;
  startLedger?: number;
  limit?: number;
}

export interface FetchContractEventsResult {
  events: ParsedContractEvent[];
  latestLedger?: number;
  nextCursor?: string;
}

export interface ContractEventPoller {
  poll(): Promise<FetchContractEventsResult>;
  getCursor(): string | undefined;
}

export async function fetchContractEvents(
  options: FetchContractEventsOptions
): Promise<FetchContractEventsResult> {
  const request: RpcGetEventsRequest = {
    startLedger: options.startLedger,
    pagination: {
      cursor: options.cursor,
      limit: options.limit ?? 100,
    },
    filters: options.contractId
      ? [{ type: "contract", contractIds: [options.contractId] }]
      : undefined,
  };

  const response = await options.server.getEvents(request);
  const allowedTypes = options.eventTypes ? new Set(options.eventTypes) : undefined;

  const parsedEvents = (response.events ?? [])
    .map(parseContractEvent)
    .filter((event): event is ParsedContractEvent => event !== null)
    .filter((event) => !options.contractId || event.contractId === options.contractId)
    .filter((event) => !allowedTypes || allowedTypes.has(event.type));

  const lastRawEvent = (response.events ?? [])[(response.events?.length ?? 0) - 1];

  return {
    events: parsedEvents,
    latestLedger: response.latestLedger,
    nextCursor: lastRawEvent?.pagingToken ?? options.cursor,
  };
}

export function createContractEventPoller(
  options: FetchContractEventsOptions
): ContractEventPoller {
  let cursor = options.cursor;

  return {
    async poll(): Promise<FetchContractEventsResult> {
      const result = await fetchContractEvents({ ...options, cursor });
      cursor = result.nextCursor;
      return result;
    },
    getCursor(): string | undefined {
      return cursor;
    },
  };
}

export function parseContractEvent(rawEvent: RpcEvent): ParsedContractEvent | null {
  const eventType = parseEventType(rawEvent.topic?.[0]);
  if (!eventType) return null;

  const eventBase = {
    id: rawEvent.id ?? "",
    cursor: rawEvent.pagingToken ?? "",
    contractId: rawEvent.contractId ?? "",
    txHash: rawEvent.txHash ?? "",
    ledger: rawEvent.ledger ?? 0,
    timestamp: parseTimestamp(rawEvent.ledgerClosedAt),
  };

  if (!eventBase.contractId) return null;

  if (eventType === "Contribution") {
    const payload = normalizeScVal(rawEvent.value);
    const contributor =
      getRecordString(payload, ["roommate", "contributor", "from", "account", "user"]) ??
      topicAddress(rawEvent.topic, 1);
    const amount =
      getRecordString(payload, ["amount", "share", "value", "funded"]) ??
      scalarToString(payload);

    if (!contributor || !amount) return null;

    return { ...eventBase, type: "Contribution", contributor, amount };
  }

  const payload = normalizeScVal(rawEvent.value);
  const amount =
    getRecordString(payload, ["amount", "total", "released", "funded", "value"]) ??
    scalarToString(payload);

  if (!amount) return null;

  const landlord =
    getRecordString(payload, ["landlord", "recipient", "to", "owner"]) ??
    topicAddress(rawEvent.topic, 1);

  return {
    ...eventBase,
    type: "AgreementReleased",
    amount,
    ...(landlord ? { landlord } : {}),
  };
}

function parseTimestamp(value?: string): string {
  if (!value) return new Date(0).toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function parseEventType(value: unknown): ContractEventType | null {
  const normalized = normalizeScVal(value);
  return typeof normalized === "string" ? toKnownEventType(normalized) : null;
}

function toKnownEventType(value: string): ContractEventType | null {
  if (KNOWN_EVENT_TYPES.includes(value as ContractEventType)) return value as ContractEventType;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8").replace(/\0/g, "").trim();
    if (KNOWN_EVENT_TYPES.includes(decoded as ContractEventType)) return decoded as ContractEventType;
  } catch {
    return null;
  }
  return null;
}

function topicAddress(topic: unknown[] | undefined, index: number): string | undefined {
  if (!topic || topic.length <= index) return undefined;
  const parsed = normalizeScVal(topic[index]);
  return typeof parsed === "string" ? parsed : undefined;
}

function scalarToString(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return undefined;
}

function getRecordString(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const scalar = scalarToString(record[key]);
    if (scalar) return scalar;
  }
  return undefined;
}

function normalizeScVal(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (
    typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean" || typeof value === "bigint"
  ) return value;

  if (Array.isArray(value)) return value.map(normalizeScVal);

  const o = value as Record<string, unknown>;

  if (typeof o.symbol === "string") return o.symbol;
  if (typeof o.sym === "string") return o.sym;
  if (typeof o.string === "string") return o.string;
  if (typeof o.str === "string") return o.str;
  if (typeof o.address === "string") return o.address;
  if (typeof o.accountId === "string") return o.accountId;

  for (const k of ["i32", "u32", "i64", "u64", "i128", "u128", "i256", "u256"]) {
    const v = o[k];
    if (typeof v === "string" || typeof v === "number" || typeof v === "bigint") return String(v);
  }

  if (Array.isArray(o.vec)) return o.vec.map(normalizeScVal);

  if (Array.isArray(o.map)) {
    const result: Record<string, unknown> = {};
    for (const entry of o.map) {
      if (!entry || typeof entry !== "object") continue;
      const pair = entry as Record<string, unknown>;
      const k = normalizeScVal(pair.key);
      const v = normalizeScVal(pair.val ?? pair.value ?? pair.entry ?? pair.data);
      if (typeof k === "string") result[k] = v;
    }
    return result;
  }

  if (o.value !== undefined) return normalizeScVal(o.value);
  return o;
}
