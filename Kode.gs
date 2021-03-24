/*
 * ABSENSI GOOGLE SCRIPT
 * ***********************************************************************************
 * Code by : fahroni|ganteng
 * contact me : fahroniganteng@gmail.com
 * Date : Mar 2021
 * License :  MIT
 * 
 */
 
//spreadsheet url
var database = "https://docs.google.com/spreadsheets/d/[id-dokumen]/edit#gid=0";

function doGet(){
  return HtmlService
    .createTemplateFromFile('index')
    .evaluate()
    .setSandboxMode(HtmlService.SandboxMode.NATIVE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function submitAbsensi(data){
  // Buka Spreadsheet
  let ss  = SpreadsheetApp.openByUrl(database);
  let ws  = ss.getSheetByName('pegawai');
  let list    = ws.getRange(2,1,ws.getRange("A2").getDataRegion().getLastRow() - 1, 5).getValues();
  let userId  = list.map(function(r){ return r[1].toString(); });
  let pass    = list.map(function(r){ return r[3].toString(); });

  // Verifikasi data yang dikirim
  data.idPegawai  = data['idPegawai'] !== undefined?data.idPegawai.toString():'';
  data.password   = data['password'] !== undefined?data.password.toString():'';
  data.position   = data['position'] !== undefined?data.position:[0,0];

  // Verifikasi user dan password
  let indexData = userId.indexOf(data.idPegawai);
  if(indexData > -1 && pass[indexData] == data.password){
    let nama      = list.map(function(r){ return r[2]});

    // Get Alamat dari koordinat
    let koordinat = data.position[0] +', '+ data.position[1]; 
    let response  = Maps.newGeocoder().reverseGeocode(data.position[0], data.position[1]);
    let lokasi    = response.results[0].formatted_address;

    //buka sheet absensi dan simpan data
    ws = ss.getSheetByName("absensi");
    ws.appendRow([data.idPegawai, nama[indexData], new Date(),koordinat, lokasi]);
    return nama[indexData];
  }
  else 
    return false;
}
