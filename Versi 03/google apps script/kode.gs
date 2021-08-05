/*
 * ABSENSI - GOOGLE SCRIPT
 * ***********************************************************************************
 * Code by    : fahroni|ganteng
 * Contact me : fahroniganteng@gmail.com
 * YouTube    : https://www.youtube.com/c/FahroniGanteng
 * Github     : https://github.com/fahroniganteng
 * Date       : Jul 2021
 * License    : MIT
 */


// SET VARIABLE 
// Silakan diganti variable dibawah ini menyesuaikan kebutuhan
// --------------------------------------------------------------------------------------------------------------------
var idGambarLogo    = '13ClVA2xO5SDEmruMMsxoOU2-YGY-Sh0q'; // id file logo di google drive
var idDataPegawai   = '1oFM55l2X4dkF6NnYc0BHwR7ZZmZZ9shXWQ9uKag5n18'; // id file spreadsheet
var idFolderAbsensi = '1IOqpyDTKT12mOafF8sd1lz4ZF6jfU-84'; // id folder absensi
var namaPerusahaan  = 'Fahroni Ganteng co, ltd';

// koordinat [lat,lon] --> koordinat bisa diambil dari google map (cek video di channel youtube saya)
var lokasiPerusahaan = [-6.186079, 106.978706]; 

// max jarak (dari koordinat perusahaan) yang diperbolehkan absensi dari kantor (dalam km)
// jika perlu dalam meter isikan dalam koma, misal 100m isikan 0.1
var jarakMaxWFO = 0.5;

// max jarak absen dari rumah dalam km (bisa menggunakan koma juga)
var jarakMaxWFH = 50;

// Perhitungan potongan terlambat dan pulang awal
var jamMasuk    = '07:30:00';
var jamPulang   = '16:00:00';

// potongan jika tidak absen masuk atau pulang (dalam jam)
// dan digunakan sebagai maximal jumlah potongan
// misal :
//    tidakAbsen  = 4;
//    jamMasuk    = '07:30:00';
//    kemudian pegawai absen masuk jam 14:30:00 
//    maka, keterlambatan sebenarnya = 7 jam, namun untuk potongan keterlambatan akan dihitung 4 jam
var tidakAbsen  = 4; 


/*
 * GET TIME ZONE 
 * manual         : https://developers.google.com/apps-script/reference/utilities/utilities#formatDate(Date,String,String)
 * manual format  : https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html
 * valid code     : 
 *    var timeZone = 'GMT+07:00'; 
 *    var timeZone = 'GMT+07';
 *    var timeZone = 'GMT+7';
 * */
 var timeZone = 'GMT+07:00'; 

 /*
 * GET TIME ZONE CITY
 * manual     : https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet#setSpreadsheetTimeZone(String)
 * list city  : http://joda-time.sourceforge.net/timezones.html
 * valid code : 
 *    var timeZoneCity = 'Asia/Jakarta'; 
 * */
var timeZoneCity = 'Asia/Jakarta'; 

/*
 * GET LOCALE 
 * manual       : https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet#setspreadsheetlocalelocale
 * list locale  : https://wpastra.com/docs/complete-list-wordpress-locale-codes/
 * valid code   :
 *    var localeCode = 'id_ID';
 *    var localeCode = 'id';
 * */
var localeCode = 'id';


// CLI firebase deploy manual:
// https://firebase.google.com/docs/hosting/?authuser=0#implementation_path

// END SET VARIABLE 
// --------------------------------------------------------------------------------------------------------------------






// Class untuk proses absensi
// --------------------------------------------------------------------------------------------------------------------
class absensi {
	constructor(dt) { // Fungsi yang di run pertama kali pada saat class dipanggil
		this.dt = dt;

		// validasi data dari http web (http request)
		this.dt.idPegawai = this.dt['idPegawai']  !== undefined ? this.dt.idPegawai.toString() : '';
		this.dt.password  = this.dt['password']   !== undefined ? this.dt.password.toString() : '';
		this.dt.kegiatan  = this.dt['kegiatan']   !== undefined ? this.dt.kegiatan.toString() : '';
		this.dt.absensi   = this.dt['absensi']    !== undefined ? this.dt.absensi.toString() : '';
		this.dt.workFrom  = this.dt['workFrom']   !== undefined ? this.dt.workFrom.toString() : '';
		this.dt.position  = this.dt['position']   !== undefined ? this.dt.position : [0, 0];
		this.dt.kegiatan  = this.dt['kegiatan']   !== undefined ? this.dt.kegiatan.toString() : '';

		// get list data pegawai --> from spreadsheet
		this.indexUser = -1;
		let user = SpreadsheetApp.openById(idDataPegawai);
		let userSheet = user.getSheetByName('Pegawai');//sheet
		this.user = userSheet.getRange(2, 1, userSheet.getRange("A1").getDataRegion().getLastRow() - 1, 10).getValues();
	}

