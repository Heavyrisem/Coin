// const sqlite3 = require('sqlite3');
// const DB = new sqlite3.Database('./DB.db', sqlite3.OPEN_READWRITE, err => {
//     if (err) {
//         console.log(`Error while Opening DB ${err}`);
//     } else {
//         console.log(`Database Connected`);
//     }
// });
const Config = require('./Config.json');
const mysql = require('mysql2');
const DB = mysql.createConnection(Config.DB);
DB.connect();


function GetCurrentTime() {
    let now = new Date();
    return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${(now.getHours()<10)? '0'+now.getHours(): now.getHours()}.${(now.getMinutes()<10)? '0'+now.getMinutes(): now.getMinutes()}.${(now.getSeconds()<10)? '0'+now.getSeconds(): now.getSeconds()}`;
}

function writeLog(Author, Type, Message, Ip) {
    switch (typeof Message) {
        case "object":
            Message = replaceAll(JSON.stringify(Message), `"`, " ");
            break;
    }
    
    Message = replaceAll(Message, "'", "");
    if (Ip == undefined) Ip = "none";
    console.log(`[${GetCurrentTime()}] [${Type}] [${Author}] ${Message} ${Ip}`);
    DB.query(`INSERT INTO Log(Date, Message, Type, Author, Ip) VALUES('${new Date()}', '${Message}', '${Type}', '${Author}', '${Ip}')`);
}

function replaceAll(originstr, findstr, replacestr) {
    return originstr.split(findstr).join(replacestr);
}


exports.writeLog = writeLog;
