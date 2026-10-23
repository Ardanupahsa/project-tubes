const API = 'api.php', $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp = n => 'Rp ' + Number(n).toLocaleString('id-ID');
const sum = (a, f) => a.reduce((s, x) => s + Number(f(x)), 0);
let DEMO = false, D = {}, R = [];

/* ---------- Konfigurasi tabel (kolom tampil + field form) ---------- */
const HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'], hm = s => String(s).slice(0, 5);
const byId = (t, id) => (D[t] || []).find(r => r[TBL[t].pk] == id) || {};
const TBL = {
  dokter: { label:'Dokter', pk:'id_dokter', lab:r=>r.nama_dokter,
    cols:[['nama_dokter','Dokter'],['id_spesialis','Spesialis'],['no_telp','No. Telp'],['status','Status']],
    form:[['nama_dokter','Nama Dokter','text'],['id_spesialis','Spesialis',{fk:'spesialis'}],['no_telp','No. Telp','text'],['status','Status',['Aktif','Cuti']]] },
  jadwal: { label:'Jadwal', pk:'id_jadwal', lab:r=>byId('dokter',r.id_dokter).nama_dokter+' · '+r.hari+' '+hm(r.jam_mulai),
    cols:[['id_dokter','Dokter'],['hari','Hari'],['jam_mulai','Mulai','tm'],['jam_selesai','Selesai','tm'],['id_ruangan','Ruangan'],['kuota','Kuota']],
    form:[['id_dokter','Dokter',{fk:'dokter'}],['hari','Hari',HARI],['jam_mulai','Jam Mulai','time'],['jam_selesai','Jam Selesai','time'],['id_ruangan','Ruangan',{fk:'ruangan'}],['kuota','Kuota Pasien','number']] },
  booking: { label:'Booking', pk:'id_booking',
    cols:[['tgl_booking','Tanggal'],['id_pasien','Pasien'],['id_jadwal','Jadwal'],['status','Status'],['keluhan','Keluhan']],
    form:[['id_jadwal','Jadwal',{fk:'jadwal'}],['id_pasien','Pasien',{fk:'pasien'}],['tgl_booking','Tanggal Booking','date'],['status','Status',['Menunggu','Dikonfirmasi','Selesai','Batal']],['keluhan','Keluhan','textarea']] },
  pasien: { label:'Pasien', pk:'id_pasien', lab:r=>r.nama,
    cols:[['nama','Nama'],['jenis_kelamin','JK'],['no_telp','No. Telp']],
    form:[['nama','Nama','text'],['jenis_kelamin','Jenis Kelamin',['Laki-laki','Perempuan']],['no_telp','No. Telp','text']] },
  spesialis: { label:'Spesialis', pk:'id_spesialis', lab:r=>r.nama_spesialis,
    cols:[['nama_spesialis','Nama Spesialis']], form:[['nama_spesialis','Nama Spesialis','text']] },
  ruangan: { label:'Ruangan', pk:'id_ruangan', lab:r=>r.nama_ruangan,
    cols:[['nama_ruangan','Nama Ruangan'],['lantai','Lantai']], form:[['nama_ruangan','Nama Ruangan','text'],['lantai','Lantai','number']] },
};