  // Cek file spreadsheet (file : Data Absensi/yyyy-mm) di bulan terkait sudah ada atau belum
  getSpreatsheetDataAbsensi(now){
    let spreadsheetName   = Utilities.formatDate(now, timeZone, "yyyy-MM");
    let sheetName         = 'Absensi Pegawai';
    let dir               = DriveApp.getFolderById(idFolderAbsensi);
    let fileName          = dir.getFilesByName(spreadsheetName);
    let dataAbsensi;      // variable buat file spreadsheet
    let shDataAbsensi;    // variable buat sheet

    // buat file spreadsheet jika belum ada
    if(!fileName.hasNext()){
      dataAbsensi   = SpreadsheetApp.create(spreadsheetName); // create file spreadsheet
      dataAbsensi.setSpreadsheetTimeZone(timeZoneCity);       // set timezone spreadsheet
      dataAbsensi.setSpreadsheetLocale(localeCode);           // set locale (lokasi) spreadsheet
      dataAbsensi.renameActiveSheet(sheetName);               // rename sheet --> 'Absensi Pegawai'
      DriveApp.getFileById(dataAbsensi.getId()).moveTo(dir);  // move to folder (create file spreadsheet berada di root google drive)
      shDataAbsensi = dataAbsensi.getSheetByName(sheetName);  // open sheet 'Absensi Pegawai'
      
      // Bikin header table di baris pertama & format text nya
      shDataAbsensi.getRange('A1:O1')
        .setValues([[ 'TGL','ID','NAMA','BAGIAN','JAM MASUK','POTONGAN MASUK','STATUS MASUK','JARAK MASUK',
                      'LOKASI MASUK','JAM PULANG','POTONGAN PULANG','STATUS PULANG','JARAK PULANG',
                      'LOKASI PULANG','KEGIATAN']])
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setWrap(true)
        .setBackground('#000000')
        .setFontColor('#FFFFFF')
        .setFontFamily('Comfortaa')
      ;
      shDataAbsensi.getRange('E1:I1').setBackground('#274E13');
      shDataAbsensi.getRange('J1:N1').setBackground('#660000');
      shDataAbsensi.getRange('O:O').setWrap(true);
      // new row not formatted --> pindah tiap input data baru
      // shDataAbsensi.getRange('E:E').setNumberFormat('H:mm:ss');
      // shDataAbsensi.getRange('J:J').setNumberFormat('H:mm:ss');

      //set lebar kolom
      shDataAbsensi.setColumnWidth(9,150);
      shDataAbsensi.setColumnWidth(14,150);
      shDataAbsensi.setColumnWidth(15,300);
    }

    // buka file spreadsheet jika sudah ada
    else{ 
      dataAbsensi = SpreadsheetApp.open(fileName.next());
      shDataAbsensi = dataAbsensi.getSheetByName(sheetName);
    }
    
    return shDataAbsensi;
  }

  // Cek data absensi, apakah hari ini user sudah absen?
  getUserAbsen(shDataAbsensi,dateNow){
    let user            = this.user[this.indexUser];
    let jmlDataAbsensi  = shDataAbsensi.getRange("A1").getDataRegion().getLastRow() - 1;
    let indexAbsensi    = -1;//belum ada data absensi di hari yang sama = -1
    if(jmlDataAbsensi>0){
      let dataAbsensi     = shDataAbsensi.getRange(2, 1, jmlDataAbsensi, 2).getValues();
      for (let i=0; i<dataAbsensi.length;i++) {
        let dateDataAbsensi = Utilities.formatDate(dataAbsensi[i][0], timeZone, 'yyyy-MM-dd');
        // cek id user di hari yang sama
        if(dataAbsensi[i][1]+dateDataAbsensi == user[1]+dateNow) {
          indexAbsensi = i;
          break;
        }
      }
    }
    return indexAbsensi;
  }

