/**
 * Created by Nemo on 15/4/14.
 */
var assert = require('assert');
var uuid = require('uuid');
var request = require('request');
var Q = require('q');
var logger = require('log4js').getLogger('bluelake');
var prettyHrtime = require('pretty-hrtime');

const CURRENT_VERSION = 1;
const DEFAULT_FORMAT = "JSON";

const TYPE_SYNC_REQUEST = 1;
const TYPE_SYNC_RESPONSE = 2;

/**
 * 正常返回，data内容为返回值
 */
const RESPONSE_CODE_OK = "200";
/**
 * 正常返回null，data可忽略
 */
const RESPONSE_CODE_OK_NULL = "200.0";
/**
 * 客户端发出了错误的请求，客户端将抛出BadRequestException
 */
const RESPONSE_CODE_BAD_REQUEST = "400";
/**
 * 客户端请求的服务无法找到，客户端将跑出ServiceNotFoundException
 */
const RESPONSE_CODE_SERVICE_NOT_FOUND = "404";
/**
 * 服务端处理请求时，抛出了一个服务异常，此异常是接口约定的一种场景，不是未知异常。 客户端将重新拼装这个异常，并抛出去。
 */
const RESPONSE_CODE_SERVICE_ERROR = "500";
/**
 * 服务器处理请求时，遇到了意外的情况，抛出了不在接口约定范围内的异常。 由于并非接口约定，该异常的类型可能无法在客户端复现。
 * 客户端将统一重组一个SystemException抛出去。
 */
const RESPONSE_CODE_SYSTEM_ERROR = "503";

const UNKNOW_ERROR = 'Blue Lake UnKnow Error';

var RpcClient = function (url, service, timeout) {
  assert(url);
  assert(service);
  this.url = url;
  this.service = service;
  this.timeout = timeout || 20000;
};

RpcClient.prototype.rpcInvoke = function (method, argMap) {
  assert(typeof method == 'string', 'method must be string');
  assert(typeof argMap == 'object', 'argMap must be an object');
  for (var key in argMap) {
    argMap[key] = JSON.stringify(argMap[key]);
  }
  var deferred = Q.defer();
  var self = this;
  var blpBody = {
    version: CURRENT_VERSION,
    format: DEFAULT_FORMAT,
    type: TYPE_SYNC_REQUEST,
    requestId: uuid.v4(),
    content: JSON.stringify({
      service: self.service,
      method: method,
      argMap: argMap
    })
  };
  var startAt = process.hrtime();
  request({
    url: self.url,
    method: 'POST',
    timeout: self.timeout,
    followRedirect: false,
    headers: {
      'User-Agent': 'Bluelake Nodejs Client',
      'Connection': false
    },
    json: true,
    body: blpBody
  }, function (err, response, body) {
    var data;
    if (err) {
      err.statusCode = 500;
      return deferred.reject(err);
    }
    if (response.statusCode === 200) {
      try {
        var content = JSON.parse(body.content);
        data = JSON.parse(content.data);

        switch (content.code) {
          case RESPONSE_CODE_OK:
            deferred.resolve(data);
            break;
          case RESPONSE_CODE_OK_NULL:
            deferred.resolve(null);
            break;
          case RESPONSE_CODE_BAD_REQUEST:
            err = new Error(data._message || UNKNOW_ERROR);
            err.name = 'RESPONSE_CODE_BAD_REQUEST';
            err.statusCode = 400;
            err.rowData = data;
            deferred.reject(err);
            break;
          case RESPONSE_CODE_SERVICE_NOT_FOUND:
            err = new Error(data._message || UNKNOW_ERROR);
            err.name = 'RESPONSE_CODE_SERVICE_NOT_FOUND';
            err.statusCode = 404;
            err.rowData = data;
            deferred.reject(err);
            break;
          case RESPONSE_CODE_SERVICE_ERROR:
            err = new Error(data._message || UNKNOW_ERROR);
            err.name = 'RESPONSE_CODE_SERVICE_ERROR';
            err.statusCode = 500;
            err.rowData = data;
            deferred.reject(err);
            break;
          case RESPONSE_CODE_SYSTEM_ERROR:
            err = new Error(data._message || UNKNOW_ERROR);
            err.name = 'RESPONSE_CODE_SYSTEM_ERROR';
            err.statusCode = 503;
            err.rowData = data;
            deferred.reject(err);
            break;
        }
      } catch (ex) {
        err = ex;
        err.statusCode = 500;
        deferred.reject(err);
      }
    } else {
      err = new Error(UNKNOW_ERROR);
      err.rowData = body;
      err.statusCode = 500;
      deferred.reject(err);
    }
    var endAt = process.hrtime(startAt);
    logger.info('requestId:%s,[%s.%s],%s', blpBody.requestId, self.service, method, prettyHrtime(endAt));
    logger.info('requestId:%s,request:%j', blpBody.requestId, argMap);
    if (err) {
      logger.error('requestId:%s,error:%s', blpBody.requestId, JSON.stringify(err));
    } else {
      logger.info('requestId:%s,response:%j', blpBody.requestId, data);
    }
  });
  return deferred.promise;
};

module.exports = RpcClient;