import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '~/lib/source';

// Built once into out/api/search; the browser searches it locally (no server needed).
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source);
