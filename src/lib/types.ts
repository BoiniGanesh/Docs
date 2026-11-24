import type { Role, ShareRole } from "./access";

/** Shapes shared between the server (API responses) and the browser UI. */

export interface DocumentSummary {
  id: string;
  title: string;
  updatedAt: string;
  ownerName: string;
  ownerEmail: string;
  role: Role;
  /** Number of people (besides the owner) with access. */
  shareCount: number;
}

export interface DocumentDetail extends DocumentSummary {
  contentHtml: string;
  createdAt: string;
}

export interface ShareEntry {
  userId: string;
  email: string;
  name: string;
  role: ShareRole;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}
