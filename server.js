var express = require("express");
var app = express();
var MongoClient = require("mongodb").MongoClient;
var validUrl = require("valid-url");
var mongoUrl = process.env.MONGODB_URI;
console.log(process.env.MONGODB_URI);

app.use("/", express.static("public"));

app.get("/new/*", function(req, res) {
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
          console.log("created new url for: \n" + uri + "\n at \n" + doc.short);
          res.end(JSON.stringify({
            original_url: uri,
            short_url: doc.short
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
      short: "https://fcc-api-projects-wztan.c9users.io/little-url/" + number
    }).toArray(function(err, doc) {
      var url = doc[0].long;
      console.log("redirecting to\n " + url)
      res.redirect(url);
    })
  })
})

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port ' + process.env.PORT);
})
