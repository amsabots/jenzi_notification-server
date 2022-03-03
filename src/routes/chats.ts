import { firebase_db } from "../config/firebase";
import { set, ref, update } from "firebase/database";
import express from "express";
import randomgen from "randomstring";
import { AMQPConnection, ChatMessage, constants } from "../config";

const router = express.Router();

const message_template = (
  partyA: string,
  partyB: string,
  message: String,
  type = "message"
) => {
  return <Partial<ChatMessage>>{
    source: partyA,
    destination: partyB,
    message,
    messageId: randomgen.generate({ charset: "hex" }),
    tag: type,
    createdAt: new Date().getTime(),
    delivered: false,
    sent: false,
  };
};

router.post("/chat-room", (req, res) => {
  const { partyA, partyB } = req.body;
  const chatroomId = randomgen.generate({ charset: "hex" });
  set(ref(firebase_db, `chatrooms/${partyA}/${chatroomId}`), {
    partyB,
  });
  set(ref(firebase_db, `chatrooms/${partyB}/${chatroomId}`), {
    partyB: partyA,
  });
  res.send("Chat room has been created");
});

router.delete("/chat-room/:userId/:chatroomId", (req, res) => {
  const { userId, chatroomId } = req.params;
  update(ref(firebase_db, `chatrooms/${userId}/${chatroomId}`), {
    deleted: true,
  });
  res.send("chatroom deleted");
});

router.post("/chats", (req, res) => {
  const { queues, keys } = constants;
  AMQPConnection.getInstance().channel.publish(
    queues.app_exchange,
    keys.incoming_messages_key,
    Buffer.from(JSON.stringify(req.body))
  );
  res.send("Message sent");
});

router.put("/chats", (req, res) => {
  const { queues, keys } = constants;
  AMQPConnection.getInstance().channel.publish(
    queues.app_exchange,
    keys.update_messages_key,
    Buffer.from(JSON.stringify(req.body))
  );
  res.send("Message sent");
});

export { router as ChatRouter };
