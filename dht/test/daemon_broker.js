'use strict';
const Broker = require('../broker.js');
const dht_port = 1234;
const dht_port_data = dht_port + 1;

const dht_config = {
  entrances: [
    {
      host:'ermu4.wator.xyz',
      portc:dht_port,
      portd:dht_port_data,
    },
    {
      host:'ermu3.wator.xyz',
      portc:dht_port,
      portd:dht_port_data,
    },
  ],
  reps: {
    dht:`/dev/shm/dht.pubsub`
  },
  portc:dht_port,
  portd:dht_port_data,
  trap:true
};
const broker = new Broker(dht_config);
