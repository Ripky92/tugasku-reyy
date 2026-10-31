import { fetchTasks, publicUrl, isImage, formatSize, formatDate, el, fileKind } from './common.js';

const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const chipsEl = document.getElementById('chips');
const qEl = document.getElementById('q');
const lb = document.getElementById('lightbox');
document.getElementById('yr').textContent = new Date().getFullYear();

let tasks = [];
let category = 'Semua';

function downloadLink(file, label = 'Unduh') {
  return el('a', {
    class: 'btn',
    href: publicUrl(file.path, file.name),
    download: file.name,
    'aria-label': `${label} ${file.name}`,
    text: label,
  });
}

function openLightbox(file) {
  document.getElementById('lbImg').src = publicUrl(file.path);
  document.getElementById('lbImg').alt = file.name;
  document.getElementById('lbName').textContent = file.name;
  document.getElementById('lbDl').href = publicUrl(file.path, file.name);
  lb.showModal();
}
document.getElementById('lbClose').addEventListener('click', () => lb.close());
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

async function downloadZip(task, btn) {
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Menyiapkan…';
  try {
    const { default: JSZip } = await import('https://esm.sh/jszip@3');
    const zip = new JSZip();
    const used = new Set();
    for (const f of task.task_files) {
      const res = await fetch(publicUrl(f.path));
      if (!res.ok) throw new Error(f.name);
      let name = f.name;
      for (let i = 2; used.has(name); i++) name = `${i}-${f.name}`;
      used.add(name);
      zip.file(name, await res.blob());
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `${task.title}.zip` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch {
    alert('Gagal membuat ZIP. Coba unduh file satu per satu.');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

function card(task) {
  const files = task.task_files;
  const images = files.filter(isImage);
  const docs = files.filter((f) => !isImage(f));

  const media = images.length
    ? el('button', {
        class: 'thumb', type: 'button',
        'aria-label': `Lihat foto ${images[0].name}`,
        onclick: () => openLightbox(images[0]),
      },
      el('img', { src: publicUrl(images[0].path), alt: '', loading: 'lazy' }),
      images.length > 1 ? el('span', { class: 'count', text: `+${images.length - 1} foto` }) : null)
    : el('div', { class: 'thumb ph', 'aria-hidden': 'true', text: docs[0] ? fileKind(docs[0]) : '—' });

  const fileRows = files.map((f) => el('li', { class: 'file' },
    el('span', { class: 'kind', text: fileKind(f) }),
    el('span', { class: 'fname' }, el('b', { text: f.name }), el('small', { text: formatSize(f.size) })),
    isImage(f) ? el('button', { class: 'btn ghost', type: 'button', onclick: () => openLightbox(f), text: 'Lihat' }) : null,
    downloadLink(f)));

  const zipBtn = files.length > 1
    ? el('button', { class: 'btn primary', type: 'button', text: `Unduh semua (${files.length})` })
    : null;
  if (zipBtn) zipBtn.addEventListener('click', () => downloadZip(task, zipBtn));

  return el('article', { class: 'card' },
    media,
    el('div', { class: 'body' },
      el('div', { class: 'meta' },
        el('span', { class: 'badge', text: task.category }),
        el('time', { datetime: task.task_date, text: formatDate(task.task_date) })),
      el('h2', { text: task.title }),
      task.description ? el('p', { text: task.description }) : null,
      el('ul', { class: 'files' }, ...fileRows),
      zipBtn));
}

function renderStats() {
  document.getElementById('sTasks').textContent = tasks.length;
  document.getElementById('sFiles').textContent = tasks.reduce((n, t) => n + t.task_files.length, 0);
  document.getElementById('sCats').textContent = new Set(tasks.map((t) => t.category)).size;
}

function render() {
  const q = qEl.value.trim().toLowerCase();
  const list = tasks.filter((t) =>
    (category === 'Semua' || t.category === category) &&
    (!q || `${t.title} ${t.description}`.toLowerCase().includes(q)));
  grid.replaceChildren(...list.map(card));
  statusEl.textContent = list.length ? '' : (tasks.length ? 'Tidak ada tugas yang cocok.' : 'Belum ada tugas.');
}

function renderChips() {
  const cats = ['Semua', ...new Set(tasks.map((t) => t.category))];
  chipsEl.replaceChildren(...cats.map((c) => el('button', {
    type: 'button', class: 'chip', 'aria-pressed': String(c === category), text: c,
    onclick: () => { category = c; renderChips(); render(); },
  })));
}

qEl.addEventListener('input', render);

try {
  tasks = await fetchTasks();
  renderStats();
  renderChips();
  render();
} catch {
  statusEl.textContent = 'Gagal memuat data. Periksa konfigurasi Supabase di js/config.js.';
}
