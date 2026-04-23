export type SecretLinkListItem = {
  id: number;
  slug: string;
  title: string | null;
  createdBy: number | null;
  createdAt: string;
  expiresAt: string | null;
};

export type CreateSecretLinkResponse = {
  id: number;
  slug: string;
  title: string | null;
  path: string;
};

export type PublicSecretLinkMeta = {
  title: string | null;
  expiresAt: string | null;
};

export type UnlockSecretLinkResponse = {
  content: string;
};
