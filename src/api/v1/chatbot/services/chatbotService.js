const axios = require("axios")
const WeatherService = require("./weatherService")
const logger = require("../../../../utils/logger")

class ChatbotService {
    constructor(apiKey = null, model = null, systemPrompt = null) {
        this.apiKey = apiKey || process.env.CHATBOT_API_KEY
        this.model = model || process.env.CHATBOT_MODEL
        this.systemPrompt = systemPrompt || this._getAgricultureSystemPrompt()
        this.messages = []
        this.weatherService = new WeatherService()
    }

    /**
     * Mendapatkan system prompt untuk pertanian
     * Sesuai dengan _getAgricultureSystemPrompt() di Flutter
     */
    _getAgricultureSystemPrompt() {
        return [
            {
                role: "system",
                content: `
Kamu adalah Nita, asisten pertanian yang ramah dan bersahabat untuk aplikasi TaniPintar. Kamu adalah seorang ahli pertanian yang membantu petani Indonesia dengan gaya bicara yang santai dan personal.

ATURAN:
1. Selalu perkenalkan diri sebagai "Nita" dan gunakan bahasa yang santai seperti berbicara dengan teman.
2. Gunakan kata ganti "aku" untuk diri sendiri dan "kamu" untuk pengguna.
3. Tambahkan ekspresi dan emoji sesekali untuk membuat percakapan lebih hidup (😊, 👍, 🌱, 🌾, 🌿).
4. Fokus HANYA pada topik pertanian, perkebunan, dan peternakan.
5. Berikan saran praktis dan berbasis bukti tentang:
   - Teknik bertani dan berkebun
   - Pengelolaan lahan dan tanah
   - Pemilihan tanaman dan rotasi tanaman
   - Pengendalian hama dan penyakit tanaman
   - Irigasi dan pengelolaan air
   - Pemupukan dan nutrisi tanaman
   - Praktik pertanian berkelanjutan
   - Peternakan dan pengelolaan ternak
   - Teknologi pertanian dan smart farming
   - Pemasaran hasil pertanian
6. Gunakan bahasa yang sederhana dan santai seperti percakapan sehari-hari.
7. Berikan jawaban personal dan hangat, seolah-olah berbicara langsung dengan petani.
8. Jika ditanya tentang topik di luar pertanian, tolak dengan santai dan alihkan kembali ke topik pertanian.
9. Jika kamu tidak yakin, akui keterbatasan dengan jujur dan sarankan untuk bertanya ke ahli pertanian setempat.
10. Selalu pertimbangkan kondisi pertanian di Indonesia (iklim tropis, musim hujan/kemarau).
11. Prioritaskan metode ramah lingkungan dan berkelanjutan.

Kamu TIDAK BOLEH:
1. Memberikan saran medis untuk manusia
2. Membahas topik politik, agama, atau isu kontroversial
3. Memberikan informasi yang dapat membahayakan lingkungan atau kesehatan
4. Mempromosikan produk atau merek tertentu
5. Memberikan saran keuangan atau investasi di luar konteks pertanian

Selalu ingat bahwa tujuan kamu adalah menjadi teman petani yang membantu meningkatkan produktivitas, keberlanjutan, dan kesejahteraan mereka melalui praktik pertanian yang baik. Buat mereka merasa seperti berbicara dengan teman yang ahli pertanian, bukan dengan bot.
        `,
            },
        ]
    }

    /**
     * Mengecek apakah pesan berkaitan dengan cuaca
     * Sesuai dengan _isWeatherQuery() di Flutter
     */
    _isWeatherQuery(message) {
        const lowerMessage = message.toLowerCase()
        const weatherKeywords = [
            "cuaca",
            "hujan",
            "panas",
            "cerah",
            "mendung",
            "berawan",
            "suhu",
            "temperatur",
            "kelembaban",
            "angin",
            "prakiraan",
            "iklim",
            "musim",
            "kemarau",
            "penghujan",
        ]
        return weatherKeywords.some((keyword) => lowerMessage.includes(keyword))
    }

