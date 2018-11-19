var express = require('express');
var cors = require('cors')
var app = express()


// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;



app.use(cors());
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.use(express.static(__dirname + '/'));



app.listen(port);
console.log('working on 80');
