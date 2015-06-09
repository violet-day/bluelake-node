/**
 * Created by Nemo on 15/4/14.
 */
var Client = require('./index');
var sessionService = new Client('http://172.16.10.25:8888', 'sessionService');
sessionService.rpcInvoke('checkToken', {access_token: 'ad415cff-1a3a-43c5-90a4-ff96a0b05b42'}).then(function (result) {
  console.log(result);
}, function (err) {
  console.error(err);
});