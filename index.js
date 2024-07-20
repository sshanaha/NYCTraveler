const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
const NAV = fs.readFileSync(__dirname + '/nav.html');

const data = require('./data.json');
const categories = ['food', 'parks', 'museums', 'theatres'];
const boroughs = ['queens', 'manhattan', 'brooklyn', 'bronx', 'si'];

app.get('/', async (req, res) => {
  return res.send(formatHTML('/home.html'));
});

app.get('/dir', async (req, res) => {
  return res.json({__dirname, files: fs.readdirSync(__dirname)});
});

app.get('/:category/:borough', async (req, res) => {
  if (!categories.includes(req.params.category) || !boroughs.includes(req.params.borough))
    return res.sendStatus(400);
  
  const results = data.filter(dest => dest.category === req.params.category && dest.borough === req.params.borough);
  return res.send(formatHTML('/template-cards.html')
    .replace('{TITLE}', `${toCaps(req.params.category)} in ${req.params.borough === 'si' ? 'Staten Island' : toCaps(req.params.borough)}`)
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
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

function formatHTML(file) {
  return fs.readFileSync(__dirname + file).toString().replace('{NAV}', NAV);
}

function toCaps(str) {
  return str.replace(/./, l => l.toUpperCase());
}