  // hitung potongan terlambat masuk, dalam jam
  potonganMasuk(now){
    let dateNow       = Utilities.formatDate(now, timeZone, 'yyyy-MM-dd');
    let jamMasukToday = new Date(dateNow+'T'+jamMasuk);
    let telat         = now.getTime() - jamMasukToday.getTime(); // dalam mili second
    telat = Math.ceil(telat/(1000*60*60));      // convert ke jam (pembulatan keatas)
    telat = telat<0?0:telat;                    // jika nilai minus, absen lebih awal --> telat = 0
    telat = telat>tidakAbsen?tidakAbsen:telat;  // jika melebiji nilai tidakAbsen
    return telat;
  }

  // hitung potongan pulang lebih awal, dalam jam
  potonganPulang(now){
    let dateNow         = Utilities.formatDate(now, timeZone, 'yyyy-MM-dd');
    let jamPulangToday  = new Date(dateNow+'T'+jamPulang);
    let pulangAwal      = jamPulangToday.getTime() - now.getTime(); // dalam mili second
    pulangAwal  = Math.ceil(pulangAwal/(1000*60*60));     // convert ke jam (pembulatan keatas)
    pulangAwal  = pulangAwal<0?0:pulangAwal;
    pulangAwal  = pulangAwal>tidakAbsen?tidakAbsen:pulangAwal;
    return pulangAwal;
  }

