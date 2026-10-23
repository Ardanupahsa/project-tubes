CREATE DATABASE jadwal_dokter;
USE jadwal_dokter;

CREATE TABLE spesialis (
    id_spesialis    INT AUTO_INCREMENT PRIMARY KEY,
    nama_spesialis  VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;
 
CREATE TABLE ruangan (
    id_ruangan    INT AUTO_INCREMENT PRIMARY KEY,
    nama_ruangan  VARCHAR(60) NOT NULL UNIQUE,
    lantai        INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;
 
CREATE TABLE dokter (
    id_dokter     INT AUTO_INCREMENT PRIMARY KEY,
    nama_dokter   VARCHAR(100) NOT NULL,
    id_spesialis  INT NOT NULL,
    no_telp       VARCHAR(20),
    status        ENUM('Aktif','Cuti') NOT NULL DEFAULT 'Aktif',
    CONSTRAINT fk_dokter_spesialis FOREIGN KEY (id_spesialis)
        REFERENCES spesialis(id_spesialis) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
 
CREATE TABLE pasien (
    id_pasien      INT AUTO_INCREMENT PRIMARY KEY,
    nama           VARCHAR(100) NOT NULL,
    jenis_kelamin  ENUM('Laki-laki','Perempuan') NOT NULL,
    no_telp        VARCHAR(20)
) ENGINE=InnoDB;
 
CREATE TABLE jadwal (
    id_jadwal    INT AUTO_INCREMENT PRIMARY KEY,
    id_dokter    INT NOT NULL,
    id_ruangan   INT NOT NULL,
    hari         ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') NOT NULL,
    jam_mulai    TIME NOT NULL,
    jam_selesai  TIME NOT NULL,
    kuota        INT NOT NULL DEFAULT 10,
    CONSTRAINT chk_jam CHECK (jam_selesai > jam_mulai),
    CONSTRAINT fk_jadwal_dokter  FOREIGN KEY (id_dokter)
        REFERENCES dokter(id_dokter)   ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_jadwal_ruangan FOREIGN KEY (id_ruangan)
        REFERENCES ruangan(id_ruangan) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
 
CREATE TABLE booking (
    id_booking   INT AUTO_INCREMENT PRIMARY KEY,
    id_jadwal    INT NOT NULL,
    id_pasien    INT NOT NULL,
    tgl_booking  DATE NOT NULL,
    status       ENUM('Menunggu','Dikonfirmasi','Selesai','Batal') NOT NULL DEFAULT 'Menunggu',
    keluhan      TEXT,
    CONSTRAINT fk_booking_jadwal FOREIGN KEY (id_jadwal)
        REFERENCES jadwal(id_jadwal) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_booking_pasien FOREIGN KEY (id_pasien)
        REFERENCES pasien(id_pasien) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
 
-- ---------- 2. DATA CONTOH ----------
INSERT INTO spesialis (nama_spesialis) VALUES
('Dokter Umum'), ('Spesialis Anak'), ('Spesialis Penyakit Dalam'), ('Dokter Gigi'), ('Spesialis Kulit');
 
INSERT INTO ruangan (nama_ruangan, lantai) VALUES
('Ruang Poli Umum', 1), ('Ruang Poli Anak', 1), ('Ruang Penyakit Dalam', 2),
('Ruang Poli Gigi', 2), ('Ruang Poli Kulit', 3);
 
INSERT INTO dokter (nama_dokter, id_spesialis, no_telp, status) VALUES
('dr. Andi Pratama',   1, '081211110001', 'Aktif'),
('dr. Siti Rahmawati', 2, '081211110002', 'Aktif'),
('dr. Maya Lestari',   3, '081211110003', 'Aktif'),
('drg. Budi Santoso',  4, '081211110004', 'Aktif'),
('dr. Rudi Hartono',   1, '081211110005', 'Cuti'),
('dr. Rina Kusuma',    5, '081211110006', 'Aktif');
 
INSERT INTO pasien (nama, jenis_kelamin, no_telp) VALUES
('Ahmad Fauzi','Laki-laki','082100000001'), ('Dewi Anggraini','Perempuan','082100000002'),
('Rizky Ramadhan','Laki-laki','082100000003'), ('Putri Maharani','Perempuan','082100000004'),
('Hendra Wijaya','Laki-laki','082100000005'), ('Lina Marlina','Perempuan','082100000006');
 
INSERT INTO jadwal (id_dokter, id_ruangan, hari, jam_mulai, jam_selesai, kuota) VALUES
(1,1,'Senin','08:00','12:00',20), (1,1,'Rabu','08:00','12:00',20),
(2,2,'Senin','09:00','13:00',15), (2,2,'Kamis','09:00','13:00',15),
(3,3,'Selasa','10:00','14:00',12), (3,3,'Kamis','13:00','17:00',12),
(4,4,'Rabu','13:00','17:00',10),  (4,4,'Jumat','08:00','12:00',10),
(5,1,'Selasa','13:00','17:00',20),(6,5,'Jumat','13:00','16:00',8),
(6,5,'Sabtu','09:00','12:00',8),  (1,1,'Kamis','13:00','17:00',20);
 
INSERT INTO booking (id_jadwal, id_pasien, tgl_booking, status, keluhan) VALUES
(1,1,'2026-10-19','Selesai','Demam'),
(3,3,'2026-10-19','Selesai','Batuk pilek'),
(5,5,'2026-10-20','Selesai','Tekanan darah tinggi'),
(2,2,'2026-10-21','Selesai','Sakit kepala'),
(7,6,'2026-10-21','Batal','Sakit gigi'),
(4,4,'2026-10-22','Dikonfirmasi','Kontrol anak'),
(6,5,'2026-10-22','Dikonfirmasi','Kontrol hipertensi'),
(12,1,'2026-10-22','Menunggu','Pegal-pegal'),
(8,6,'2026-10-23','Menunggu','Sakit gigi'),
(10,2,'2026-10-23','Dikonfirmasi','Gatal pada kulit');
 
INSERT INTO ruangan (nama_ruangan, lantai) VALUES ('Ruang Contoh', 1);          -- CREATE
SELECT * FROM ruangan;                                                          -- READ
UPDATE ruangan SET lantai = 2 WHERE nama_ruangan = 'Ruang Contoh';              -- UPDATE
DELETE FROM ruangan WHERE nama_ruangan = 'Ruang Contoh';                        -- DELETE
 
SELECT j.hari, TIME_FORMAT(j.jam_mulai,'%H:%i') AS mulai, TIME_FORMAT(j.jam_selesai,'%H:%i') AS selesai,
       d.nama_dokter, s.nama_spesialis, r.nama_ruangan
FROM jadwal j
JOIN dokter d    ON j.id_dokter    = d.id_dokter
JOIN spesialis s ON d.id_spesialis = s.id_spesialis
JOIN ruangan r   ON j.id_ruangan   = r.id_ruangan
ORDER BY FIELD(j.hari,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'), j.jam_mulai;
 
SELECT b.tgl_booking, p.nama AS pasien, d.nama_dokter, j.hari, j.jam_mulai, b.status
FROM booking b
JOIN pasien p ON b.id_pasien = p.id_pasien
JOIN jadwal j ON b.id_jadwal = j.id_jadwal
JOIN dokter d ON j.id_dokter = d.id_dokter
ORDER BY b.tgl_booking;
 
SELECT d.nama_dokter FROM dokter d
LEFT JOIN jadwal j ON j.id_dokter = d.id_dokter
WHERE j.id_jadwal IS NULL;
 
SELECT hari, COUNT(*) AS jumlah_jadwal FROM jadwal
GROUP BY hari ORDER BY FIELD(hari,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu');
 
SELECT s.nama_spesialis, COUNT(d.id_dokter) AS jumlah_dokter
FROM spesialis s LEFT JOIN dokter d ON d.id_spesialis = s.id_spesialis
GROUP BY s.id_spesialis, s.nama_spesialis;
 
SELECT d.nama_dokter, COUNT(j.id_jadwal) AS jumlah_jadwal, SUM(j.kuota) AS total_kuota
FROM dokter d JOIN jadwal j ON j.id_dokter = d.id_dokter
GROUP BY d.id_dokter, d.nama_dokter ORDER BY total_kuota DESC;
 
-- d. Jumlah booking per dokter
SELECT d.nama_dokter, COUNT(b.id_booking) AS jumlah_booking
FROM booking b JOIN jadwal j ON b.id_jadwal = j.id_jadwal
JOIN dokter d ON j.id_dokter = d.id_dokter
GROUP BY d.id_dokter, d.nama_dokter ORDER BY jumlah_booking DESC;
 
SELECT status, COUNT(*) AS jumlah FROM booking GROUP BY status;
 
SELECT d.nama_dokter, j.hari, j.kuota,
       COUNT(b.id_booking) AS terisi, j.kuota - COUNT(b.id_booking) AS sisa_kuota
FROM jadwal j
JOIN dokter d ON j.id_dokter = d.id_dokter
LEFT JOIN booking b ON b.id_jadwal = j.id_jadwal AND b.status <> 'Batal'
GROUP BY j.id_jadwal, d.nama_dokter, j.hari, j.kuota;
 
SELECT d.nama_dokter, COUNT(*) AS jumlah_jadwal
FROM dokter d JOIN jadwal j ON j.id_dokter = d.id_dokter
GROUP BY d.id_dokter, d.nama_dokter HAVING COUNT(*) >= 2;