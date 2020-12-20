const fs = require("fs");
let logpath;

function LogFileName() {
    let now = new Date();
    return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}.${now.getMinutes()}.${now.getSeconds()}`;
}

function writeLog(write) {
    return function(string) {
        switch (typeof string) {
            case "object":
                string = replaceAll(JSON.stringify(string), `"`, " ");
                break;
        }
            
        fs.appendFileSync(logpath, string);
        write.apply(process.stdout, arguments)
    }
}

function replaceAll(originstr, findstr, replacestr) {
    return originstr.split(findstr).join(replacestr);
}

function init(root) {
    fs.readdir(`./logs/${root}`, (err, files) => {
        if (err) {
            fs.mkdir(`./logs/${root}`, {recursive: true}, () => {
                logpath = `./logs/${root}/${LogFileName()}.txt`;
                fs.writeFileSync(logpath, "Log Started\n");
                process.stdout.write = (writeLog)(process.stdout.write);
            });
            return;
        }
        files.some(name => {
            if (name == root) return true;
            else return false;
        });
        fs.mkdir(`./logs/${root}`, {recursive: true}, () => {
            logpath = `./logs/${root}/${LogFileName()}.txt`;
            fs.writeFileSync(logpath, "Log Started\n");
            process.stdout.write = (writeLog)(process.stdout.write);
        });
    });
}

exports.init = init;