/* ---------- Data contoh (dipakai jika api.php / MySQL tidak tersedia) ---------- */
const mk = (k, rows) => rows.map(r => Object.fromEntries(k.map((x, i) => [x, r[i]])));
const M = {
  spesialis: mk(['id_spesialis','nama_spesialis'], [[1,'Dokter Umum'],[2,'Spesialis Anak'],[3,'Spesialis Penyakit Dalam'],[4,'Dokter Gigi'],[5,'Spesialis Kulit']]),
  ruangan: mk(['id_ruangan','nama_ruangan','lantai'], [[1,'Ruang Poli Umum',1],[2,'Ruang Poli Anak',1],[3,'Ruang Penyakit Dalam',2],[4,'Ruang Poli Gigi',2],[5,'Ruang Poli Kulit',3]]),
  dokter: mk(['id_dokter','nama_dokter','id_spesialis','no_telp','status'], [
    [1,'dr. Andi Pratama',1,'081211110001','Aktif'],[2,'dr. Siti Rahmawati',2,'081211110002','Aktif'],[3,'dr. Maya Lestari',3,'081211110003','Aktif'],
    [4,'drg. Budi Santoso',4,'081211110004','Aktif'],[5,'dr. Rudi Hartono',1,'081211110005','Cuti'],[6,'dr. Rina Kusuma',5,'081211110006','Aktif']]),
  pasien: mk(['id_pasien','nama','jenis_kelamin','no_telp'], [
    [1,'Ahmad Fauzi','Laki-laki','082100000001'],[2,'Dewi Anggraini','Perempuan','082100000002'],[3,'Rizky Ramadhan','Laki-laki','082100000003'],
    [4,'Putri Maharani','Perempuan','082100000004'],[5,'Hendra Wijaya','Laki-laki','082100000005'],[6,'Lina Marlina','Perempuan','082100000006']]),
  jadwal: mk(['id_jadwal','id_dokter','id_ruangan','hari','jam_mulai','jam_selesai','kuota'], [
    [1,1,1,'Senin','08:00','12:00',20],[2,1,1,'Rabu','08:00','12:00',20],[3,2,2,'Senin','09:00','13:00',15],[4,2,2,'Kamis','09:00','13:00',15],
    [5,3,3,'Selasa','10:00','14:00',12],[6,3,3,'Kamis','13:00','17:00',12],[7,4,4,'Rabu','13:00','17:00',10],[8,4,4,'Jumat','08:00','12:00',10],
    [9,5,1,'Selasa','13:00','17:00',20],[10,6,5,'Jumat','13:00','16:00',8],[11,6,5,'Sabtu','09:00','12:00',8],[12,1,1,'Kamis','13:00','17:00',20]]),
  booking: mk(['id_booking','id_jadwal','id_pasien','tgl_booking','status','keluhan'], [
    [1,1,1,'2026-10-19','Selesai','Demam'],[2,3,3,'2026-10-19','Selesai','Batuk pilek'],[3,5,5,'2026-10-20','Selesai','Tekanan darah tinggi'],
    [4,2,2,'2026-10-21','Selesai','Sakit kepala'],[5,7,6,'2026-10-21','Batal','Sakit gigi'],[6,4,4,'2026-10-22','Dikonfirmasi','Kontrol anak'],
    [7,6,5,'2026-10-22','Dikonfirmasi','Kontrol hipertensi'],[8,12,1,'2026-10-22','Menunggu','Pegal-pegal'],
    [9,8,6,'2026-10-23','Menunggu','Sakit gigi'],[10,10,2,'2026-10-23','Dikonfirmasi','Gatal pada kulit']]),
};
const DEP = { spesialis:['dokter','id_spesialis'], ruangan:['jadwal','id_ruangan'], dokter:['jadwal','id_dokter'], pasien:['booking','id_pasien'], jadwal:['booking','id_jadwal'] };

function reports() {
  const f = (t, id) => M[t].find(r => r[TBL[t].pk] == id) || {}, J = M.jadwal, B = M.booking, st = {};
  B.forEach(b => st[b.status] = (st[b.status] || 0) + 1);
  return [
    { title:'Jadwal Praktik Lengkap (JOIN 4 tabel)', rows: [...J].sort((a, b) => HARI.indexOf(a.hari) - HARI.indexOf(b.hari) || a.jam_mulai.localeCompare(b.jam_mulai))
        .map(j => { const d = f('dokter', j.id_dokter); return { Hari:j.hari, Jam:hm(j.jam_mulai)+' - '+hm(j.jam_selesai), Dokter:d.nama_dokter,
          Spesialis:f('spesialis', d.id_spesialis).nama_spesialis, Ruangan:f('ruangan', j.id_ruangan).nama_ruangan }; }) },
    { title:'Jumlah Jadwal per Hari (COUNT + GROUP BY)', rows: HARI.map(h => ({ Hari:h, 'Jumlah Jadwal':J.filter(j => j.hari == h).length })) },
    { title:'Jumlah Dokter per Spesialis (COUNT + GROUP BY)', rows: M.spesialis.map(s => ({ Spesialis:s.nama_spesialis, 'Jumlah Dokter':M.dokter.filter(d => d.id_spesialis == s.id_spesialis).length })) },
    { title:'Total Jadwal dan Kuota per Dokter (COUNT + SUM)', rows: M.dokter.map(d => { const js = J.filter(j => j.id_dokter == d.id_dokter);
        return { Dokter:d.nama_dokter, 'Jumlah Jadwal':js.length, 'Total Kuota':sum(js, j => j.kuota) }; }).filter(r => r['Jumlah Jadwal']) },
    { title:'Jumlah Booking per Dokter (JOIN + COUNT)', rows: M.dokter.map(d => ({ Dokter:d.nama_dokter,
        'Jumlah Booking':B.filter(b => f('jadwal', b.id_jadwal).id_dokter == d.id_dokter).length })).filter(r => r['Jumlah Booking']) },
    { title:'Jumlah Booking per Status (COUNT + GROUP BY)', rows: Object.entries(st).map(([s, n]) => ({ Status:s, 'Jumlah Booking':n })) },
  ];
}

