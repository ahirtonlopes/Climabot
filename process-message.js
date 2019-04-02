const Dialogflow = require('dialogflow');
const Pusher = require('pusher');
const getWeatherInfo = require('./weather');

// Você pode encontrar seu ID de projeto nas configurações do agente Dialogflow
const projectId = 'ID de projeto DialogFlow'; //https://dialogflow.com/docs/agents#settings
const sessionId = '123456';
const languageCode = 'pt-BR';

const config = {
  credentials: {
    private_key: process.env.DIALOGFLOW_PRIVATE_KEY,
    client_email: process.env.DIALOGFLOW_CLIENT_EMAIL,
  },
};

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  encrypted: true,
});

const sessionClient = new Dialogflow.SessionsClient(config);

const sessionPath = sessionClient.sessionPath(projectId, sessionId);

const processMessage = message => {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode,
      },
    },
  };

  sessionClient
    .detectIntent(request)
    .then(responses => {
      const result = responses[0].queryResult;

      // Se a intenção corresponder a 'cidade detectada'
      if (result.intent.displayName === 'detect-city') {
        const city = result.parameters.fields['geo-city'].stringValue;

        // busca a temperatura no openweathermap
        return getWeatherInfo(city).then(temperature => {
          return pusher.trigger('bot', 'bot-response', {
            message: `A temperatura em ${city} é de ${temperature}°C`,
          });
        });
      }

      return pusher.trigger('bot', 'bot-response', {
        message: result.fulfillmentText,
      });
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
};

module.exports = processMessage;
