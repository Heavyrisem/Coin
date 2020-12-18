// require('./log').init('wh');
const express = require('express');
const app = express();
const { exec, spawn } = require('child_process');
const kill = require('kill-port');
const servicePort = 80;

let service;
let serverOnline = false;

const bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            resolve()
        }, time);
    });
}

function startServer(platform) {
    if (serverOnline) return;
    switch (platform) {
        case "win32": {

            serverOnline = true;
            spawn("Restore.bat")
            service = spawn("run.bat");
            // service = spawn("cmd", ['/C','serve' ,'-s', '../build', '-l', servicePort, '-n']);
            // service.stdout.on("data", (chunk) => {console.log(chunk+"")});
            console.log("Server is Online !");
            break;

        }
        case "linux": {

            serverOnline = true;
            spawn("sh", ["Restore.sh"]);
            service = spawn("sh", ['run.sh']);
        //     service.stdout.on("data", (chunk) => {console.log(chunk+"")});
        //     console.log("Server started");
            console.log("Server is Online !");
            break;

        }
        default: console.log("This platform is not support!"); break;
    }
}

async function stopServer() {
    return new Promise(async (resolve, reject) => {

        await kill(servicePort, "tcp");
        serverOnline = false;
        console.log("Server Stopping ...");
        switch(process.platform) {
            case "win32": {
                spawn("Backup.bat");
                break;
            }
            case "linux": {
                spawn("sh", ["Backup.sh"]);
                break;
            }
            default: {
                return console.log("Not supported Platform");
            }
        }
        console.log("Backup DB")
        resolve();

    });
}

async function Prepare(req, res) {
    let now = new Date();
    console.log("---------- New Commit has Arrive ----------");
    console.log(`${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}.${now.getMinutes()}.${now.getSeconds()}`);
    if (req.body.ref != "refs/heads/master") {
        console.log("Branch is Diff", req.body.ref);
        return res.send({status: "Branch is Diff", err: req.body.ref});
    }
    await stopServer();
    exec('git reset --hard HEAD', (err, stdout, stderr) => {
        if (err) return res.send({status: "Git reset error", err: err});
        if (stdout.indexOf("HEAD is now at") == -1 && stdout.indexOf("현재") == -1) {return res.send({status: "git reset error", stdout: stdout})};
        console.log(stdout);


        exec('git pull', async (err, stdout, stderr) => {
            if (err) {
                res.send({status: "GIT_PULL_ERR", err: err});
                console.log("git pull: ", err)
            } else {
                if (stdout.indexOf("Already up to date.") != -1 || stdout.indexOf("이미") != -1) {
                    console.log("Already up to date.");
                    return res.send({status: "NOTHING_TO_UPDATE"});
                }
                if (stdout.indexOf("Aborting") != -1) {
                    console.log("Git Pull Fail");
                    return res.send({status: "Git Pull Fail"});
                }
                else console.log(stdout);
    
                console.log("-------------- Server Restart --------------");

                
            console.log("-------------- Build Start --------------");
            let timer = Date.now();
            switch (process.platform) {
                case "win32": {

                    let build = exec('npm run winBuild', (err, stdout, stderr) => {
                        if (err) {
                            res.send({status: "BUILD_ERROR", err: err});
                            console.log("Build Error", err);
                            build.kill();
                            return;
                        }
                        console.log(`-------------- Build Sucess, ${process.platform}, executetime: ${Date.now()-timer}ms --------------`);
                        res.send({status: "BUILD_SUCESS"});

                        preparing = false;
                        startServer(process.platform);
                    });
                    break;

                }
                case "linux": {
                    
                    let build = exec('npm run build', (err, stdout, stderr) => {
                        if (err) {
                            res.send({status: "BUILD_ERROR", err: err});
                            console.log("Build Error", err);
                            build.kill();
                            return;
                        }
                        console.log(`-------------- Build Sucess, ${process.platform}, executetime: ${Date.now()-timer}ms --------------`);
                        res.send({status: "BUILD_SUCESS"});

                        preparing = false;
                        startServer(process.platform);
                    });
                    break;

                }
                default: console.log("This platform is not support!"); break;
            }
                console.log("-------------- Server Restart Finish --------------");
            }
        });

    });
}
// 웹훅테스트
app.post("/wh", async (req, res) => {
    Prepare(req, res);
});

app.listen(9800, async () => {
    await stopServer();
    startServer(process.platform);
    console.log("webhook server is open 9800");
})
