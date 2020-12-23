const geoip = require('geoip-country');
const Log = require('../log');

const BLACKLIST = ['CN', 'TW'];
const ALLOWLIST = ['KR'];

function BlockCountry(req, res, next) {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let geoipInfo = geoip.lookup(ip);

    if (geoipInfo != undefined && ALLOWLIST.indexOf(geoipInfo.country) == -1) {
        Log.writeLog("System", "BlockOtherCountry", `${geoipInfo.country} is Blocked By ExpreeMiddleWare`, ip);
        return res.send("Cannot Access the Web Page");
    } else {
        if (geoipInfo != undefined) Log.writeLog("System", "CountryInfo", `${geoipInfo.country}`, ip);
        return next();
    }
}

module.exports = BlockCountry;