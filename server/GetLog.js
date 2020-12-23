// const fetch = require("node-fetch");
// const URL = "http://heavyrisem.kro.kr/getLog";
// const KEY = "HEAVYRISEM";

const Config = require('./Config.json');
const mysql = require('mysql');
const DB = mysql.createConnection(Config.DB);
DB.connect();


function ParseDate(date) {
    let d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}`;
}

async function getServerResponse() {
    DB.query(`SELECT * FROM coinValue ORDER BY id DESC limit 5`, (err, rows) => {
        if (err) return Log.writeLog("System", "Error", "coinValue 데이터베이스 조회 오류");
        if (!rows.length) return;
        rows = rows.reverse();

        rows.forEach(row => {
            let date = new Date(row.date);
            console.log(row.value, `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`);
        });
    })
    // DB.query(`select * from Log where Author='System' order by id DESC limit 100`, (err, rows) => {
    //     if (err) return console.log(err);
    //     rows.reverse();
    //     rows.forEach(value => {
    //         if ((value.Author == "Admin" || value.Type == "SetValue")) return;
    //         console.log(`[${ParseDate(value.Date)}] [${value.Type}] [${value.Author}] ${value.Message} ${value.Ip}`);
    //     });
        
    //     DB.destroy();
    // })
}


getServerResponse();