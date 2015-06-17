/**
 * Created by Nemo on 15/4/14.
 */
var Client = require('./index');
var sessionService = new Client('http://172.16.10.25:8888', 'sessionService');
sessionService.rpcInvoke('checkToken', {access_token: '621a4ef5-8592-432e-af9e-727472706223'}).then(function (result) {
  console.log(result);
}, function (err) {
  console.error(err);
});