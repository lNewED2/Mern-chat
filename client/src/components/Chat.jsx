import { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../context/UserContext";
import axios from "axios";
import Logo from "./Logo";
import Contact from "./Contact";
import { uniqBy } from "lodash";
const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [message, setMessage] = useState([]);
  const [newMessageText, setNewMessageText] = useState({});
  const { username, id, setUsername, setId } = useContext(UserContext);

  //this useEffect for connectWebSocket
  useEffect(() => {
    connectToWs();
  }, [selectedUserId]);
  const connectToWs = () => {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage); //in this line if someone want to message it will be handleMessage in line 28
    ws.addEventListener("close", () => {
      console.log("Disconnected. Trying to reconnect.");
      setTimeout(() => connectToWs(), 1000);
    });
  };

  //this function for message
  const handleMessage = (e) => {
    const messageData = JSON.parse(e.data);
    if ("online" in messageData) {
      //this line
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      if (messageData.sender === selectedUserId) {
        setMessage((prev) => [...prev, { ...messageData }]);
      }
    }
  };
  const showOnlinePeople = (peopleArray) => {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  };

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id != id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      console.log("offline people");
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];

  const logout = () => {
    axios.post("/logout").then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  };

  const sendMessage = (e, file = null) => {
    if (e) e.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
        file,
      })
    );
    if (file) {
      axios.get("/message/" + selectedUserId).then((res) => {
        setMessage(res.data);
      });
    } else {
      setNewMessageText("");
      setMessage((prev) => [
        ...prev,
        {
          text: newMessageText,
          sender: id,
          recipient: selectedUserId,
          _id: Date.now(),
        },
      ]);
    }
  };
  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessage(res.data);
      });
    }
  }, [selectedUserId]);

  const messageWithoutDups = uniqBy(message, "_id");

  const sendFile = (e) => {
    const reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
      sendMessage(null, { name: e.target.files[0].name, data: reader.result });
    };
  };

 
  return (
    <div className="flex h-screen">
      <div className="bg-gray-200 w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo />
          {Object.keys(onlinePeople).map((userId) => (
            <Contact
              key={userId}
              username={onlinePeople[userId]}
              id={userId}
              online={true}
              selected={userId === selectedUserId}
              onClick={() => setSelectedUserId(userId)}
            />
          ))}
          {Object.keys(offlinePeople).map((userId) => (
            <Contact
              key={userId}
              username={offlinePeople[userId].username}
              id={userId}
              online={false}
              selected={userId === selectedUserId}
              onClick={() => setSelectedUserId(userId)}
            />
          ))}
        </div>
        <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 text-sm text-gary-600 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-5"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z"
                clipRule="evenodd"
              />
            </svg>
            {username}
          </span>
          <button
            className="text-sm bg-blue-200 py-1 px-2 text-gray-400 border rounded-xl"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex flex-col bg-blue-100 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-300">
                &larr; เลือกผู้คนแชทกันเถอะ"_"
              </div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messageWithoutDups.map((message) => (
                  <div
                    key={message._id}
                    className={
                      message.sender === id ? "text-right" : "text-left"
                    }
                  >
                    <div
                      className={
                        "text-left inline-block p-2 my-2 rounded-md text-sm " +
                        (message.sender === id
                          ? "bg-blue-600 text-gray-300"
                          : "text-gray-600 bg-blue-100")
                      }
                    >
                      {message.text}
                      {message.file && (
                        <div>
                          {/* Display file */}
                          <img
                            src={
                              axios.defaults.baseURL +
                              "/uploads/" +
                              message.file
                            }
                            alt="File"
                            className="max-w-64 h-auto max-h-64" // ปรับขนาดตามความต้องการ
                          />
                          <a
                            href={
                              axios.defaults.baseURL +
                              "/uploads/" +
                              message.file
                            }
                            className="flex item-center gap-1 border-b"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                              />
                            </svg>
                            {message.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <form className="flex gap-2" onSubmit={sendMessage}>
          <input
            type="text"
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Type your message"
            className="bg-white flex-grow border rounded-lg p-2"
          />
          <label className="bg-blue-200 p-2 text-gray-600 cursor-pointer rounded-xl border-blue-200">
            <input type="file" className="hidden" onChange={sendFile}/>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z"
                clipRule="evenodd"
              />
            </svg>
          </label>
          <button
            type="submit"
            className="bg-blue-500 p2 text-white rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
