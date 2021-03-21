'use strict';
const DHTClient = require('../client.js');
const client = new DHTClient();
const deliverPayload = {
  channel:'aaa',
  msg:'hello world'
}
setTimeout(()=>{
  const pid = client.pidOfMe();
  client.deliver(deliverPayload,pid);  
},1000);
