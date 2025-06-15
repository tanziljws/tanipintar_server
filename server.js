require('dotenv').config()
const app = require('./app')
const db = require('./config/db')

const PORT = process.env.PORT || 4000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})
