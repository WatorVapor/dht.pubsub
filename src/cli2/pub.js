'use strict';
const Publisher = require('../unix_tcp_publisher.js');
const test = new Publisher();
test.publish('111','bbbb');
test.publish('111','ccc');
test.publish('111','dd');
test.publish('111','ee');
test.publish('111','ff');
test.publish('222','aa');
setInterval(()=>{
  test.publish('test/path',(new Date()).toISOString());
},1000*5);
