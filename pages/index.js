import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";
export default function Home() {
  const [roomID, setRoomID] = useState("");
  const router = useRouter();
  return (
    <div className="flex  h-screen w-screen flex-col justify-between items-center relative">
      <Head>
        <title>Sten Video Chat</title>
      </Head>
      <div className="text-2xl text-center pt-8">Sten Video Chat</div>
      <div className=" flex my-auto justify-center items-center">
        <input
          type="text"
          value={roomID}
          onChange={(e) => setRoomID(e.target.value)}
          className="bg-transparent outline outline-1 outline-offset-4"
        />
        <div className="p-4" />
        <button
          onClick={() => {
            roomID ? router.push(`/room/${roomID}`) : alert("Need Room ID");
          }}
          className="outline outline-1 rounded outline-offset-4  cursor-pointer"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
