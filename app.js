const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const https = require('https');
const request = require('request');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

let route = {origin:"",destination:""};

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Sumi1030sql',
  database: 'MapImages'
});

app.get('/', (req, res) => {
  connection.query(
  'SELECT * FROM results',
  (error, result) => {
    res.render('top.ejs',{results: result});
    }
  );
});

app.get('/search', (req, res) => {
  res.render('search.ejs');
});

app.post('/result', (req, res) => {
  if(!req.body.origin || !req.body.destination){
    console.log("未入力の項目があります。");
    res.render('search.ejs');
  }
  route = {origin:req.body.origin,destination:req.body.destination};
  const URL = `https://maps.googleapis.com/maps/api/directions/json?origin="${route.origin}"&destination="${route.destination}"&key=API`;

  let data = [];
  let imageData =[];

  https.get(URL, function (response) {
    response.on('data', function(chunk) {
      data.push(chunk);
    }).on('end', function() {

      let events   = Buffer.concat(data);
      let r = JSON.parse(events);
      let count = 0;

      r.routes[0].legs[0].steps.forEach(target => {
          const imageURL = `https://maps.googleapis.com/maps/api/streetview?size=640x480&heading=180&fov=120&location=${target.end_location.lat},${target.end_location.lng}&sensor=false&key=API`;
          imageData.push({url: imageURL,
                          html: target.html_instructions,
                          id: 'image${count}'});
          count++;
        });
        count = 0;
        res.render('result.ejs',{images: imageData});
      });
  });
});

app.post('/save',(req,res) => {
  connection.query(
  'INSERT INTO results(origin,destination) VALUES (?,?)',
  [route.origin,route.destination],
  (error, result) => {
    if(error){
      console.log("error");
    }
    res.redirect('/');
    }
  );
});

app.post('/delete/:id', (req, res) => {
  connection.query(
    'DELETE FROM results WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.redirect('/');
    }
  );
});

connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success--------------------------------');
});

app.listen(3000);
