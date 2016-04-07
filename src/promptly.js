'use strict';

var APP_ID = "amzn1.echo-sdk-ams.app.be7fd8db-c74b-4daf-94ba-34ef03977529";
var http = require( 'http' );
var AlexaSkill = require('./AlexaSkill');
var urlPrefix = 'http://echoserver.azureedge.net/promptly/';

var Promptly = function() {
    AlexaSkill.call(this, APP_ID);
};

Promptly.prototype = Object.create(AlexaSkill.prototype);
Promptly.prototype.constructor = Promptly;


Promptly.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Promptly onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    session.attributes.requestInfo = {};
};

Promptly.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Promptly onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);

    getWelcomeResponse(response);
};

Promptly.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

Promptly.prototype.intentHandlers = {

    //done
    "GetNewestPromptIntent": function (intent, session, response) {
        handleGetNewestPromptRequest(intent, session, response);
    },

    //done
    "GetPreviousPromptIntent": function (intent, session, response) {
        handleGetPreviousPromptRequest(intent, session, response);
    },

    "GetRandomPromptIntent": function (intent, session, response) {
        handleGetRandomPromptRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechOutput = "Promptly lets me jump start your creativity by providing you with weekly writing prompts from Writer's Digest. " +
            "Just tell me if you want to hear the current prompt, the previous prompt, or a random prompt. You can also say never mind to exit. " + 
            "So, which prompt will it be?";
        var repromptOutput = "Which prompt can I get for you?";
        var cardTitle = "About Promptly Skill";
        var cardContent = speechOutput;

        response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Closing Promptly. You can find your retrieved prompts in the Echo app.";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Closing Promptly. You can find your retrieved prompts in the Echo app.";
        response.tell(speechOutput);
    }
};

function getWelcomeResponse(response) {
       
    var repromptOutput = "You can use Promptly to get the Writer's Digest weekly writing prompts. " +
            "Ask for the most recent prompt, the previous prompt, or say surprise me for a random prompt. " + 
            "You may also say never mind to exit. So, which prompt can I get for you?";
    var speechOutput = "I have opened Promptly. Which prompt can I get for you?";

    response.ask(speechOutput, repromptOutput);
}

function handleGetNewestPromptRequest(intent, session, response, url) {
    
    url = url || urlPrefix;

    http.get( url, function( res ) {
        
        var data = '';
        
        res.on( 'data', function( d ) { data += d; } );

        res.on( 'end', function() {

            if (data != " ") {
                
                data = JSON.parse(data);
                session.attributes.requestInfo = data;
                
                var speechPrefix = "Your writing prompt is, " + data.title + ". " + data.body;
                
            //   var speechOutput = {
            //         "outputSpeech": {
            //             "type": "SSML",
            //             "ssml": "<speak>" + speechPrefix + "<break time='3s'/> A copy of this prompt can be found in the Echo app. Happy writing!</speak>"
            //         }
            //     };
                 
                var speechOutput =  "Your writing prompt is, " + data.title + ". " + data.body + 
                        ". A copy of this prompt can be found in the Echo app. Happy writing!";
                var cardTitle = "Writing Prompt for the Week of "+ data.postDate +": " + data.title;
                var cardContent = data.body;
                var repromptOutput = "You can use Promptly to get the Writer's Digest weekly writing prompts. " +
                        "Ask for the most recent prompt, the previous prompt, or say surprise me for a random prompt. " ;
                            
                
                response.tellWithCard(speechOutput, cardTitle, cardContent);
                
                
            } else {
                response.tell("I'm sorry. There was a problem retrieving the requested writing prompt. Please try again later.");
            }
                    
        });
        
    });

}

function handleGetPreviousPromptRequest(intent, session, response) {

    var url = urlPrefix + "/previous";
    handleGetNewestPromptRequest(intent, session, response, url);

}

function handleGetRandomPromptRequest(intent, session, response) {
    
    var pageCount = countPromptPages();
    var randomPage = getRandomInt(1,pageCount);
    var randomIndex = getRandomInt(1,25);
    var url = urlPrefix + "/random/"+randomPage+"/"+randomIndex;

    handleGetNewestPromptRequest(intent, session, response, url);

    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function countPromptPages() {

      var first = 2011; //July 6, 2011
      var today = new Date().getFullYear();

      // Calculate the difference in milliseconds
      var weeksPassed = Math.abs(today - first)*52;
      var pageCount = Math.round(weeksPassed/25);

      return pageCount;

    }

}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var promptly = new Promptly();
    promptly.execute(event, context);
};