/**
 * Created by Nemo on 15/4/14.
 */
var Client = require('./index');
var client = new Client('http://172.16.10.25:8888', 'sessionService');
client.rpcInvoke('checkToken', {access_token: '111'}).then(function (result) {
  console.log(arguments);
}, function (err) {
  console.error(err);
});