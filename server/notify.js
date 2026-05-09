const https = require('https');

function sendNotification(message) {
  const options = {
    hostname: 'ntfy.sh',
    port: 443,
    path: '/mabuyustreet-orders',
    method: 'POST',
    headers: {
      'Title': 'New Order - Mabuyu Street',
      'Priority': 'urgent',
      'Tags': 'bell'
    }
  };

  const req = https.request(options, (res) => {
    console.log('Notification sent:', res.statusCode);
  });

  req.on('error', (e) => {
    console.error('Notification error:', e);
  });

  req.write(message);
  req.end();
}

module.exports = sendNotification;
