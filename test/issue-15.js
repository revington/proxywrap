'use strict';
/* related to issue https://github.com/findhit/proxywrap/issues/15 */
var http = require('http'),
    assert = require('assert'),
    net = require('net'),
    exec = require('child_process').exec,
    child,
    proxiedHttp = require('..').proxy(http, {
        strict: false
    });

function findCloseWaitConnections(port, callback) {
    var child = exec('netstat -tonp | grep 8000 | grep CLOSE_WAIT',
        function (err, stdout, stderr) {
            if (err) {
                return callback(err);
            }
            return callback(null, stdout);
        });
}

describe('Sockets closed before any write #15', function () {
    var port, server;

    before(function (done) {
        var socket;
        server = proxiedHttp.createServer(function handler(req, res) {
            throw new Error('For this test socket should not call #write()');
        }).listen(function (err) {
            if (err) {
                return done(err);
            }
            port = this.address().port;
            socket = net.connect({
                port: port
            }, function () {
                socket.end();
            });
            socket.on('end', function () {
                done();
            });
        });
    });
    after(function () {
        server.close();
    });
    it('should be restored', function (done) {
        findCloseWaitConnections(port, function (err, stdout) {
            assert.deepEqual(null, stdout);
            return done();
        });
    });
});
