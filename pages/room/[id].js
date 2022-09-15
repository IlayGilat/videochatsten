import React from "react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
const Profile = () => {
  const { query } = useRouter();
  const [id, setId] = useState();
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
  };
  return id ? (
    <div>
      <div>ROOM - {id}</div>
      <div className="grid grid-cols-2 gap-8">
        <video
          autoPlay
          playsInline
          className="bg-black h-[300px]"
          id="user-1"
        ></video>
        <div className="p-4" />
        <video
          id="user-2"
          className="bg-black h-[300px]"
          autoPlay
          playsInline
        ></video>
      </div>
      <div className="p-4" />
      <div>
        <textarea className="bg-transparent border" />
        <button>Submit</button>
      </div>
    </div>
  ) : (
    <div>loading</div>
  );
};

export default Profile;
