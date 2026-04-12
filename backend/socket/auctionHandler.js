const Message = require('../models/Message');

module.exports = (io, socket) => {
  console.log(`User connected to socket: ${socket.id}`);

  // Join a personal notification room (so we can send order updates to a specific user)
  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user room: ${userId}`);
  });

  // Join a specific auction room
  socket.on('join-auction', (listingId) => {
    socket.join(`auction:${listingId}`);
    console.log(`Socket ${socket.id} joined auction room: auction:${listingId}`);
  });

  // Leave a specific auction room
  socket.on('leave-auction', (listingId) => {
    socket.leave(`auction:${listingId}`);
  });

  // ---- Live Messaging ----
  socket.on('join-chat', ({ myId, otherId }) => {
    // Create a deterministic room name so both users join the same room
    const roomId = [myId, otherId].sort().join('-');
    socket.join(`chat:${roomId}`);
    console.log(`Socket ${socket.id} joined chat room: chat:${roomId}`);
  });

  socket.on('send-message', async ({ senderId, receiverId, text, senderName }) => {
    try {
      // Persist message to DB
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        text,
        read: false
      });
      await message.save();

      const roomId = [senderId, receiverId].sort().join('-');
      // Broadcast to both users in the chat room
      io.to(`chat:${roomId}`).emit('receive-message', {
        _id: message._id,
        sender: { _id: senderId, name: senderName },
        receiver: { _id: receiverId },
        text,
        read: false,
        createdAt: message.createdAt
      });

      // Also notify receiver's personal room (for unread badge)
      io.to(`user:${receiverId}`).emit('new-message-notification', {
        senderId,
        senderName,
        text
      });
    } catch (err) {
      console.error('Error saving message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
};
