var express = require("express");
var app = express();
var MongoClient = require("mongodb").MongoClient;
var validUrl = require("valid-url");
var url = require('url');
var mongoUrl = process.env.MONGODB_URI;

function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    hostname: req.hostname
  });
}

app.use("/", express.static("public"));

app.get("/new/*", function(req, res) {
  var base = fullUrl(req);
  var uri = req.params[0];
  if (validUrl.isHttpUri(uri) || validUrl.isHttpsUri(uri)) {
    MongoClient.connect(mongoUrl, function(err, db) {
      var urls = db.collection("urls");
      urls.count(function(err, number) {
        var doc = {
          long: uri,
          short: number + 1
        };
        urls.insert(doc, function(err, data) {
          console.log("created new url for: \n" + uri + "\n at \n" + base + "/" + doc.short);
          res.end(JSON.stringify({
            original_url: uri,
            short_url: base + '/' + doc.short
          }))
          db.close();
        })
      })
    })
  } else {
    res.end("invalid url")
  }
})

app.get("/:number", function(req, res) {
  var number = req.params.number;
  MongoClient.connect(mongoUrl, function(err, db) {
    var urls = db.collection("urls");
    urls.find({
      short: Number(number)
    }).toArray(function(err, doc) {
      if (doc[0]) {
        var url = doc[0].long;
        console.log("redirecting to\n " + url)
        res.redirect(url);
      } else {
        res.end("invalid short url")
      }
    })
  })
})

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port ' + process.env.PORT);
})
