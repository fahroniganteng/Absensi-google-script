/*
 * ABSENSI GOOGLE SCRIPT
 * ***********************************************************************************
 * Code by : fahroni|ganteng
 * contact me : fahroniganteng@gmail.com
 * Date : Apr 2021
 * License :  MIT
 * 
 */

var idGambarLogo = '-------------------id file-------------------'; // id file logo di google drive
var idDataPegawai = '------------------id file-------------------'; // id file spreadsheet
var idDataAbsensi = '------------------id file-------------------'; // id file spreadsheet
var namaPerusahaan = 'Fahroni Ganteng co, ltd';
var lokasiPerusahaan = [-6.088664, 106.996309]; // koordinat [lat,lon]
var jarakMaxWFO = 1; // max jarak (dari koordinat perusahaan) yang diperbolehkan absensi WFO (dalam km)
var jarakMaxWFH = 50; // max jarak WFH

function doGet() {
	let templateIndex = HtmlService.createTemplateFromFile('index');
	templateIndex.dt = {
		logo: getImage(idGambarLogo),
		perusahaan: namaPerusahaan
	};
	return templateIndex
		.evaluate()
		.setSandboxMode(HtmlService.SandboxMode.IFRAME)
		.addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

class absensi {
	constructor(dt) {
		this.dt = dt;
		// validasi data
		this.dt.idPegawai = this.dt['idPegawai'] !== undefined ? this.dt.idPegawai.toString() : '';
		this.dt.password = this.dt['password'] !== undefined ? this.dt.password.toString() : '';
		this.dt.kegiatan = this.dt['kegiatan'] !== undefined ? this.dt.kegiatan.toString() : '';
		this.dt.absensi = this.dt['absensi'] !== undefined ? this.dt.absensi.toString() : '';
		this.dt.workFrom = this.dt['workFrom'] !== undefined ? this.dt.workFrom.toString() : '';
		this.dt.position = this.dt['position'] !== undefined ? this.dt.position : [0, 0];

		// get list pegawai --> from spreadsheet
		this.indexUser = -1;
		let user = SpreadsheetApp.openById(idDataPegawai);
		let userSheet = user.getSheetByName('Pegawai');//sheet
		this.user = userSheet.getRange(2, 1, userSheet.getRange("A1").getDataRegion().getLastRow() - 1, 10).getValues();
	}
	saveAbsensi() {
		let abs = SpreadsheetApp.openById(idDataAbsensi);
		let absensi = abs.getSheetByName('Absensi');//sheet
		let location = Maps.newGeocoder().reverseGeocode(this.dt.position[0], this.dt.position[1]); // get alamat dari koordinat
		let user = this.user[this.indexUser];
		absensi.appendRow([
			new Date(),
			user[1],
			user[2],
			user[3],
			this.dt['absensi'],
			this.dt['workFrom'],
			this.dt['kegiatan'],
			this.distance,
			this.dt.position[0] + ',' + this.dt.position[1],
			location.results[0].formatted_address
		]);
		return user[2];
	}
	validUser() {//login
		let id = this.user.map(function (r) { return r[1].toString().toUpperCase(); });
		let pass = this.user.map(function (r) { return r[4].toString(); });
		this.indexUser = id.indexOf(this.dt.idPegawai.toUpperCase());
		return (this.indexUser >= 0 && pass[this.indexUser] == this.dt.password) ? true : false;
	}
	validDistance() {// jarak dari perusahaan
		if (this.dt.position[0] == 0 && this.dt.position[1] == 0) {
			return 'Lokasi anda tidak terekam...';
		}
		else {
			this.distance = this.getDistanceBetween(lokasiPerusahaan[0], lokasiPerusahaan[1], this.dt.position[0], this.dt.position[1]);
			if (this.distance > jarakMaxWFO && this.dt.workFrom == 'WFO')
				return 'Lokasi anda terlalu jauh<br><a href="https://www.google.com/maps/dir/' + lokasiPerusahaan[0] + ',' + lokasiPerusahaan[1] + '/' + this.dt.position[0] + ',' + this.dt.position[1] + '/" target="_blank">' + this.distance + 'km dari perusahaan</a><br>Maksimal jarak untuk WFO adalah ' + jarakMaxWFO + 'km.';
			else if (this.distance > jarakMaxWFH && this.dt.workFrom == 'WFH')
				return 'Lokasi anda terlalu jauh.<br><a href="https://www.google.com/maps/dir/' + lokasiPerusahaan[0] + ',' + lokasiPerusahaan[1] + '/' + this.dt.position[0] + ',' + this.dt.position[1] + '/" target="_blank">' + this.distance + 'km dari perusahaan</a><br>Maksimal jarak untuk WFH adalah ' + jarakMaxWFH + 'km.';
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

function submitAbsensi(dt) {
	let a = new absensi(dt);
	let ret = {
		success: false,
		msg: ''
	}

	if (!a.validUser()) ret.msg = 'Anda tidak terdaftar';
	else {
		let cekJarak = a.validDistance();
		if (cekJarak != 'confirm') ret.msg = cekJarak;
		else {
			ret.msg = a.saveAbsensi();
			ret.success = true;
		}
	}
	return ret;
}
function getImage(fileId) {
	var img = DriveApp.getFileById(fileId).getBlob().getBytes();
	return Utilities.base64Encode(img);
}
