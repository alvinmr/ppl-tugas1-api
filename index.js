const express = require('express');
const app = express();
const {createClient} = require('@supabase/supabase-js');
// import { createClient } from '@supabase/supabase-js'

app.use(express.json());
const PORT = process.env.PORT || 3000;
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Route untuk menghitung akar kuadrat
app.get('/api/sqrt', async (req, res) => {
  // get number from query string
  const number = parseFloat(req.query.number);

  // continue with your code logic
  const client = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_KEY ?? '', {
    auth : {
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
  // get number from query string
  const number = parseFloat(req.query.number);
  const client = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_KEY ?? '', {
    auth : {
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

// Jalankan server pada port 3000
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
});


module.exports = app;