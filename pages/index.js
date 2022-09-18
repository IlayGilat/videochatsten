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
      <div className="text-4xl text-center pt-8 font-bold">
        Stenography Video Chat
      </div>
      <div className=" flex my-auto justify-center items-center">
        <input
          placeholder="Enter Room ID"
          type="text"
          value={roomID}
          onChange={(e) => setRoomID(e.target.value)}
          className="bg-transparent outline outline-1 rounded outline-offset-8"
        />
        <div className="p-4" />
        <button
          onClick={() => {
            roomID ? router.push(`/room/${roomID}`) : alert("Needs Room ID");
          }}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
