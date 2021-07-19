# Absensi-google-script
Web absensi pada google script dan spreadsheets dengan login dan menyimpan lokasi

<hr>

## VERSI 03

#### Fitur Web Absensi Versi 03
1. Fitur versi 01 dan versi 02 masih digunakan.
2. Metode absensi :
    - Absen masuk tidak boleh lebih dari sekali dalam sehari.
    - Absen pulang bisa diulang berkali2 (data absen pulang yang lama akan ditimpa)  
    Jika salah absen pulang pada waktu berangkat, masih bisa absen pulang lagi di sore hari.  
    - Bisa absen pulang tanpa absen masuk  
    Ini untuk jika lupa absen masuk, maka masih bisa absen pulang (dihitung potongan tidak absen) 
3. Perbaikan data rekap absensi :
    - Recording absensi dalam file spreadsheet per bulan ⇒  mempermudah untuk rekap bulanan (1 file spreadsheet tiap 1 bulan)
    - Penggabungan record absen masuk & pulang ⇒ mengurangi jumlah record
4. Perhitungan potongan terlambat, pulang lebih awal, tidak absen masuk/pulang.
5. Setting timezone (di setting pada config/variable code)

#### Aplikasi yang digunakan
- Aplikasi web menggunakan google script
- Penyimpanan data pada google drive
- Recording pada google spreadsheet
- Sub domain pada google firebase (cek pada video)
- Report menggunakan google data studio (cek pada video)

#### Video 
- Video 01. Demo & fitur aplikasi  
https://youtu.be/jJtDMGuq6dQ
- Video 02. Instalasi aplikasi pada google apps script  
https://youtu.be/FUkhfHXj8jo
- Video 03. Menghilangkan banner google dan sub domain google firebase  
https://youtu.be/neY8G5oCjFM
- Video 04. Membuat report spreadsheet dan google data studio  
https://youtu.be/pz6Ld-8P8i4

#### Testing & demo aplikasi 
  >  user : github  
  >  pass : github  
- Link sub domain (tidak ada top banner google)  
https://demoabsensi.web.app/
- Link google apps script  
https://script.google.com/macros/s/AKfycbx2vOrvFQ4ZyQEtefQR5I2At105yEeMR6HoxQ0RkcheBp7AgG0B_0xrs26y4z45OSc/exec  

#### Testing & demo reporting (google data studio)
- Link google studio  
https://datastudio.google.com/s/ldMer2ZUTiY


### NOTE :
Ditemukan bug pada penggunaan ID Pegawai dengan nol di depan,  
`misal : 0054321`  
pada saat submit absensi, ID tersebut di convert menjadi angka oleh spreadsheet, sehingga yang terekam pada data absensi adalah :  
`54321`  
pada aplikasi `0054321 != 54321`, sehingga dianggap user yang berbeda dan masih bisa melakukan absensi di hari yang sama.  
<b>Solusi Sementara </b>  
Tambahkan huruf pada ID, misal:  
`ABC0054321`
  


<br>
<br>
<br>
<br>
<br>
  
  
  
<hr>

## VERSI 02
Tambahan fitur dari versi 01:
- Membatasi absensi WFO (Work From Office) / WFH (Work From Home) berdasarkankan jarak.
- Link ke google map untuk melihat jarak dan rute lokasi absen menuju kantor.
- Simpan jarak absensi dengan kantor 
- Kegiatan harian
#### Video demo & instalasi
[![DEMO](http://img.youtube.com/vi/Sf83RYbiwo0/0.jpg)](https://youtu.be/Sf83RYbiwo0)

#### Testing & demo aplikasi
https://script.google.com/macros/s/AKfycbzXCF2kUJl72pl42FGQ81FMzTg1axb_UFpVC7HRzhTtME_LbgMyrgGIkqZaTiuAIFnPfg/exec
- user : github
- pass : github

> NOTE :   
> Jika menggunakan browser chrome di android, jika link diatas tidak bisa dibuka coba logout dari akun google yang di chrome.
<br>
<br>
<br>
<br>
<br>

<hr>

## VERSI 01
Fitur :
- Login dengan password
- Simpan waktu, koordinat dan lokasi absensi
#### Video demo & instalasi
[![DEMO](http://img.youtube.com/vi/l8oBqwMrlaE/0.jpg)](https://youtu.be/l8oBqwMrlaE)

#### Testing & demo aplikasi
https://script.google.com/macros/s/AKfycbzyp4ubIEPShU69QxBH_i-Yek9LLISezFKAS89DOXs0eZWAC4XlE6opgVT_Y3cDPIKS/exec
- user : github
- pass : github

> NOTE :   
> Jika menggunakan browser chrome di android, jika link diatas tidak bisa dibuka coba logout dari akun google yang di chrome.

<hr>

## License and credits
Lisensi kode saya adalah MIT, untuk libraries yang lain mengikuti lisensi masing-masing.
- Jquery.js
- Bootstrap
- Google script
- Google spreadsheet
- etc...
