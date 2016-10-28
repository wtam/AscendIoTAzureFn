module.exports = function(context, req) {
    context.log('Node.js HTTP trigger function processed a request. RequestUri=%s', req.originalUrl);

var IotHubClient = require('azure-iothub').Client;

var connectionString = `HostName=${process.env.IOTHUB_HOSTNAME};SharedAccessKeyName=iothubowner;SharedAccessKey=${process.env.IOTHUBOWNER_SHAREDACCESSKEY}`

var printError = function (err) {
  context.log(err.message);
};

//var printMessage = function (message) {
  //console.log('Message received from: ', message.body.deviceId);
  //context.log('Message received: ');
  //context.log(JSON.stringify(message.body));
  //context.log('');
  //return messagesArray.push[message.body];
//}; 

var messageList = []

var appendMessageToList = function (response) {
    messageList.push(response.body)
    return true;
}

var client = IotHubClient.fromConnectionString(connectionString);
var _receiver = null

var closeClientAndCompleteContext = function(client) {
    client.close();
    context.done();
}

client.open()
    .then(client.getPartitionIds.bind(client))
    .then(function (partitionIds) {
        return partitionIds.map(function (partitionId) {
            return client.createReceiver(process.env.MESSAGE_POLL_CONSUMERGROUP, partitionId).then(function(receiver) {                                                                        //read from 100 sec ago
            //return client.createReceiver('$Default', partitionId, { 'startAfterTime' : req.body.reqTimestamp}).then(function(receiver) {
                //console.log('Created partition receiver: ' + partitionId)
                _receiver= receiver;
                setTimeout(function() {
                    context.res = {
                        status: 201,
                        body: JSON.stringify({'messages': messageList})
                    }
                    var messageCompleted = 0;
                    var hasError = false 
                    
                    for (message in messageList) {
                        if (hasError) break
                        receiver.complete(message, function(err) {
                            if (err) {
                                context.log("Error occurred in mark message complete", message, err)
                                hasError = true 
                                context.res = {
                                    status: 500,
                                    body: JSON.stringify({
                                        'error': err                                        
                                    })
                                }                                
                                closeClientAndCompleteContext(client)
                            }
                            else if (!hasError) {
                                messageCompleted++
                                if (messageCompleted == messageList.length)
                                closeClientAndCompleteContext(client)                                  
                            }
                        })         
                    }
               
                }, 5000)
                receiver.on('errorReceived', printError);
                receiver.on('message', appendMessageToList);
                
            });
        });
    })
    .catch(printError);

};