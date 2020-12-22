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
    DB.query(`select id from Log`, (err, rows) => {
        if (err) return console.log(err);
        // rows.reverse();
        // rows.forEach(value => {
        //     if ((value.Author == "Admin" || value.Type == "SetValue")) return;
        //     console.log(`[${ParseDate(value.Date)}] [${value.Type}] [${value.Author}] ${value.Message}`);
        // });
        console.log(rows.length);
        DB.destroy();
    })
}


getServerResponse();