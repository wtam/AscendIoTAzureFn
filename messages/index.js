module.exports = function(context, req) {
  //context.log('Node.js HTTP trigger function processed a request. RequestUri=%s', req.originalUrl);
  context.log('Node.js HTTP trigger function processed a request. DeviceID=%s DeviceKey=%s',req.body.deviceId, req.body.deviceKey);

  ///var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;
  var clientFromConnectionString = require('azure-iot-device-http').clientFromConnectionString;

  var Message = require('azure-iot-device').Message;

  var connectionString = `HostName=${process.env.IOTHUB_HOSTNAME};DeviceId=${req.body.deviceId};SharedAccessKey=${req.body.deviceKey}`  
 
  var client = clientFromConnectionString(connectionString);
  var messageSent = false;

  var connectCallback = function (err) {
    if (err) {
      context.log('Could not connect: ' + err);
    } else {
      context.log('Client connected');

      // Create a message and send it to the IoT Hub
      var msg = new Message(JSON.stringify({ deviceId: req.body.deviceId, Data: req.body.deviceMessage}));
      client.sendEvent(msg, function (err) {
        if (err) {
          console.log(err.toString());
        } else {
          context.log('Message sent');
          messageSent = true;
          context.res = {
                status: 201,
                body: JSON.stringify({Data: req.body.deviceMessage + ' from ' + req.body.deviceId + ' sent successfully'})
            }
            context.done();
        };
      });
    }
  };
  client.open(connectCallback);
  //if (messageSent) {client.disconnect()}
};