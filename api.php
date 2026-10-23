<?php
require __DIR__ . '/Koneksi.php';
header('Content-Type: application/json; charset=utf-8');

function send($d, $c = 200) { http_response_code($c); echo json_encode($d); exit; }

$pk = ['dokter'=>'id_dokter','jadwal'=>'id_jadwal','booking'=>'id_booking',
       'pasien'=>'id_pasien','spesialis'=>'id_spesialis','ruangan'=>'id_ruangan'];
$cols = [
  'dokter'=>['nama_dokter','id_spesialis','no_telp','status'],
  'jadwal'=>['id_dokter','hari','jam_mulai','jam_selesai','id_ruangan','kuota'],
  'booking'=>['id_jadwal','id_pasien','tgl_booking','status','keluhan'],
  'pasien'=>['nama','jenis_kelamin','no_telp'],
  'spesialis'=>['nama_spesialis'],
  'ruangan'=>['nama_ruangan','lantai'],
];
$hari = "FIELD(%s,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')";

try {
  if (isset($_GET['laporan'])) {
    $q = [
      'Jadwal Praktik Lengkap (JOIN 4 tabel)' =>
        "SELECT j.hari AS Hari,
                CONCAT(TIME_FORMAT(j.jam_mulai,'%H:%i'),' - ',TIME_FORMAT(j.jam_selesai,'%H:%i')) AS Jam,
                d.nama_dokter AS Dokter, s.nama_spesialis AS Spesialis, r.nama_ruangan AS Ruangan
         FROM jadwal j JOIN dokter d ON j.id_dokter=d.id_dokter
         JOIN spesialis s ON d.id_spesialis=s.id_spesialis
         JOIN ruangan r ON j.id_ruangan=r.id_ruangan
         ORDER BY " . sprintf($hari, 'j.hari') . ", j.jam_mulai",
      'Jumlah Jadwal per Hari (COUNT + GROUP BY)' =>
        "SELECT hari AS Hari, COUNT(*) AS `Jumlah Jadwal` FROM jadwal
         GROUP BY hari ORDER BY " . sprintf($hari, 'hari'),
      'Jumlah Dokter per Spesialis (COUNT + GROUP BY)' =>
        "SELECT s.nama_spesialis AS Spesialis, COUNT(d.id_dokter) AS `Jumlah Dokter`
         FROM spesialis s LEFT JOIN dokter d ON d.id_spesialis=s.id_spesialis
         GROUP BY s.id_spesialis, s.nama_spesialis ORDER BY 2 DESC",
      'Total Jadwal dan Kuota per Dokter (COUNT + SUM)' =>
        "SELECT d.nama_dokter AS Dokter, COUNT(j.id_jadwal) AS `Jumlah Jadwal`, SUM(j.kuota) AS `Total Kuota`
         FROM dokter d JOIN jadwal j ON j.id_dokter=d.id_dokter
         GROUP BY d.id_dokter, d.nama_dokter ORDER BY 3 DESC",
      'Jumlah Booking per Dokter (JOIN + COUNT)' =>
        "SELECT d.nama_dokter AS Dokter, COUNT(b.id_booking) AS `Jumlah Booking`
         FROM booking b JOIN jadwal j ON b.id_jadwal=j.id_jadwal
         JOIN dokter d ON j.id_dokter=d.id_dokter
         GROUP BY d.id_dokter, d.nama_dokter ORDER BY 2 DESC",
      'Jumlah Booking per Status (COUNT + GROUP BY)' =>
        "SELECT status AS Status, COUNT(*) AS `Jumlah Booking` FROM booking GROUP BY status ORDER BY 2 DESC",
    ];
    $out = [];
    foreach ($q as $title => $sql) $out[] = ['title' => $title, 'rows' => $pdo->query($sql)->fetchAll()];
    send($out);
  }

  $t = $_GET['t'] ?? '';
  if (!isset($pk[$t])) send(['error' => 'Tabel tidak valid'], 400);
  $key = $pk[$t]; $c = $cols[$t]; $m = $_SERVER['REQUEST_METHOD'];
  $b = json_decode(file_get_contents('php://input'), true) ?? [];

  if ($m === 'GET')    send($pdo->query("SELECT * FROM $t ORDER BY $key")->fetchAll());
  if ($m === 'DELETE') { $pdo->prepare("DELETE FROM $t WHERE $key=?")->execute([$_GET['id'] ?? 0]); send(['ok' => 1]); }

  $v = array_map(fn($k) => (($b[$k] ?? '') === '') ? null : $b[$k], $c);
  if ($m === 'POST') {
    $ph = implode(',', array_fill(0, count($c), '?'));
    $pdo->prepare("INSERT INTO $t (" . implode(',', $c) . ") VALUES ($ph)")->execute($v);
    send(['ok' => 1, 'id' => $pdo->lastInsertId()], 201);
  }
  if ($m === 'PUT') {
    $set = implode(',', array_map(fn($k) => "$k=?", $c));
    $v[] = $_GET['id'] ?? 0;
    $pdo->prepare("UPDATE $t SET $set WHERE $key=?")->execute($v);
    send(['ok' => 1]);
  }
  send(['error' => 'Method tidak didukung'], 405);

} catch (PDOException $e) {
  send(['error' => $e->getCode() == 23000
      ? 'Gagal: data masih dipakai tabel lain, duplikat, atau kolom wajib kosong'
      : $e->getMessage()], 409);
}