	saveAbsensi() {
    let now       = new Date();
    let dateNow   = Utilities.formatDate(now, timeZone, 'yyyy-MM-dd');
    //let timeNow   = Utilities.formatDate(now, timeZone, 'HH:mm:ss'); --> format jam tanpa tanggal, di read dari script berubah timezone
    let timeNow   = Utilities.formatDate(now, timeZone, 'yyyy-MM-dd HH:mm:ss');
    
    // buka atau bikin spreadsheet absensi bulanan --> tak taruh di fungsi sendiri biar mudah dimengerti & dibaca
    let shDataAbsensi   = this.getSpreatsheetDataAbsensi(now);

    // cek user sudah absen atau belum --> tak taruh di fungsi sendiri biar mudah dimengerti & dibaca
    let indexAbsensi    = this.getUserAbsen(shDataAbsensi,dateNow);

    let ret             = {success : false, msg : ''};  // format untuk return
    let user            = this.user[this.indexUser];    // get data user yang absen (fungsi di constructor)
    let masuk           = this.dt.absensi=='Masuk';     // masuk = true; pulang = false
    let koordinat       = this.dt.position[0] + ',' + this.dt.position[1];
    let potonganMasuk   = this.potonganMasuk(now);      // get potongan terlambat (tak taruh di fungsi sendiri juga)
    let potonganPulang  = this.potonganPulang(now);     // get potongan pulang lebih awal (tak taruh di fungsi sendiri juga)

    // // get alamat dari koordinat --> gak jadi pakai, text terlalu panjang di laporan (spreadsheet)
    // let location = Maps.newGeocoder().reverseGeocode(this.dt.position[0], this.dt.position[1]); 

    // user belum ada data absensi di hari yang sama (indexAbsensi= -1) --> sisipkan baris baru (paling bawah)
    if(indexAbsensi<0){ 
      shDataAbsensi.appendRow([
        dateNow,                          // 1. 'TGL'
        user[1],                          // 2. 'ID'
        user[2],                          // 3. 'NAMA'
        user[3],                          // 4. 'BAGIAN'
        masuk?timeNow:null,               // 5. 'JAM MASUK'
        masuk?potonganMasuk:tidakAbsen,   // 6. 'POTONGAN MASUK'
        masuk?this.dt['workFrom']:null,   // 7. 'STATUS MASUK'
        masuk?this.distance:null,         // 8. 'JARAK MASUK'
        masuk?koordinat:null,             // 9. 'LOKASI MASUK'
        !masuk?timeNow:null,              // 10. 'JAM PULANG'
        !masuk?potonganPulang:tidakAbsen, // 11. 'POTONGAN PULANG'
        !masuk?this.dt['workFrom']:null,  // 12.'STATUS PULANG'
        !masuk?this.distance:null,        // 13.'JARAK PULANG'
        !masuk?koordinat:null,            // 14.'LOKASI PULANG'
        this.dt['kegiatan'],              // 15.'KEGIATAN'
      ]);
      

      ret.success = true;
      ret.msg     = user[2];
    }

    // user sudah ada data absensi di hari yang sama --> update data
    else{
      // index dimulai dari 0 dan baris dimulai dari 1 --> baris 1 (paling atas) dipakai header table 
      // jadi data absensi index 0 = baris 2
      indexAbsensi    = indexAbsensi + 2; 

      let absenMasuk  = shDataAbsensi.getRange(indexAbsensi,5).getValue();

      // larangan absen masuk lebih dari sekali dalam sehari
      if(masuk && absenMasuk!='')
        ret.msg = 'Anda sudah melakukan absensi masuk jam '+Utilities.formatDate(absenMasuk, timeZone, 'HH:mm:ss');

      // absen masuk lagi (jika salah absen pulang duluan)
      else if(masuk){
        shDataAbsensi.getRange(indexAbsensi,5,1,5).setValues([[
          timeNow,             // 5. 'JAM MASUK'
          potonganMasuk,       // 6. 'POTONGAN MASUK'
          this.dt['workFrom'], // 7. 'STATUS MASUK'
          this.distance,       // 8. 'JARAK MASUK'
          koordinat,           // 9. 'LOKASI MASUK'
        ]]);
        ret.success = true;
        ret.msg     = user[2];
      }

      // absen pulang
      else{
        shDataAbsensi.getRange(indexAbsensi,10,1,6).setValues([[
          timeNow,              // 10. 'JAM PULANG'
          potonganPulang,       // 11. 'POTONGAN PULANG'
          this.dt['workFrom'],  // 12. 'STATUS PULANG'
          this.distance,        // 13. 'JARAK PULANG'
          koordinat,            // 14. 'LOKASI PULANG'
          this.dt['kegiatan'],  // 15. 'KEGIATAN'
        ]]);
        ret.success = true;
        ret.msg     = user[2];
      }
    }

    // format jam masuk & pulang 
    // (jika cell kosong pidah format otomatis, jadi tiap ada data baru harus format lagi)
    shDataAbsensi.getRange('E:E').setNumberFormat('H:mm:ss');
    shDataAbsensi.getRange('J:J').setNumberFormat('H:mm:ss');
    
    return ret;
	}

  // cek login user ID & password
	validUser() {
		let id = this.user.map(function (r) { return r[1].toString().toUpperCase(); });
		let pass = this.user.map(function (r) { return r[4].toString(); });
		this.indexUser = id.indexOf(this.dt.idPegawai.toUpperCase());
		return (this.indexUser >= 0 && pass[this.indexUser] == this.dt.password) ? true : false;
	}

