"use strict";

let PubNub = require('pubnub');

let map = (service, channel, config) => {

    this.service = service;

    // initialize RLTM with pubnub keys
    this.pubnub = new PubNub(config);

    let readyFired = false; 

    let onReady = () => {};
    let onJoin = () => {};
    let onLeave = () => {};
    let onTimeout = () => {};

    this.ready = (fn) => {
        onReady = fn;
    };

    this.join = (fn) => {
        onJoin = fn;
    }

    this.leave = (fn) => {
        onLeave = fn;
    }

    this.timeout = (fn) => {
        onTimeout = fn;
    }

    this.subscribe = (fn) => {

        this.pubnub.addListener({

            status: (statusEvent) => {

                if (statusEvent.category === "PNConnectedCategory") {
                    
                    if(!readyFired) {
                        onReady();
                        readyFired = true;   
                    }

                }

            },
            message: (m) => {
                fn(m.message);
            }
        });

        this.pubnub.subscribe({ 
            channels: [channel],
            withPresence: true
        });

    };

    this.publish = (message) => {
        
        this.pubnub.publish({
            channel: channel,
            message: message
        });

    };

    this.hereNow = (cb) => {
        
        this.pubnub.hereNow({
            channels: [channel],
            includeUUIDs: true,
            includeState: true
        }, (status, response) => {

            if(!status.error) {

                var userList = {};
                
                for(var i in response.channels[channel].occupants) {
                    userList[response.channels[channel].occupants[i].uuid] = response.channels[channel].occupants[i].state;
                }

                cb(userList);

            } else {
                console.log(status, response);
            }

        });

    }

    this.pubnub.addListener({
        presence: (presenceEvent) => {

            if(presenceEvent.action == "join") {
                
                onJoin({
                    uuid: presenceEvent.uuid, 
                    state: presenceEvent.state
                });

            }
            if(presenceEvent.action == "leave") {
                onLeave(presenceEvent.uuid);
            }
            if(presenceEvent.action == "timeout") {
                onTimeout(presenceEvent.uuid);
            }
            if(presenceEvent.action == "state-change") {

                if(this.users[presenceEvent.uuid]) {
                    // this.users[presenceEvent.uuid].update(presenceEvent.state);
                } else {
                    // onJoin({
                    //     uuid: presenceEvent.uuid, 
                    //     state: presenceEvent.state
                    // });
                }

            }

        }
    });

    return this;

};

module.exports = map;
