import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
const VideoChat = () => {
  const { query } = useRouter();
  const [id, setId] = useState();
  const [message, SetMessage] = useState("");
  let localStream;
  useEffect(() => {
    setId(query.id);
    init();
  }, [query, id]);

  const init = async () => {
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
