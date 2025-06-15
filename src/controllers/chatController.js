const axios = require('axios')

const chatWithBot = async (req, res) => {
  const { message } = req.body

  try {
    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CHATBOT_API_KEY}`
        }
      }
    );

    const reply = result.data.choices[0].message.content
    res.json({ reply })
  } catch (error) {
    console.error(error.response?.data || error.message)
    res.status(500).json({ message: 'Chatbot gagal merespon' })
  }
}

module.exports = { chatWithBot }