function mock(m, t, id, b) {
  if (t === 'laporan') return reports();
  const a = M[t], pk = TBL[t].pk;
  if (m === 'GET') return a;
  if (m === 'DELETE') {
    const d = DEP[t];
    if (d && M[d[0]].some(r => r[d[1]] == id)) throw new Error('Gagal: data masih dipakai tabel lain');
    M[t] = a.filter(r => r[pk] != id); return { ok: 1 };
  }
  if (m === 'POST') { b[pk] = Math.max(0, ...a.map(r => r[pk])) + 1; a.push(b); return { ok: 1 }; }
  Object.assign(a.find(r => r[pk] == id), b); return { ok: 1 };
}

async function api(m, t, id, body) {
  if (!DEMO) {
    try {
      const u = `${API}?${t === 'laporan' ? 'laporan=1' : 't=' + t}${id ? '&id=' + id : ''}`;
      const r = await fetch(u, { method:m, headers:{'Content-Type':'application/json'}, body: body ? JSON.stringify(body) : undefined });
      if (!(r.headers.get('content-type') || '').includes('json')) throw 0;
      const j = await r.json();
      if (!r.ok) throw { api: j.error };
      return j;
    } catch (e) { if (e && e.api) throw new Error(e.api); DEMO = true; }
  }
  return mock(m, t, id, body);
}

async function load() {
  for (const t of Object.keys(TBL)) D[t] = await api('GET', t);
  R = await api('GET', 'laporan');
  $('#mode').textContent = DEMO ? 'Mode Demo (data contoh)' : 'Terhubung ke MySQL';
  $('#mode').className = 'badge ' + (DEMO ? 'demo' : 'live');
}

const tbl = (h, rows) => `<div class="scroll"><table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${
  rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('') || '<tr><td>Belum ada data</td></tr>'}</tbody></table></div>`;

const cell = (t, r, [k, , fmt]) => {
  const f = TBL[t].form.find(x => x[0] == k);
  if (f && f[2].fk) return TBL[f[2].fk].lab(byId(f[2].fk, r[k]));
  return fmt === 'rp' ? rp(r[k]) : fmt === 'tm' ? hm(r[k]) : r[k];
};

const nm = d => esc(d.nama_dokter) + (d.status == 'Cuti' ? ' <small class="mut">(Cuti)</small>' : '');
const spes = d => esc(byId('spesialis', d.id_spesialis).nama_spesialis);

const dash = () => {
  const p = R[1].rows, mx = Math.max(1, ...p.map(x => x['Jumlah Jadwal']));
  const hr = ['Minggu', ...HARI][new Date().getDay()];
  const td = D.jadwal.filter(j => j.hari == hr).sort((a, b) => hm(a.jam_mulai).localeCompare(hm(b.jam_mulai)));
  const S = [['Dokter Aktif', D.dokter.filter(d => d.status == 'Aktif').length], ['Dokter Cuti', D.dokter.filter(d => d.status == 'Cuti').length],
             ['Jadwal Praktik', D.jadwal.length], ['Pasien', D.pasien.length], ['Booking', D.booking.length]];
  return `<div class="stats">${S.map(([l, v]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="card"><h3>Jadwal Praktik Hari Ini (${hr})</h3>${tbl(['Jam','Dokter','Spesialis','Ruangan','Kuota'],
      td.map(j => { const d = byId('dokter', j.id_dokter); return [hm(j.jam_mulai) + ' - ' + hm(j.jam_selesai), nm(d), spes(d), esc(byId('ruangan', j.id_ruangan).nama_ruangan), j.kuota]; }))}</div>
    <div class="card"><h3>Jumlah Jadwal per Hari</h3>${p.map(x => `<div class="bar"><span>${esc(x.Hari)}</span><i style="width:${x['Jumlah Jadwal'] / mx * 60}%"></i><b>${x['Jumlah Jadwal']}</b></div>`).join('')}</div>`;
};

