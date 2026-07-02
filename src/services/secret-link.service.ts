import { del, get, post } from 'src/api/axiosHelper';
import type {
  CreateSecretLinkResponse,
  PublicSecretLinkMeta,
  SecretLinkListItem,
  UnlockSecretLinkResponse,
} from 'src/types/secret-link.types';

const BASE = '/secret-links';

export const secretLinkService = {
  list(): Promise<{ items: SecretLinkListItem[] }> {
    return get(BASE);
  },
  create(body: {
    title?: string;
    content: string;
    password: string;
    expiresAt?: string | null;
  }): Promise<CreateSecretLinkResponse> {
    return post(`${BASE}/`, body);
  },
  remove(id: number): Promise<void> {
    return del(`${BASE}/${id}`);
  },
  getPublicMeta(slug: string): Promise<PublicSecretLinkMeta> {
    return get(`${BASE}/public/${encodeURIComponent(slug)}`);
  },
  unlock(slug: string, password: string): Promise<UnlockSecretLinkResponse> {
    return post(`${BASE}/public/${encodeURIComponent(slug)}/unlock`, { password });
  },
};
