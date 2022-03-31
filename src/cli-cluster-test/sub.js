'use strict';
const Subscriber = require('../unix_tcp_subscriber.js');
const test = new Subscriber();
test.subscribe('111');
test.subscribe('222');
test.unsubscribe('111');
test.unsubscribe('222');
test.subscribe('test/path');
