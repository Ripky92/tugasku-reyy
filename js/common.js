import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isImage = (f) => (f.mime || '').startsWith('image/');

export function publicUrl(path, downloadName) {
  const opts = downloadName ? { download: downloadName } : undefined;
  return sb.storage.from(BUCKET).getPublicUrl(path, opts).data.publicUrl;
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  node.append(...children.filter(Boolean));
  return node;
}

export async function fetchTasks() {
  const { data, error } = await sb
    .from('tasks')
    .select('*, task_files(*)')
    .order('task_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export function fileKind(f) {
  const ext = (f.name.split('.').pop() || '').toUpperCase();
  return ext.length <= 4 ? ext : 'FILE';
}
