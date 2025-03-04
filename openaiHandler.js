const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: 'TU_CLAVE_DE_API', // Reemplaza con tu clave de OpenAI
});

const openai = new OpenAIApi(configuration);

async function generateResponse(prompt) {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error al generar respuesta:', error);
    return 'Lo siento, ocurrió un error al procesar tu solicitud.';
  }
}

module.exports = { generateResponse };
