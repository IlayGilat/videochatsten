import React, { useRef } from "react";
import Router, { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import AgoraRTM from "agora-rtm-sdk";

import {
  encode as encode_arr,
  insertflag,
  decode as decode_arr,
  next_signed,
  next,
  distance,
} from "../../lib/sten.js";
import {
  generateRsaPair,
  exportCryptoKey,
  importCryptoKey,
  rsa_encrypt,
  rsa_decrypt,
} from "../../lib/rsa_handler.js";

import { AGORA_ID } from "../../lib/base";
const rsa_pair = await generateRsaPair();
console.log(`rsa_pair ${rsa_pair}`);
let uid = String(Math.floor(Math.random() * 10000));
const token = null;
let client;
let channel;

let remote_track;

//test

let current_hash_str = "";
let remote_hash_str = "";
let isRemotePublicKeyExists = false;
let remote_public_key;
let receivingM = "";
let receivingStr = "";
let isReceivingFrame = false;

const width = 300;
const height = 225;
const canvas1 = document.createElement("canvas");
const canvas2 = document.createElement("canvas");
let inputCtx = canvas1.getContext("2d");
let localStream;
let remoteStream;
let stenStream;
let peerConnection;
const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
let dataChannel;
let isDataChannelOpen = false;
const VideoChat = () => {
  const { query } = useRouter();
  const [id, setId] = useState();
  const [chatMessage, SetChatMessage] = useState("");
  const [chat, setChat] = useState([
    ["First Message", true],
    ["Second Message", false],
    ["Third Message", false],
    ["4th Message", true],
  ]);
  useEffect(() => {
    setId(query.id);
    id ? init() : null;
  }, [query, id]);
  let init = async () => {
    client = await AgoraRTM.createInstance(AGORA_ID);
    await client.login({ uid, token });

    channel = client.createChannel(id);
    await channel.join();

    channel.on("MemberJoined", handleUserJoined);
    channel.on("MemberLeft", handleUserLeft);

    client.on("MessageFromPeer", handleMessageFromPeer);
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        frameRate: { exact: 20 },
      },
      audio: false,
    });

    document.getElementById("user-1").srcObject = localStream;
    document.getElementById("user-1").onclick = grabFrame;

    /*document.getElementById("edited-stream").srcObject = canvas2.captureStream();*/
    stenStream = localStream; //canvas2.captureStream();
  };

  let handleUserLeft = (MemberId) => {
    //Handle When User left
  };
  let grabFrame = () => {
    let imageCap = new ImageCapture(remoteStream.getVideoTracks()[0]);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    imageCap.grabFrame().then((imageBitmap) => {
      console.log("Grabbed frame: ", imageBitmap);
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      context.drawImage(imageBitmap, 0, 0);
      const data = context.getImageData(0, 0, 50, 50).data;
      const rgbaArr = [];
      for (let i = 0; i < data.length; i += 4) {
        const rgba = {
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
          a: data[i + 3],
        };
        rgbaArr.push(rgba);
      }
      console.log(rgbaArr);
    });
  };
  let handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message.text);
    if (message.type === "offer") {
      createAnswer(MemberId, message.offer);
    }
    if (message.type === "answer") {
      addAnswer(message.answer);
    }
    if (message.type === "candidate") {
      if (peerConnection) {
        peerConnection.addIceCandidate(message.candidate);
      }
    }
  };
  let handleUserJoined = async (MemberId) => {
    console.log("A new user joined the channel: ", MemberId);
    createOffer(MemberId);
  };

  let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById("user-2").srcObject = remoteStream;

    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      document.getElementById("user-1").srcObject = localStream;
    }

    stenStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stenStream);
    });

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      remote_track = true;
    };

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        client.sendMessageToPeer(
          {
            text: JSON.stringify({
              type: "candidate",
              candidate: event.candidate,
            }),
          },
          MemberId
        );
      }
    };

    /*
    setInterval(() => {
      grabFrame();
    }, 50);
    */

    //create data channel (initiator)
    dataChannel = peerConnection.createDataChannel("sten");

    dataChannel.onerror = (error) => {
      console.log("Data Channel Error:", error);
      isDataChannelOpen = false;
    };

    dataChannel.onmessage = (event) => {
      onmessageHandler(event);
    };
    dataChannel.onopen = async () => {
      console.log("dataChannel Open");
      dataChannel.send(await exportCryptoKey(rsa_pair.publicKey));
      isDataChannelOpen = true;
    };
    dataChannel.onclose = () => {
      console.log("The Data Channel is Closed");
      isDataChannelOpen - false;
    };
  };

  let createOffer = async (MemberId) => {
    await createPeerConnection(MemberId);
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    client.sendMessageToPeer(
      { text: JSON.stringify({ type: "offer", offer: offer }) },
      MemberId
    );
    //second user (reciever)
    peerConnection.ondatachannel = async (event) => {
      dataChannel = event.channel;
      dataChannel.onmessage = (event) => {
        console.log("im inside dataChannel.onmessage");
        onmessageHandler(event);
      };
      dataChannel.onclose = () => {
        console.log("The Data Channel is Closed");
        isDataChannelOpen = false;
      };
      dataChannel.onerror = (error) => {
        console.log("Data Channel Error:", error);
        isDataChannelOpen = false;
      };
      isDataChannelOpen = true;
      dataChannel.send(await exportCryptoKey(rsa_pair.publicKey));
    };
  };

  let createAnswer = async (MemberId, offer) => {
    await createPeerConnection(MemberId);

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    client.sendMessageToPeer(
      { text: JSON.stringify({ type: "answer", answer: answer }) },
      MemberId
    );
  };

  let addAnswer = async (answer) => {
    if (!peerConnection.currentRemoteDescription) {
      peerConnection.setRemoteDescription(answer);
    }
  };

  let beforeFirstTime = true;
  let onmessageHandler = async (event) => {
    switch (event.data) {
      case "start-frame":
        isReceivingFrame = true;
        break;
      case "end-frame":
        if (beforeFirstTime) {
          document.getElementById("sten-remote").srcObject =
            canvas3.captureStream();
          beforeFirstTime = false;
        }

        isReceivingFrame = false;
        let frameData = str2frame(receivingStr, width, height);
        let arr = frameData.data;
        let return_obj = decode_arr(arr, current_hash_str);
        if (return_obj == "-1") {
          console.log("return_obj error");
          return -1;
        }
        remoteCtx.putImageData(frameData, 0, 0);
        receivingM += return_obj.str;
        receivingStr = "";
        break;
      case "end-message":
        //console.log("final message:",receivingM)

        ///here need to take the massage from recieveingM before its gone
        let convoTextarea = document.getElementById("callTextarea");
        convoTextarea.value += "RemoteSrc:\n" + receivingM + "\n";

        receivingM = "";
        break;

      default:
        //check remote public key
        if (
          /^(-----BEGIN PUBLIC KEY-----\n)/.test(event.data) &&
          /(\n-----END PUBLIC KEY-----)$/.test(event.data)
        ) {
          remote_public_key = await importCryptoKey(event.data);
          current_hash_str = makeid(16);
          await dataChannel.send(
            "---string---" +
              (await rsa_encrypt(remote_public_key, current_hash_str))
          );
          isRemotePublicKeyExists = true;
          break;
        }
        if (/^---string---/.test(event.data)) {
          remote_hash_str = await rsa_decrypt(
            rsa_pair.privateKey,
            event.data.substring(12, event.data.length)
          );
          //console.log("remote_hash_str", remote_hash_str)
        }

        if (isReceivingFrame) {
          receivingStr = receivingStr + event.data;
        }
        break;
    }
  };

  //let isSent = false;

  let leaveChannel = async () => {
    await channel.leave();
    await channel.logout();
  };

  const canvas3 = document.createElement("canvas");
  let remoteCtx = canvas3.getContext("2d");

  //this is the sender, gets text and send the text via embedded frames to the user
  let sendMessage = async (text) => {
    let index = 0;
    let encode_res;
    let temp_text = text;
    let first_time = true;
    let id = 0;
    let part = 0;
    do {
      await sleep(60);
      inputCtx.drawImage(
        document.getElementById("user-1"),
        0,
        0,
        width,
        height
      );
      let pixelData = inputCtx.getImageData(0, 0, width, height);
      let arr = pixelData.data;
      encode_res = encode_arr(arr, temp_text, id, part, remote_hash_str);
      if (encode_res == -1) {
        continue;
      }
      index++;
      temp_text = encode_res.str;
      part++;
      id = encode_res.id;
      await sendFrame(arr, dataChannel);
    } while (temp_text != "");

    await dataChannel.send("end-message");
    let convoTextarea = document.getElementById("callTextarea");

    //writes the user part
    convoTextarea.value += "me:\n" + text + "\n";
  };

  let sendSten = async () => {
    console.log(`in send sten with message ${chatMessage}`);
    if (chatMessage == "") {
      return;
    }

    if (
      !(isDataChannelOpen && isRemotePublicKeyExists && remote_hash_str != "")
    ) {
      console.log(
        `${isDataChannelOpen} ${isRemotePublicKeyExists} ${remote_hash_str}`
      );
      return;
    }

    SetChatMessage("");
    await sendMessage(chatMessage);
    //.log("done here bro")
  };

  window.addEventListener("beforeunload", leaveChannel);
  return id ? (
    <div className="flex flex-col justify-between items-center relative">
      <Head>
        <title>Room {id}</title>
      </Head>
      <div className="text-4xl text-center pt-8 font-bold">ROOM - {id}</div>
      <div className="p-8 flex justify-between items-center flex-col md:flex-row animate-fade-in">
        <video
          autoPlay
          className="bg-black h-[300px] outline outline-offset-8 outline-1 rounded"
          id="user-1"
        ></video>
        <div className="p-4" />
        <video
          id="user-2"
          className="bg-black h-[300px] outline outline-offset-8 outline-1 rounded"
          autoPlay
        ></video>
      </div>
      <div className="p-4" />
      <div className=" flex my-auto justify-center items-center">
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => SetChatMessage(e.target.value)}
          className="bg-transparent outline outline-1 rounded outline-offset-8"
        />
        <div className="p-4" />
        <button
          onClick={async () => {
            // setChat([...chat, [chatMessage, true]]);
            await sendSten();
          }}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          id="sendButton"
        >
          Submit
        </button>
      </div>
      <div className="p-8" />
      {chat ? (
        <h1 className="p-4 text-4xl font-semibold">Messages</h1>
      ) : (
        <div></div>
      )}
      <div className="border p-2 w-[400px] mx-10 grid grid-cols-1">
        {chat ? (
          chat.map((msg) => (
            <div
              className={`border-1 border rounded-[100px] bg-gray-700 p-4 m-2 font-bold text-xl ${
                msg[1]
                  ? "text-cyan-300	place-self-start"
                  : "text-green-400 place-self-end"
              }`}
              key={msg.at()}
            >
              {msg[0]}
            </div>
          ))
        ) : (
          <div>No Messages</div>
        )}
      </div>
      <video id="sten-remote" className="invisible"></video>
    </div>
  ) : (
    <div>loading</div>
  );
};

export default VideoChat;
