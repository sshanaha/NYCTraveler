const LIST_FIELDS = 'fsq_id,name,categories,location,description,website,price,rating,stats,photos';
const DETAILED_FIELDS = 'name,categories,location,description,tel,email,website,hours,hours_popular,price,rating,stats,photos,related_places,tips';
// A polygon I drew around NYC. The FourSquare API returns the context: {"geo_bounds":{"circle":{"center":{"latitude":40.70498915,"longitude":-73.9881134},"radius":34381}}}
const NYC_POLYGON = '40.9196742,-73.9197063~40.8373855,-73.9587593~40.7597406,-74.013176~40.6572015,-74.043045~40.6410515,-74.1920471~40.4903041,-74.2819977~40.5623296,-73.7141418~40.7498579,-73.6942291~40.8714685,-73.7488174~40.8943106,-73.8370514~40.9049502,-73.839798~40.9083234,-73.8545609~40.9010579,-73.8607407~40.9196742,-73.9197063';

if (typeof EdgeRuntime !== 'string') { // if the application is not being hosted on Vercel
  require('dotenv').config();
}

const fs = require('fs');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

const data = require('./data/featured.json');
const categories = ['food', 'parks', 'museums', 'theaters'];
const boroughs = {queens: 'Queens', manhattan: 'Manhattan', brooklyn: 'Brooklyn', bronx: 'The Bronx', si: 'Staten Island'};
const boroughKeys = Object.keys(boroughs);

const template = fs.readFileSync(__dirname + '/src/template.html').toString()
  .replace('{DROPDOWNS}', boroughKeys.map((borough, i) => `
    <ul id="dropdown${i}" class="dropdown-content">
      ${categories.map(cat => `<li><a href="/${cat}/${borough}">${toCaps(cat)}</a></li>`).join('')}
    </ul>
  `).join(''))
  // TODO: the dropdown needs to be fixed in mobile
  .replace('{DROPDOWN_MOBILE}', boroughKeys.map((key, i) => `<li><a class="dropdown-trigger" data-target="dropdown${i}">${boroughs[key]}</a></li>`).join(''));


app.get('/', async (req, res) => {
  return res.send(formatHTML('home'));
});
app.get('/about', async (req, res) => {
  return res.send(formatHTML('about'));
});
app.get('/search', async (req, res) => {
  return res.send(formatHTML('search'));
});

// Somehow the app won't host properly without this endpoint
app.get('/dir', async (req, res) => {
  return res.json({__dirname, files: fs.readdirSync(__dirname)});
});

// View featured places
app.get('/:category/:borough', async (req, res, next) => {
  if (!categories.includes(req.params.category) || !(req.params.borough in boroughs))
    return next();
  
  const results = data.filter(dest => dest.category === req.params.category && dest.borough === req.params.borough);
  return res.send(formatHTML('cards')
    .replace('{TITLE}', `${toCaps(req.params.category)} in ${boroughs[req.params.borough]}`)
    .replace('{CARDS}', results.map(res => `
      <div class="card" style="max-width: 600px;">
          <div class="card-image">
              <img class="img" src="${res.image}" />
              <span class="card-title">${res.title}</span>
          </div>
          <div class="card-content">
              <p>${res.desc}</p>
          </div>
          <div class="card-action">
              <a href="${res.ref.url}"> ${res.ref.label}</a>
          </div>
      </div>
    `).join('')));
});

// Using the FourSquare API
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({error: 'A search query is required. Example: GET /search?q=bronx+zoo'});
  if (query.toLowerCase() === 'bronx zoo') return res.sendFile(__dirname + '/data/fsq-example.json'), console.log('sending from disk cache');
  
  const params = {query, limit: 20, polygon: NYC_POLYGON, fields: LIST_FIELDS};
  for (const k in req.query) {
    const v = parseInt(req.query[k]);
    if (!v) continue;
    if (['min_price', 'max_price'].includes(k)) {
      if (v >= 1 && v <= 4) params[k] = v;
    }
  }
  
  try {
    const {results} = await requestFsq('search', params);
    res.json(results);
  }
  catch (error) {
    res.json({error});
  }
});

app.get('/place/:name/:id', async (req, res) => {
  // TODO: render the place's details as an HTML
  // generate :name using the fetched place.name.toLowerCase().match(/\w+/g).join('-')
  // if the result is different from the provided :name, redirect to use the correct name
  
  let place;
  if (req.params.id === '4492ad65f964a52075341fe3') place = require('./data/fsq-bronx-zoo.json');
  else place = await requestFsq(req.params.id, {fields: DETAILED_FIELDS});
  
  res.send(formatHTML('place').replace('{name}', place.name));
});

// This endpoint is only for testing purposes
app.get('/api/place/:id', async (req, res) => {
  if (req.params.id === '4492ad65f964a52075341fe3') return res.sendFile(__dirname + '/data/fsq-bronx-zoo.json');
  try {
    const place = await requestFsq(req.params.id, {fields: DETAILED_FIELDS});
    res.json(place);
  }
  catch (error) {
    res.json({error});
  }
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

function formatHTML(fileName) {
  return template.replace('{CONTENT}', fs.readFileSync(`${__dirname}/src/${fileName}.html`));
}

function toCaps(str) {
  return str.replace(/./, l => l.toUpperCase());
}

async function requestFsq(endpoint, params) {
  const res = await fetch(`https://api.foursquare.com/v3/places/${endpoint}?${new URLSearchParams(params)}`, {headers: {Authorization: process.env.FSQ_KEY}});
  if (res.ok) return res.json();
  throw await res.json();
}