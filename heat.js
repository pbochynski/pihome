var exec = require('child_process').exec;

// HEATER
//var ON = '1400588', OFF = '1400579';

//LAMP
var ON = '5304335', OFF = '5304327';


var CODESEND = 'sudo /home/pi/433Utils/RPi_utils/codesend ';

var current = null;
function heatOn() {
	codesend(ON);
}

function heatOff() {
	codesend(OFF);
}

function codesend(code) {
	console.log(code);
	if (current !== code) {
		current=code;
		exec(CODESEND + code, function (error) {
			if (error !== null) {
				console.error('exec error: ' + error);
			}
		});
	}
}


setInterval(function () {
	current = null
}, 600000);

exports.on = heatOn;
exports.off = heatOff;
