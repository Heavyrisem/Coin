// const fetch = require("node-fetch");
// const URL = "http://heavyrisem.kro.kr/getLog";
// const KEY = "HEAVYRISEM";

const Config = require('./Config.json');
const mysql = require('mysql2');
const DB = mysql.createConnection(Config.DB);
DB.connect();


function ParseDate(date) {
    let d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}`;
}

async function getServerResponse() {
    // DB.query(`SELECT * FROM coinValue ORDER BY id DESC limit 5`, (err, rows) => {
    //     if (err) return Log.writeLog("System", "Error", "coinValue 데이터베이스 조회 오류");
    //     if (!rows.length) return;
    //     rows = rows.reverse();

    //     rows.forEach(row => {
    //         let date = new Date(row.date);
    //         console.log(row.value, `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`);
    //     });
    // })
    let msg = 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)';
    DB.query(`select * from Log WHERE Type like '%Other%'`, (err, rows) => {
        if (err) return console.log(err);
        
        rows.forEach(value => {
            if ((value.Author == "Admin" || value.Type == "SetValue")) return;
            console.log(`[${ParseDate(value.Date)}] [${value.Type}] [${value.Author}] ${value.Message} ${value.Ip}`);
        });
        console.log(`로그 ${rows.length} 로드 완료`)   
        DB.destroy();
    })
}


getServerResponse();