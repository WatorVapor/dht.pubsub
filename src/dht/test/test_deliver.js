'use strict';
const DHTClient = require('../client.js');
const client = new DHTClient();
const deliverPayload = {
  channel:'aaa',
  msg:'hello world'
}
setTimeout(()=>{
  //const pid = client.pidOfMe();
  const pid = 'mfs6bsc2877wjbwqpazm5kyzk7k9342c';
  client.deliver(deliverPayload,pid);  
},1000);