  // cek jarak dari perusahaan 
	validDistance() {
    // sesuaikan dengan list Lokasi & status absensi di index.html
    let bolehAbsenDariRumah = ['WFH','Ijin']; 

		if (this.dt.position[0] == 0 && this.dt.position[1] == 0)
			return 'Lokasi anda tidak terekam...';
		else {
      // get jarak kantor dengan lokasi absen
			this.distance = this.getDistanceBetween(lokasiPerusahaan[0], lokasiPerusahaan[1], this.dt.position[0], this.dt.position[1]);

      // pilih lokasi absen kantor dan jarak > jarakMaxWFO
			if (this.distance > jarakMaxWFO && !bolehAbsenDariRumah.includes(this.dt.workFrom))
				return 'Lokasi anda terlalu jauh<br><a href="https://www.google.com/maps/dir/?api=1' + 
          '&origin=' + this.dt.position[0] + ',' + this.dt.position[1] +
          '&destination=' + lokasiPerusahaan[0] + ',' + lokasiPerusahaan[1] +
          '&travelmode=walking" '+
          'target="_blank">' + 
          this.distance + 'km dari perusahaan</a><br>' +
          'Maksimal jarak untuk '+ this.dt.workFrom +' adalah ' + jarakMaxWFO + 'km.';
      
      // pilih lokasi rumah dan jarak > jarakMaxWFH
			else if (this.distance > jarakMaxWFH && bolehAbsenDariRumah.includes(this.dt.workFrom))
        return 'Lokasi anda terlalu jauh<br><a href="https://www.google.com/maps/dir/?api=1' + 
          '&origin=' + this.dt.position[0] + ',' + this.dt.position[1] +
          '&destination=' + lokasiPerusahaan[0] + ',' + lokasiPerusahaan[1] +
          '&travelmode=walking" '+
          'target="_blank">' + 
          this.distance + 'km dari perusahaan</a><br>' +
          'Maksimal jarak untuk '+ this.dt.workFrom +' adalah ' + jarakMaxWFH + 'km.';
			
      // jarak valid
      else return 'confirm';
		}
	}
	getDistanceBetween(originLat, originLong, destLat, destLong) {
		var directions, route;

		// Create a new Direction finder using Maps API available on Google Apps Script
		directions = Maps.newDirectionFinder()
			.setOrigin(originLat, originLong)
			.setDestination(destLat, destLong)
			.setMode(Maps.DirectionFinder.Mode.WALKING)
			.getDirections(); // Direction Object

		// The path may have some segments so it sum it all
		if (directions.routes[0]) {
			route = directions.routes[0].legs.reduce(function (acc, currentRow) {
				acc.dist += currentRow.distance.value / 1000;
				acc.dur += currentRow.duration.value / 60;
				return acc;
			}, { dist: 0, dur: 0 });
			return route.dist;
		} else {
			return 0;
		}
	}
}
// END Class proses absensi
// --------------------------------------------------------------------------------------------------------------------



// jika web diakses/dibuka, yang pertama kali dijalankan adalah fungsi ini 
// --------------------------------------------------------------------------------------------------------------------
function doGet() { 
	let templateIndex = HtmlService.createTemplateFromFile('index');  // baca index.html
	templateIndex.dt = {  // kirim variable ke index.html
		logo: getImage(idGambarLogo),
		perusahaan: namaPerusahaan
	};
	return templateIndex
		.evaluate()
		.setSandboxMode(HtmlService.SandboxMode.IFRAME)
		.addMetaTag('viewport', 'width=device-width, initial-scale=1')  // biar auto scale jika dibuka via HP
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);  // allow embed --> iframe (buat ilangin banner google)
}

// Fungsi buat handle request dari index.html --> klik simpan absensi di web
// --------------------------------------------------------------------------------------------------------------------
function submitAbsensi(dt) {
	let a   = new absensi(dt);              // panggil class absensi
	let ret = {	success: false,	msg: ''	};  // format return (web request)

	if (!a.validUser()) ret.msg = 'Anda tidak terdaftar'; // cek user & password ada di list daftar pegawai
	else{
    let cekJarak = a.validDistance();                   // get jarak lokasi absen & kantor
    if (cekJarak != 'confirm') ret.msg = cekJarak;      // jika tidak valid kembalikan link google map direction lokasi ke kantor
	  else ret = a.saveAbsensi();                         // jika valid 
  }
	return ret;
}

// Fungsi buat buka gambar (dipake buat buka logo.png doang)
// --------------------------------------------------------------------------------------------------------------------
function getImage(fileId) {
	var img = DriveApp.getFileById(fileId).getBlob().getBytes(); // get image dari drive berdasarkan id file
	return Utilities.base64Encode(img); // convert image ke base64Encode
}







// Fungsi dibawah ini hanya untuk test input data absen saja --------------------------------------
function testInput(){
  let dt= {
    idPegawai : '20210001MT',
		password  : '20210001',
		kegiatan  : '',
		absensi   : 'Masuk',
		workFrom  : 'WFH',
		position  : [-6.089501, 106.997263],
    kegiatan  : 'test',
  }
  let a = new absensi(dt);
  if (!a.validUser()) Logger.log('Anda tidak terdaftar');
	else {
		let cekJarak = a.validDistance();
		if (cekJarak != 'confirm') Logger.log(cekJarak);
		else {
			Logger.log(a.saveAbsensi());
		}
	}
}


