const geoip = require('geoip-country');
const Log = require('../log');

const BLACKLIST = ['CN', 'TW'];
const ALLOWLIST = ['KR', '::ffff:35.237.4.214', '::ffff:35.196.132.85'];

function BlockCountry(req, res, next) {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let geoipInfo = geoip.lookup(ip);

    console.log(ip, typeof ip);
    if (ALLOWLIST.indexOf(ip) != -1) {
        Log.writeLog("System", "AllowOtherCountry", `${geoipInfo.country} is Allowed By ALLOWLIST`, ip);
        return next();
    }

    if (geoipInfo != undefined && ALLOWLIST.indexOf(geoipInfo.country) == -1) {
        Log.writeLog("System", "BlockOtherCountry", `${geoipInfo.country} is Blocked By ExpreeMiddleWare`, ip);
        return;
    } else {
        if (geoipInfo != undefined && geoipInfo.country != 'KR') Log.writeLog("System", "CountryInfo", `${geoipInfo.country}`, ip);
        return next();
    }
}

module.exports = BlockCountry;