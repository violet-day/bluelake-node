/**
 * Created by Nemo on 15/4/14.
 */
var Client = require('./index');
var sessionService = new Client('http://172.16.10.25:8888', 'sessionService');
sessionService.rpcInvoke('checkToken', {access_token: 'cb59967b-cad0-4359-bd2a-8e3221aee331'}).then(function (result) {
  console.log(arguments);
}, function (err) {
  console.error(err);
});