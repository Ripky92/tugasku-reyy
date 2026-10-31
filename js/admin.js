import { sb, fetchTasks, el, formatSize, formatDate } from './common.js';
import { BUCKET, MAX_FILE_MB } from './config.js';

const $ = (id) => document.getElementById(id);
const loginView = $('loginView'), adminView = $('adminView');
const form = $('taskForm');
let tasks = [];

function show(session) {
  loginView.hidden = !!session;
  adminView.hidden = !session;
  $('logout').hidden = !session;
  if (session) { resetForm(); refresh(); }
}

sb.auth.onAuthStateChange((_e, session) => show(session));
show((await sb.auth.getSession()).data.session);

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  $('loginMsg').textContent = 'Masuk…';
  const { error } = await sb.auth.signInWithPassword({ email: d.get('email').trim(), password: d.get('password') });
  const hints = {
    invalid_credentials: 'Email atau kata sandi salah.',
    email_not_confirmed: 'Email belum dikonfirmasi. Di Supabase > Authentication > Users, konfirmasi user ini atau buat ulang dengan Auto Confirm.',
  };
  $('loginMsg').textContent = error ? (hints[error.code] || `Gagal masuk: ${error.message}`) : '';
});
$('logout').addEventListener('click', () => sb.auth.signOut());

function resetForm() {
  form.reset();
  form.id.value = '';
  form.task_date.value = new Date().toISOString().slice(0, 10);
  $('formTitle').textContent = 'Tambah tugas';
  $('cancelEdit').hidden = true;
}
$('cancelEdit').addEventListener('click', resetForm);

const safeName = (n) => n.normalize('NFKD').replace(/[^\w.\-]+/g, '_');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('formMsg'), btn = $('saveBtn');
  const files = [...form.files.files];
  const big = files.find((f) => f.size > MAX_FILE_MB * 1048576);
  if (big) { msg.textContent = `${big.name} melebihi ${MAX_FILE_MB} MB.`; return; }

  btn.disabled = true;
  msg.textContent = 'Menyimpan…';
  try {
    const row = {
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      category: form.category.value.trim() || 'Umum',
      task_date: form.task_date.value,
    };
    let id = form.id.value;
    if (id) {
      const { error } = await sb.from('tasks').update(row).eq('id', id);
      if (error) throw error;
    } else {
      const { data, error } = await sb.from('tasks').insert(row).select('id').single();
      if (error) throw error;
      id = data.id;
    }
    for (const [i, f] of files.entries()) {
      msg.textContent = `Mengunggah ${i + 1}/${files.length}: ${f.name}`;
      const path = `${id}/${crypto.randomUUID()}-${safeName(f.name)}`;
      const up = await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type || undefined });
      if (up.error) throw up.error;
      const { error } = await sb.from('task_files').insert({
        task_id: id, path, name: f.name, mime: f.type, size: f.size,
      });
      if (error) throw error;
    }
    msg.textContent = 'Tersimpan.';
    resetForm();
    await refresh();
  } catch (err) {
    msg.textContent = `Gagal: ${err.message}`;
  } finally {
    btn.disabled = false;
  }
});

async function refresh() {
  tasks = await fetchTasks();
  $('cats').replaceChildren(...[...new Set(tasks.map((t) => t.category))].map((c) => el('option', { value: c })));
  $('adminList').replaceChildren(...tasks.map(row));
}

function row(t) {
  const files = t.task_files.map((f) => el('li', {},
    `${f.name} (${formatSize(f.size)}) `,
    el('button', { class: 'link', type: 'button', text: 'hapus file', onclick: () => delFile(f) })));
  return el('li', { class: 'admin-item' },
    el('div', {},
      el('b', { text: t.title }),
      el('small', { text: ` ${t.category} · ${formatDate(t.task_date)}` }),
      el('ul', { class: 'mini' }, ...files)),
    el('div', { class: 'row' },
      el('button', { class: 'btn', type: 'button', text: 'Edit', onclick: () => edit(t) }),
      el('button', { class: 'btn danger', type: 'button', text: 'Hapus', onclick: () => delTask(t) })));
}

function edit(t) {
  form.id.value = t.id;
  form.title.value = t.title;
  form.description.value = t.description;
  form.category.value = t.category;
  form.task_date.value = t.task_date;
  $('formTitle').textContent = 'Edit tugas (pilih file untuk menambah)';
  $('cancelEdit').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function delFile(f) {
  if (!confirm(`Hapus ${f.name}?`)) return;
  await sb.storage.from(BUCKET).remove([f.path]);
  await sb.from('task_files').delete().eq('id', f.id);
  refresh();
}

async function delTask(t) {
  if (!confirm(`Hapus tugas "${t.title}" beserta semua filenya?`)) return;
  if (t.task_files.length) await sb.storage.from(BUCKET).remove(t.task_files.map((f) => f.path));
  await sb.from('tasks').delete().eq('id', t.id);
  refresh();
}
