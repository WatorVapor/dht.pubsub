'use strict';
const DHTClient = require('../client.js');
const client = new DHTClient();
client.publish('aaa','hello world');
