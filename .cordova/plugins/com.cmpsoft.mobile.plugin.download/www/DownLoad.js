cordova.define("com.cmpsoft.mobile.plugin.download.DownLoad", function(require, exports, module) { /**
 * Created with JetBrains WebStorm.
 * User: cmpsoft
 * Date: 13-11-11
 * Time: 下午5:47
 * To change this template use File | Settings | File Templates.
 */
/**
 * 文件下载插件
 * @return
 */
var DownLoad = function() {};
/**
 * 发送系统通知栏消息
 * @param url 文件下载服务器地址(必填)
 * @param fileName 下载文件名(必填)
 * @param openFlag 下载完成后是否打开文件(必填,true打开,false不打开)
 * @param [successCallback] 成功回调函数
 * @param [failureCallback] 失败回调函数
 *
 */
DownLoad.prototype.downLoad = function(url,fileName,openFlag,successCallback, failureCallback) {
    if(typeof(cordova)!='undefined'){
        return cordova.exec(function(obj){
            if(successCallback == null ) return;
            if(typeof successCallback == 'function'){
                successCallback(obj);
            }
        }, function(obj){
            if(failureCallback == null ) return;
            if(typeof failureCallback == 'function'){
                failureCallback(obj);
            }
        },  'DownLoad', 'DownLoad', [url,fileName,openFlag]);
    }
};
var download = new DownLoad();

module.exports = download;
});
