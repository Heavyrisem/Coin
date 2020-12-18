const sqlite3 = require('sqlite3');
const DB = new sqlite3.Database('./DB.db', sqlite3.OPEN_READWRITE, err => {
    if (err) {
        console.log(`Error while Opening DB ${err}`);
    } else {
        console.log(`Database Connected`);
    }
});

function GetCurrentTime() {
    let now = new Date();
    return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}.${now.getMinutes()}.${now.getSeconds()}`;
}

function writeLog(Author, Type, Message) {
    switch (typeof Message) {
        case "object":
            Message = replaceAll(JSON.stringify(Message), `"`, " ");
            break;
    }
            
    console.log(`[${GetCurrentTime()}] [${Type}] [${Author}] ${Message}`);
    DB.run(`INSERT INTO Log(Date, Message, Type, Author) VALUES('${new Date()}', '${Message}', '${Type}', '${Author}')`);
}

function replaceAll(originstr, findstr, replacestr) {
    return originstr.split(findstr).join(replacestr);
}


exports.writeLog = writeLog;