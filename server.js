var express = require('express');
var cors = require('cors')
var app = express()


app.use(cors());
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.use(express.static(__dirname + '/'));



app.listen('3000');
console.log('working on 3000');
