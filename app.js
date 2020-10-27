const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const https = require('https');
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

let route = {origin:"",destination:""};

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
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
  route = {origin:req.body.origin,destination:req.body.destination};
  const URL = `https://maps.googleapis.com/maps/api/directions/json?origin="${route.origin}"&destination="${route.destination}"&key=API`;

  let data = [];
  let steps =[];

  https.get(URL, function (response) {
    response.on('data', function(chunk) {
      data.push(chunk);
    }).on('end', function() {
      let routeJson = JSON.parse(Buffer.concat(data));
      let idCount = 0;

      routeJson.routes[0].legs[0].steps.forEach(target => {
        const url = `https://maps.googleapis.com/maps/api/streetview?size=320x240&heading=180&fov=120&location=${target.end_location.lat},${target.end_location.lng}&sensor=false&key=API`;
        steps.push({url: url,
                    html: target.html_instructions,
                    id: 'image${idCount}'});
        idCount++;
      });

      idCount = 0;
      res.render('result.ejs',{images: steps});
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

connection.connect((error) => {
  if (error) {
    console.log('error connecting: ' + error.stack);
    return;
  }

  console.log('success');
});

app.listen(3000);
