/**
 * Angular
 */
(function() {
	
	'use strict';

	angular
		.module('app', ['ngResource', 'luegg.directives'])
		.controller('AppController', AppController);

	AppController.$inject = ['$resource', '$interval'];

	function AppController($resource, $interval) {
		
		/**
		 * Resources
		 */
		var User = $resource(
				'/users/:user_id',
				{user_id: '@user_id'},
				{
					'me': {
				      url: '/users/me',
				      method: 'GET'
				    }
				}
			);
		var Conversation = $resource('/conversations/:conversation_id', {conversation_id: '@conversation_id'});
		var Message = $resource('/conversations/:conversation_id/messages', {conversation_id: '@conversation_id', message_id: '@message_id'});

		/**
		 * View Model
		 */
		var vm = this;
		vm.message = null;
		
		vm.users = null;
		vm.user = null;
		vm.me = null; // The currently authenticated user.

		vm.conversations = null;
		vm.conversation = null;
		vm.messages = null;

		vm.methods = ['Polling', 'Long Polling'];
		vm.method = 'Polling';

		/**
		 * Hold poll intervals
		 */
		var messagesPoller = null;

		vm.index = function(){
			// Get the current user.
			vm.getMe();

			// Get user's conversations with people.
			vm.getConversations();
		}

		/**
		 * Get the current user.
		 * @return {[type]} [description]
		 */
		vm.getMe = function(){
			User.me(
				{},
				function(response){
					vm.me = response;

					console.log('Got me:');
					console.log(vm.me);
				},
				function(error){
					console.log('Could not load authenticated user.');
				}
			);
		}

		/**
		 * Get conversations with people.
		 */
		vm.getConversations = function(){
			console.log('Getting conversations...');

			Conversation.query(
				{},
				function(response){
					console.log('Got conversations:');
					console.log(response);
					vm.conversations = response;

					// set first conversation as active
					vm.conversation = response[0];
					console.log('Conversation:');
					console.log(vm.conversation);

					// get messages of the conversation
					vm.getMessages(vm.conversation);

					// Start getting the conversation messages.
					
					switch(vm.method.toLowerCase()){
						case 'polling':
							pollMessages();
							break;
						case 'long polling':
							longPollMessages();
							break;
						default:
							pollMessages();
							break;
					}

				},
				function(error){
					console.log(error)
				}
			);
		}

		/**
		 * Get conversation messages.
		 */
		vm.getMessages = function(conversation){

			console.log('Getting conversation messages: ' + conversation);

			vm.conversation = conversation;

			Message.query(
				{ conversation_id: conversation.id },
				function(response){
					console.log('Got messages:');
					console.log(response);
					vm.messages = response;
				},
				function(error){
					console.log(error);
				}
			);
		}

		/**
		 * Send message to conversation.
		 */
		vm.sendMessage = function(form){
			if(form.$valid){
				console.log('Sending message...');

				Message.save(
					{
						conversation_id: vm.conversation.id,
						text: vm.message
					},
					function(response){
						vm.messages.push(response);
						vm.message = null

						console.log('Message sent:');
						console.log(response);
						console.log(vm.messages);
					},
					function(error){
						console.log(error);
					}
				);
			}
			else{
				console.log('Nothing to send...');
			}
		}

		/**
		 * Poll conversation messages.
		 */
		function pollMessages(){

			console.log("pollMessages() called...")

			// Poll interval rate in milliseconds
			var pollInterval = 2000;

			// Maximum poll interval
			var pollCount = 45;

			messagesPoller = $interval(function(){
				console.log('Polling messages...');

				Message.query(
					{ conversation_id: vm.conversation.id },
					function(response){
						console.log(response);
						vm.messages = response;
					},
					function(error){
						console.log(error);
					}
				);
			}, pollInterval, pollCount);
		}

		/**
		 * Long-poll conversation messages.
		 * @param  {timestamp} lastMessageTimestamp The timestamp of the last message.
		 */
		function longPollMessages(lastMessageTimestamp = null){

			console.log('Long polling messages... ' + lastMessageTimestamp);

			Message.query({
					conversation_id: vm.conversation.id,
					timestamp: lastMessageTimestamp
				},
				function(response){
					console.log(response);
					vm.messages = response;

					// Set new timestamp from the last message.
					var lastMessageTimestamp = response[response.length - 1].created_at;

					console.log('lastMessageTimestamp:');
					console.log(lastMessageTimestamp);

					if(vm.method.toLowerCase() == 'long polling')
						longPollMessages(lastMessageTimestamp);
				},
				function(error){
					console.log(error);
				}
			);
		}

		/**
		 * Update settings.
		 */
		vm.updateSettings = function(){

			console.log('Updating settings...');

			console.log(messagesPoller);

			// cancel any running poll.
			if(messagesPoller != null)
				if($interval.cancel(messagesPoller))
					console.log('Polling stopped...');

			// Get messages and use selected method.
			switch(vm.method.toLowerCase()){
				case 'polling':
					pollMessages();
					break;
				case 'long polling':
					longPollMessages();
					break;
				default:
					pollMessages();
					break;
			}

		}
		
	} // End of AppController

})();