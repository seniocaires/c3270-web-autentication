var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');
var server = require('socket.io');
var pty = require('pty.js');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var Client = require('node-rest-client').Client;

var opts = require('optimist')
    .options({
        sslkey: {
            demand: false,
            description: 'path to SSL key'
        },
        sslcert: {
            demand: false,
            description: 'path to SSL certificate'
        },
        sshhost: {
            demand: false,
            description: 'ssh server host'
        },
        sshport: {
            demand: false,
            description: 'ssh server port'
        },
        sshuser: {
            demand: false,
            description: 'ssh user'
        },
        sshauth: {
            demand: false,
            description: 'defaults to "password", you can use "publickey,password" instead'
        },
        port: {
            demand: true,
            alias: 'p',
            description: 'wetty listen port'
        },
    }).boolean('allow_discovery').argv;

var runhttps = false;
var sshport = 22;
var sshhost = 'localhost';
var sshauth = 'password';
var globalsshuser = '';

if (opts.sshport) {
    sshport = opts.sshport;
}

if (opts.sshhost) {
    sshhost = opts.sshhost;
}

if (opts.sshauth) {
	sshauth = opts.sshauth
}

if (opts.sshuser) {
    globalsshuser = opts.sshuser;
}

if (opts.sslkey && opts.sslcert) {
    runhttps = true;
    opts['ssl'] = {};
    opts.ssl['key'] = fs.readFileSync(path.resolve(opts.sslkey));
    opts.ssl['cert'] = fs.readFileSync(path.resolve(opts.sslcert));
}

process.on('uncaughtException', function(e) {
    console.error('Error: ' + e);
});

var httpserv;

var app = express();
app.use(cookieParser());

function autenticacao(req,res,next){

    var client = new Client();
    var args = {
        headers: {[process.env.AUTORIZACAO_NOME_HEADER]: (req.cookies[[process.env.AUTORIZACAO_NOME_TOKEN]] === undefined || req.cookies[[process.env.AUTORIZACAO_NOME_TOKEN]] === null ? "" : req.cookies[[process.env.AUTORIZACAO_NOME_TOKEN]]) }
    };

   client.get(process.env.AUTORIZACAO_URL_PERMISSAO, args, function (data, response) {
       if (response.statusCode !== 200) {
           console.log("Autorizacao Status Code:", response.statusCode, ":::", "Autorizacao Status Message:", response.statusMessage, ":::", "Token:", req.cookies[[process.env.AUTORIZACAO_NOME_TOKEN]], ":::", "Redirecionado para:", process.env.AUTORIZACAO_URL_PERMISSAO_NEGADA);
           res.redirect(process.env.AUTORIZACAO_URL_PERMISSAO_NEGADA);
       } else {
           next();
       }
   });
}

app.get(process.env.CONTEXTO + '/wetty/ssh/:user', function(req, res) {
    res.sendfile(__dirname + '/public/wetty/index.html');
});

app.use(process.env.CONTEXTO, autenticacao, express.static(path.join(__dirname, 'public'))
);

if (runhttps) {
    httpserv = https.createServer(opts.ssl, app).listen(opts.port, function() {
        console.log('https on port ' + opts.port);
    });
} else {
    httpserv = http.createServer(app).listen(opts.port, function() {
        console.log('http on port ' + opts.port);
    });
}

var io = server(httpserv,{path: process.env.CONTEXTO + '/wetty/socket.io'});
io.on('connection', function(socket){
    var sshuser = '';
    var request = socket.request;
    console.log((new Date()) + ' Connection accepted.');
    if (match = request.headers.referer.match(process.env.CONTEXTO + '/wetty/ssh/.+$')) {
        sshuser = match[0].replace(process.env.CONTEXTO + '/wetty/ssh/', '') + '@';
    } else if (globalsshuser) {
        sshuser = globalsshuser + '@';
    }

    var term;
    term = pty.spawn('sshpass', ['-p', process.env.SENHA, 'ssh', process.env.USUARIO + '@localhost'], {
        name: 'xterm-256color',
        cols: 80,
        rows: 30
    });
    console.log((new Date()) + " PID=" + term.pid + " STARTED on behalf of user=" + process.env.USUARIO)
    term.on('data', function(data) {
        socket.emit('output', data);
    });
    term.on('exit', function(code) {
        console.log((new Date()) + " PID=" + term.pid + " ENDED")
    });
    socket.on('resize', function(data) {
        term.resize(data.col, data.row);
    });
    socket.on('input', function(data) {
        term.write(data);
    });
    socket.on('disconnect', function() {
        term.end();
    });
})
