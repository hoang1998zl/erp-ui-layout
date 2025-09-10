
// src/integrations/webhooks/types.ts
export type UUID = string;

export type EventType = 
  | 'entity.created'
  | 'entity.updated'
  | 'entity.deleted'
  | 'status.changed'
  | 'approval.submitted'
  | 'approval.approved'
  | 'approval.rejected'
  | 'webhook.ping';

export type Entity =
  | 'Expense' | 'Requisition' | 'PurchaseOrder' | 'Invoice' | 'Payment'
  | 'Task' | 'Project' | 'Employee' | 'Customer' | 'Vendor';

export type HeaderKV = { key: string; value: string };

export type RetryPolicy = { maxAttempts: number; backoffSeconds: number };

export type WebhookSubscription = {
  id: UUID;
  name: string;
  active: boolean;
  targetUrl: string;
  secret?: string;                 // used for HMAC signature
  events: EventType[];
  entity: Entity;
  filters?: { field: string; op: '='|'!='|'contains'; value: string }[];
  headers?: HeaderKV[];
  contentType: 'application/json';
  version: '1.0';
  retry: RetryPolicy;
  createdAt: string;
  updatedAt: string;
};

export type Delivery = {
  id: UUID;
  subId: UUID;
  at: string;
  durationMs: number;
  status: number;
  attempts: number;
  event: EventType;
  payload: any;
  signature?: string; // preview of signature header value
};
