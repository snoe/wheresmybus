var express = require('express')
var db = require('./redis').db


var app = express.createServer()
app.use(express.bodyDecoder())

app.get('/', function(req, res) {
    res.render('index.html.ejs');
});

app.post('/rider/new', function(req, res) {
    var sub = req.body;
    saveRider(sub, function(err, reply) {
        allRiders(sub, function(results) {
            res.send(JSON.stringify(results));
        });
    });
});

app.get('/riders', function(req, res) {
    var sub = req.query;
    allRiders(sub, function(results) {
        res.send(JSON.stringify(results));
    });
});

var allRiders = function(sub, callback) {
    var searchkey = ['*', sub.city, '*', '*'].join(':');
    db.keys(searchkey, function(err, keys) {
        console.log(err, keys);
        if (keys.length) {
            db.mget(keys, function(err, subs) {
                console.log(err, subs);
                subs = subs || [];
                var data = subs.map(JSON.parse);  
                callback(data);
            });
        } else {
            callback([]);
        }
    }); 
}

var saveRider = function(sub, callback) {
    db.incr('seq:id', function(err, id) {
        sub.time = new Date();
        if (sub.status == 'riding') {
            var key = ['riders', sub.city, sub.route, id].join(':');
        } else {
            var key = ['waiters', sub.city, sub.route, id].join(':');
        }
        db.setex(key, 60*60*2, JSON.stringify(sub), callback);
        wsapp.broadcast(JSON.stringify(sub));
    });
}

var ws = require('websocket-server')
var wsapp = ws.createServer()
wsapp.addListener('connection', function(conn) {
    conn.addListener('message', function(msg) {
        var sub = JSON.parse(msg);
        saveRider(sub, function(err, reply) { });
    });
});

wsapp.listen(9999);
app.listen(3000);
