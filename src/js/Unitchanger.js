class UnitChangerAPI {
	ByteCal(bytes) {
		var bytes = parseInt(bytes);
		var s = ["bytes", "KB", "MB", "GB", "TB", "PB", "ZB", "HB"];

		var e = Math.floor(Math.log(bytes) / Math.log(1024));

		if (e == "-Infinity") return "0 " + s[0];
		else return (bytes / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
	}
	
	Killo(number) {
		number = parseInt(number);
		let names = ["백", "천", "만", "백만", "억", "백억", "조", "백조", "경", "백경", "해"];
		
		let e = Math.floor(Math.log(number) / Math.log(100));
		// if (e >= 2) e = 1; 
		
		if (e == "-Infinity") return "0 " + names[0];
		else return (number / Math.pow(100, Math.floor(e))).toFixed(2) + "" + names[e];
	}

	Comma(number) {
		number = number.toString();
		var tmp = number.split(".");
		number = tmp[0].split(/(?=(?:...)*$)/);
		number = number.join(",");
		if (tmp.length > 1) number = number +"."+ tmp[1];
		return number;
	}
}

// module.exports = new UnitChangerAPI();
export default new UnitChangerAPI();