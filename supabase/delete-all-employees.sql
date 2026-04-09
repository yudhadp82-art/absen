-- ⚠️ PERINGATAN: Script ini akan MENGHAPUS SEMUA DATA KARYAWAN
-- Jalankan dengan HATI-HATI dan pastikan Anda sudah backup data jika diperlukan

-- Backup semua data karyawan sebelum menghapus (opsional tapi disarankan)
-- Uncomment baris di bawah ini untuk backup:
-- CREATE TABLE employees_backup AS SELECT * FROM employees;

-- Cek jumlah karyawan yang akan dihapus
SELECT COUNT(*) as total_employees_to_delete FROM employees;

-- Hapus semua data karyawan
DELETE FROM employees;

-- Verifikasi bahwa semua data telah dihapus
SELECT COUNT(*) as remaining_employees FROM employees;

-- Reset auto-increment sequence jika ada (opsional)
-- Uncomment jika menggunakan auto-increment ID:
-- ALTER SEQUENCE employees_id_seq RESTART WITH 1;

-- Pesan konfirmasi
SELECT 'Semua data karyawan telah berhasil dihapus' as status;