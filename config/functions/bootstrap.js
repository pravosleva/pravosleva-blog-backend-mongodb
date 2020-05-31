'use strict';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/3.0.0-beta.x/configurations/configurations.html#bootstrap
 */

// const geoip = require('geoip-lite')
const users = new Map()

module.exports = cb => {
  var io = require('socket.io')(strapi.server)

  // Listen for user connection
  io.on('connection', function(socket){
    const clientIp = socket.request.connection.remoteAddress
    const clientId = socket.id

    users.set(clientId, clientIp)
    socket.broadcast.emit('SOMEBODY_CONNECTED', { msg: `${clientId} connected. Total connected users: ${users.size}` })

    // Send message on user connection
    socket.emit('HELLO', { msg: `hello socket, your ID is ${clientId}, your IP is ${clientIp}` })

    socket.on('reconnect', (attemptNumber) => {
      socket.broadcast.emit('SOMEBODY_RECONNECTED', { msg: `${clientId} reconnected ${attemptNumber}, has users= ${users.has(clientId)}. Total connected users: ${users.size}` })
    });
    // Listen for user diconnect
    socket.on('disconnect', (socket) => {
      console.log(socket)
      users.delete(clientId)
      io.emit('SOMEBODY_DISCONNECTED', { msg: `${clientId} disconnected. Total connected users: ${users.size}` })
    })
  })
  strapi.io = io // register socket io inside strapi main object to use it globally anywhere
  if (cb) cb()
};
