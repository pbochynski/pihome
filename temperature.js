var ds18b20 = require('ds18b20');
var RADIATOR = '28-031467bacdff';
var ROOM = '28-0115621a55ff';
var heat = require('./heat');
var request = require('request');
//var host = 'https://api.yaas.io/smart/home/v1';
//var host = 'https://api.yaas.io/michalmuskala/smarthome/v1';
var host = 'https://api.yaas.io/kgtest/smarthomekg/v1';
var NodeCache = require('node-cache');
var myCache = new NodeCache({stdTTL: 3000, checkperiod: 120});
var config = require('config');
var ip = require("ip");


var sensors = {};
sensors[ROOM] = 22.7;
sensors[RADIATOR] = 44.3;

function readSensors(){
  ds18b20.sensors(function (err, ids) {
    if (err) {
      console.error(err);
      return;
    }
    ids.forEach(function (id) {
          setInterval(function () {
            readTemp(id);
          }, 10000);
        }
    );
  });
}


function readTemp(id) {
  ds18b20.temperature(id, function (err, value) {
    if (err) {
      return console.error(err);
    }
    sensors[id] = value;
  });
}

function heater() {
  token(function(err, token){
    request.get(host + '/heater', {auth:{bearer:token}}, function (err, resp, body) {
      if (err) return;
      var heater = JSON.parse(body);
        if (heater.enabled) {
          heat.on();
        } else {
          heat.off();
        }
    });
  });
}


function sendSensors() {
  token(function(err,token){
    if (err) {
      return console.error(err);
    }
    var array = [];
    for (var key in sensors) {
      if (sensors.hasOwnProperty(key)) {
        array.push({id: key, value: sensors[key]});
      }
    }
    request.post(host + '/sensors', {auth:{bearer: token}, json: {sensors: array,ip:ip.address()}}, function (err, resp) {
      if (err) {
        return console.error(err);
      }
      if (resp.statusCode !== 200) {
        return console.error("Sensors not send. Response code %s", resp.statusCode);
      }
    });

  });

}


function token(callback) {
  var token = myCache.get('token');
  if (token) {
    return callback(null, token);
  }
  request.post(config.get('oauth.tokenUrl'),
      {
        form: {
          client_id: config.get('oauth.client_id'),
          client_secret: config.get('oauth.client_secret'),
          grant_type: 'client_credentials'
        }
      },
      function (error, response, body) {
        if (error) {
          console.error(error);
          return callback(error);
        } else {
          var token = JSON.parse(body).access_token;

          console.log("token:"+body);
          myCache.set("token", token);
          callback(null, token);
        }
      });
}

console.log( ip.address() );

setInterval(heater, 1000);

//readSensors();

setInterval(sendSensors, 5000);

