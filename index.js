const axios = require('axios');
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

app.use(express.json());
const PORT = process.env.PORT || 3000;
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Route untuk menghitung akar kuadrat
app.get('/api/sqrt', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // get number from query string
  const number = parseFloat(req.query.number);

  // continue with your code logic
  const client = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_KEY ?? '', {
    auth: {
      persistSession: false,
    }
  })

  if (!Number.isFinite(number) || number < 0) {
    return res.status(400).json({ error: 'Input tidak valid, harus berupa angka dan bilangan bulat' });
  }

  const start = performance.now();
  const epsilon = 0.0001;
  let guess = number / 2;
  let nextGuess = (guess + (number / guess)) / 2;

  while (Math.abs(guess - nextGuess) > epsilon) {
    guess = nextGuess;
    nextGuess = (guess + (number / guess)) / 2;
  }
  const end = performance.now();

  await client.from('sqrt_number').insert({
    number: number,
    sqrt: guess,
    execution_time: end - start
  }).then(res => {
    console.log(res)
  }).catch(err => {
    res.status(400).json({ error: err });
  })

  res.json({
    data: {
      number,
      sqrt: guess,
      time: end - start
    }
  });
});

app.get('/api/sql/sqrt', async (req, res) => {
  // verify jwt token
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // get number from query string
  const number = parseFloat(req.query.number);
  const client = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_KEY ?? '', {
    auth: {
      persistSession: false,
    }
  })

  // supabase call procedure
  const { data, error } = await client.rpc('count_sqrt', { n: number })
  if (error) {
    return res.status(400).json({ error: error });
  }

  res.json({
    data: data
  });
});


// login
app.post('/api/login', async (req, res) => {
  // fetch call post url
  const nim = req.body.nim;
  const formData = new FormData();
  formData.append('username', nim);

  const regexUsername = /<td width="100px">Username<\/td>.*?<td width="10px">:<\/td>.*?<td>(.*?)<\/td>/s;
  const regexName = /<td>Name<\/td>.*?<td>:<\/td>.*?<td>(.*?)<\/td>/s;
  const regexEmail = /<td>Email<\/td>.*?<td>:<\/td>.*?<td>(.*?)<\/td>/s;

  await axios.post('https://imissu.unud.ac.id/Home/getUserLupaPassword', formData).then(response => {
    const html = response.data;
    const usernameMatch = html.match(regexUsername);
    const nameMatch = html.match(regexName);
    const emailMatch = html.match(regexEmail);

    const username = usernameMatch && usernameMatch[1];
    const name = nameMatch && nameMatch[1];
    const email = emailMatch && emailMatch[1];

    // make jwt token
    var token = jwt.sign({
        username: username,
        name: name,
        email: email
      }, process.env.JWT_SECRET ?? 'mysecret', { expiresIn: '1h' });

    res.json({
      data: {
        username: username,
        name: name,
        email: email,
        token: token
      }
    });
  }).catch(err => {
    res.status(400).json({ error: err });
  })
});

// get user
app.get('/api/user', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  jwt.verify(token, process.env.JWT_SECRET ?? 'mysecret', function (err, decoded) {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({
      data: decoded
    });
  });
});

// Jalankan server pada port 3000
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
});



module.exports = app;