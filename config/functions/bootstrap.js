'use strict';
const geoip = require('geoip-lite');

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/3.0.0-beta.x/configurations/configurations.html#bootstrap
 */

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

const getObjectByMap = (map) => {
  const result = Object.create(null)

  map.forEach((value, key, map) => {
    if (value instanceof Map) {
      result[key] = getObjectByMap(value)
    } else {
      if (isJsonString(JSON.stringify(value))) {
        result[key] = { ...value }
      } else {
        result[key] = value
      }
    }
  })
  return result
}
const users = new Map()

module.exports = cb => {
  var io = require('socket.io')(strapi.server)

  // Listen for user connection
  io.on('connection', function(socket){
    const clientIp = socket.request.connection.remoteAddress
    const clientId = socket.id

    // console.log(socket.request.connection._peername.address)
    // console.log(socket.ipAddress)

    users.set(clientId, { ip: clientIp, geo: geoip.lookup(clientIp) })
    socket.broadcast.emit('SOMEBODY_CONNECTED', { msg: `${clientId} connected, his remoteAddress= ${socket.request.connection.remoteAddress}, ip= ${socket.request.connection._peername.address}`, users: getObjectByMap(users) })

    // Send message on user connection
    socket.emit('HELLO', { msg: `Hello, your ID is ${clientId}, your IP is ${clientIp}`, users: getObjectByMap(users) })

    socket.on('reconnect', (attemptNumber) => {
      socket.broadcast.emit('SOMEBODY_RECONNECTED', { msg: `${clientId} reconnected ${attemptNumber}, has users= ${users.has(clientId)}`, users: getObjectByMap(users) })
    });
    // Listen for user diconnect
    socket.on('disconnect', (socket) => {
      console.log(socket)
      users.delete(clientId)
      io.emit('SOMEBODY_DISCONNECTED', { msg: `${clientId} disconnected`, users: getObjectByMap(users) })
    })
  })
  strapi.io = io // register socket io inside strapi main object to use it globally anywhere
  if (cb) cb()
};