const week = () => `<div class="week">${HARI.map(h => `<div class="day"><h4>${h}</h4>${
  D.jadwal.filter(j => j.hari == h).sort((a, b) => hm(a.jam_mulai).localeCompare(hm(b.jam_mulai))).map(j => { const d = byId('dokter', j.id_dokter);
    return `<div class="slot"><b>${hm(j.jam_mulai)} - ${hm(j.jam_selesai)}</b><div>${nm(d)}</div><small>${spes(d)} · ${esc(byId('ruangan', j.id_ruangan).nama_ruangan)}</small></div>`; }).join('')
  || '<small class="mut">Tidak ada jadwal</small>'}</div>`).join('')}</div>`;

const lap = () => R.map(x => { const h = Object.keys(x.rows[0] || {});
  return `<div class="card"><h3>${esc(x.title)}</h3>${tbl(h, x.rows.map(r => h.map(k => k.includes('(Rp)') ? rp(r[k]) : esc(r[k]))))}</div>`; }).join('');

const crud = t => { const c = TBL[t];
  return `<div class="card"><div class="tools"><input id="q" placeholder="Cari ${c.label}..."><button class="btn" data-a="add" data-t="${t}">+ Tambah ${c.label}</button></div>` +
    tbl(['No', ...c.cols.map(x => x[1]), 'Aksi'], D[t].map((r, i) => [i + 1, ...c.cols.map(x => esc(cell(t, r, x))),
      `<button class="btn sm" data-a="edit" data-t="${t}" data-id="${r[c.pk]}">Edit</button> <button class="btn sm d" data-a="del" data-t="${t}" data-id="${r[c.pk]}">Hapus</button>`])) + '</div>';
};

function render() {
  const p = location.hash.slice(1) || 'dashboard';
  const pages = [['dashboard', 'Dashboard'], ['mingguan', 'Jadwal Mingguan'], ...Object.entries(TBL).map(([k, v]) => [k, v.label]), ['laporan', 'Laporan']];
  $('#nav').innerHTML = pages.map(([k, l]) => `<a href="#${k}" class="${k == p ? 'on' : ''}">${l}</a>`).join('');
  $('#ttl').textContent = (pages.find(x => x[0] == p) || pages[0])[1];
  $('#view').innerHTML = p == 'laporan' ? lap() : p == 'mingguan' ? week() : TBL[p] ? crud(p) : dash();
}

function fld([k, l, ty], v) {
  let h;
  if (ty === 'textarea') h = `<textarea name="${k}" rows="2">${esc(v)}</textarea>`;
  else if (Array.isArray(ty)) h = `<select name="${k}">${ty.map(o => `<option ${o == v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  else if (ty.fk) { const T = TBL[ty.fk];
    h = `<select name="${k}" required><option value="">-- pilih --</option>${D[ty.fk].map(r => `<option value="${r[T.pk]}" ${r[T.pk] == v ? 'selected' : ''}>${esc(T.lab(r))}</option>`).join('')}</select>`; }
  else h = `<input name="${k}" type="${ty}" value="${esc(v)}" required ${ty == 'number' ? 'min="0" step="any"' : ''}>`;
  return `<label>${l}${h}</label>`;
}

function form(t, row) {
  const c = TBL[t];
  $('#dt').textContent = (row ? 'Edit ' : 'Tambah ') + c.label;
  $('#ff').innerHTML = c.form.map(f => fld(f, row ? row[f[0]] : '')).join('');
  $('#dlg').showModal();
  $('#frm').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target), b = {};
    c.form.forEach(([k, , ty]) => { const v = fd.get(k); b[k] = (ty == 'number' || ty.fk) && v !== '' ? Number(v) : v; });
    $('#dlg').close();
    run(() => api(row ? 'PUT' : 'POST', t, row && row[c.pk], b), row ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
  };
}

const toast = (m, bad) => { const t = $('#toast'); t.textContent = m; t.style.background = bad ? '#d64545' : ''; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2800); };
const run = async (fn, ok) => { try { await fn(); await load(); render(); toast(ok); } catch (e) { toast(e.message, 1); } };

$('#cx').onclick = () => $('#dlg').close();
$('#view').onclick = e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const { a, t, id } = b.dataset;
  if (a == 'add') form(t); else if (a == 'edit') form(t, byId(t, id));
  else if (confirm('Hapus data ini?')) run(() => api('DELETE', t, id), 'Data berhasil dihapus');
};
$('#view').oninput = e => {
  if (e.target.id != 'q') return;
  const v = e.target.value.toLowerCase();
  document.querySelectorAll('#view tbody tr').forEach(tr => tr.hidden = !tr.textContent.toLowerCase().includes(v));
};
addEventListener('hashchange', render);
load().then(render).catch(e => toast(e.message, 1));