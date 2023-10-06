const express = require("express");
const cors = require("cors");
const app = express();
const socket = require("socket.io");
require("dotenv").config();


app.use(cors());
app.use(express.json());
const port = 8080;

const server = app.listen(8080, () =>
  console.log('Server started on 5000')
);

app.get("/", (req, res) => {
  res.send("Hey this is my API running1 🥳");
});

const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

let onlineUsersArray = [];
const NEW_CHAT_GROUP_MESSAGE_EVENT = "newChatGroupMessage"

io.on("connection", (socket) => {
  socket.on("add-user", (userId) => {
    if (!onlineUsersArray.some((user) => user.userId === userId)) {
      onlineUsersArray.push({
        userId,
        socketId: socket.id,
      });
    }
    console.log('getOnlineUsers: ', onlineUsersArray);
    io.emit("getOnlineUsers", onlineUsersArray);
    io.emit("user-status-change", { userId, status: true });

    console.log('userId-' + userId + ': ', socket.id);
  });

  // socket.on("disconnect", () => {
  //   onlineUsersArray = onlineUsersArray.filter((user) => user.socketId !== socket.id);
  //   io.emit("getOnlineUsers", onlineUsersArray);
  // });

  socket.on("disconnect", () => {
    // Handle disconnecting online users
    onlineUsersArray = onlineUsersArray.filter((user) => user.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsersArray);

    // Handle leaving a group (if applicable)
    if (groupId) {
      console.log(`Client ${socket.id} disconnected from group ${groupId}`);
      socket.leave(groupId);
    } else {
      console.log(`Client ${socket.id} disconnected`);
    }
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsersArray.find((user) => user.userId === data.to);

    console.log('receiver-' + data.to + ': ', sendUserSocket); //reciever socketid

    if (sendUserSocket) {
      const message = {
        sender: socket.id,
        receiver: data.to,
        content: data.msg,
        timestamp: new Date(),
      };

      socket.to(sendUserSocket.socketId).emit("msg-recieve", message);
      console.log('msg: ', message);
    }
  });

  socket.on('typing', (typingUsers) => {
    socket.broadcast.emit('typingResponse', typingUsers);
    console.log('typingUsers: ', typingUsers);
  });

  // Group chat code
  const { groupId } = socket.handshake.query;
  socket.join(groupId);

  socket.on(NEW_CHAT_GROUP_MESSAGE_EVENT, (data) => {
    io.in(groupId).emit(NEW_CHAT_GROUP_MESSAGE_EVENT, data);
    console.log('groupMessage: ', data);
  });

  // socket.on("disconnect", () => {
  //   console.log(`Client ${socket.id} disconnected`);
  //   socket.leave(groupId);
  // });
  //end group chat

  
});
