const fetch = require("node-fetch");
const URL = "http://heavyrisem.kro.kr/getLog";
const KEY = "COIN";

function ParseDate(date) {
    let d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}`;
}

async function getServerResponse(URL) {
    let ServerResponse = await fetch(URL, {
        method: "POST",
        body: JSON.stringify({
            key: KEY
        }),
        headers: {'Content-Type': 'application/json'}
    });
    ServerResponse = await ServerResponse.json();


    ServerResponse.forEach(value => {
        console.log(`[${ParseDate(value.Date)}] [${value.Type}] [${value.Author}] ${value.Message}`);
    })
}


getServerResponse(URL);