    /**
     * Mengekstrak nama kota dari pesan
     * Sesuai dengan _extractCity() di Flutter
     */
    _extractCity(message) {
        const lowerMessage = message.toLowerCase()

        const cityPatterns = [
            /di\s+([a-z]+)/,
            /untuk\s+([a-z]+)/,
            /kota\s+([a-z]+)/,
            /daerah\s+([a-z]+)/,
            /wilayah\s+([a-z]+)/,
        ]

        for (const pattern of cityPatterns) {
            const match = lowerMessage.match(pattern)
            if (match && match[1] && match[1].length > 2) {
                return match[1]
            }
        }

        const majorCities = [
            "jakarta",
            "surabaya",
            "bandung",
            "medan",
            "semarang",
            "makassar",
            "palembang",
            "tangerang",
            "depok",
            "bekasi",
            "yogyakarta",
            "denpasar",
            "bogor",
            "malang",
            "padang",
            "manado",
            "balikpapan",
            "banjarmasin",
        ]

        for (const city of majorCities) {
            if (lowerMessage.includes(city)) {
                return city
            }
        }

        return null
    }

    /**
     * Mengirim pesan ke chatbot
     * Sesuai dengan sendMessage() di Flutter
     */
    async sendMessage(message) {
        // Validasi API key
        if (!this.apiKey) {
            return "Maaf, konfigurasi API key belum diatur. Silakan periksa pengaturan aplikasi."
        }

        logger.chatbot(`Received message: ${message.substring(0, 100)}...`)
        this.messages.push({ role: "user", content: message })

        try {
            // Cek apakah pertanyaan tentang cuaca (sama seperti Flutter)
            if (this._isWeatherQuery(message)) {
                const city = this._extractCity(message) || "Jakarta"
                logger.chatbot(`Weather query detected for city: ${city}`)

                try {
                    const weatherData = await this.weatherService.getWeatherByCity(city)
                    const weatherInfo = this.weatherService.formatWeatherData(weatherData)
                    const forecastInfo = this.weatherService.formatForecastData(weatherData)

                    const weatherContext = `Berikut informasi cuaca terkini:
${weatherInfo}

${forecastInfo}`

                    const response = await axios.post(
                        "https://api.openai.com/v1/chat/completions",
                        {
                            model: this.model,
                            messages: [
                                ...this.systemPrompt,
                                ...this.messages,
                                { role: "system", content: weatherContext },
                                {
                                    role: "system",
                                    content:
                                        "Berikan saran pertanian berdasarkan kondisi cuaca di atas. Berikan saran yang spesifik untuk petani tentang apa yang sebaiknya dilakukan dengan tanaman mereka berdasarkan kondisi cuaca ini.",
                                },
                            ],
                            max_tokens: 500,
                            temperature: 0.7,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${this.apiKey}`,
                            },
                        },
                    )

                    if (response.status === 200) {
                        const assistantMessage = response.data.choices[0].message.content
                        this.messages.push({ role: "assistant", content: assistantMessage })
                        logger.chatbot(`Weather-based response sent successfully`)
                        return assistantMessage
                    }
                } catch (weatherError) {
                    logger.error(`Error getting weather data: ${weatherError.message}`)
                }
            }

            // Request normal ke OpenAI (sama seperti Flutter)
            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: this.model,
                    messages: [...this.systemPrompt, ...this.messages],
                    max_tokens: 500,
                    temperature: 0.7,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                },
            )

            if (response.status === 200) {
                const assistantMessage = response.data.choices[0].message.content
                this.messages.push({ role: "assistant", content: assistantMessage })
                logger.chatbot(`Normal response sent successfully`)
                return assistantMessage
            } else {
                logger.error(`OpenAI API error: ${response.status}`)
                return "Maaf, saya mengalami kesulitan untuk menjawab saat ini. Silakan coba lagi nanti."
            }
        } catch (error) {
            logger.error(`Chatbot error: ${error.message}`)
            error.source = "chatbot"
            return "Maaf, terjadi kesalahan. Silakan periksa koneksi internet Anda dan coba lagi."
        }
    }

    /**
     * Membersihkan riwayat percakapan
     * Sesuai dengan clearConversation() di Flutter
     */
    clearConversation() {
        this.messages = []
        logger.chatbot(`Conversation cleared`)
    }

    /**
     * Mengecek apakah service sudah dikonfigurasi dengan benar
     * Sesuai dengan isConfigured getter di Flutter
     */
    get isConfigured() {
        return this.apiKey && this.model
    }

    /**
     * Mendapatkan model yang sedang digunakan
     * Sesuai dengan currentModel getter di Flutter
     */
    get currentModel() {
        return this.model
    }
}

module.exports = ChatbotService
