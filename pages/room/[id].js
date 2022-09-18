import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import AgoraRTM from "agora-rtm-sdk";
const VideoChat = () => {
  const { query } = useRouter();
  const [id, setId] = useState();
  const [message, SetMessage] = useState("");

  let uid = String(Math.floor(Math.random() * 10000));
  const FRAME_RATE = 20;
  const token = null;
  const APP_ID = "914f7af2b652488db4a7c6998460136a";

  let client;
  let channel;

  let localStream;
  let remoteStream;
  let peerConnection;
  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
  };

  useEffect(() => {
    setId(query.id);
    init();
  }, [query, id]);

  const init = async () => {
    client = await AgoraRTM.createInstance(APP_ID);
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
    console.log(localStream);
    document.getElementById("user-1").srcObject = localStream;
    document.getElementById("user-2").srcObject = localStream;
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

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
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
  };
  let createOffer = async (MemberId) => {
    await createPeerConnection(MemberId);
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    client.sendMessageToPeer(
      { text: JSON.stringify({ type: "offer", offer: offer }) },
      MemberId
    );
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

  return id ? (
    <div className="flex flex-col justify-between items-center relative">
      <Head>
        <title>Room {id}</title>
      </Head>
      <div className="text-2xl text-center pt-8">ROOM - {id}</div>
      <div className="p-8 flex justify-between items-center flex-col md:flex-row animate-fade-in">
        <video
          autoPlay
          className="bg-black h-[300px] outline outline-offset-8 outline-1"
          id="user-1"
        ></video>
        <div className="p-4" />
        <video
          id="user-2"
          className="bg-black h-[300px] outline outline-offset-8 outline-1"
          autoPlay
        ></video>
      </div>
      <div className="p-4" />
      <div className=" flex my-auto justify-center items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => SetMessage(e.target.value)}
          className="bg-transparent outline outline-1 outline-offset-4"
        />
        <div className="p-4" />
        <button
          onClick={() => {
            roomID ? alert(message) : alert("Need Room ID");
          }}
          className="outline outline-1 rounded outline-offset-4  cursor-pointer"
        >
          Submit
        </button>
      </div>
      <div className="p-8" />
      <h1 className="text-center font-bold text-4xl">
        Last Message: {message ? message : "No Message"}
      </h1>
    </div>
  ) : (
    <div>loading</div>
  );
};

export default VideoChat;
