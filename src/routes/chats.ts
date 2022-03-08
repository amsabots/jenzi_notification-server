import { firebase_db } from "../config/firebase";
import { set, ref, update, get } from "firebase/database";
import express from "express";
import randomgen from "randomstring";
import { AMQPConnection, ChatMessage, constants } from "../config";

const router = express.Router();

const create_chat_room = (partyA: string, partyB: string) => {
  return new Promise((res, rej) => {
    try {
      const chatroomId = randomgen.generate({ charset: "hex" });
      set(ref(firebase_db, `chatrooms/${partyA}/${chatroomId}`), {
        partyB,
      });
      set(ref(firebase_db, `chatrooms/${partyB}/${chatroomId}`), {
        partyB: partyA,
      });
      res("done");
    } catch (error) {
      rej(error);
    }
  });
};

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

router.post("/chat-room", async (req, res) => {
  const { partyA, partyB } = req.body;
  //check if chatroom exists
  const check_if_exist = await get(ref(firebase_db, `chatrooms/${partyA}`));
  if (!check_if_exist.exists()) await create_chat_room(partyA, partyB);
  else {
    const obj = check_if_exist.toJSON();
    const is_found = Object.values(obj!).filter((el) => el.partyB === partyB);
    if (!is_found.length) await create_chat_room(partyA, partyB);
  }
  return res.send("Chat room has been created");
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
