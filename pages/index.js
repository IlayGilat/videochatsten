import { useRouter } from "next/router";
import { useState } from "react";
export default function Home() {
  const [roomID, setRoomID] = useState("");
  const router = useRouter();
  return (
    <div>
      <input
        type="text"
        value={roomID}
        onChange={(e) => setRoomID(e.target.value)}
        className="bg-transparent border"
      />
      <button onClick={() => router.push(`/room/${roomID}`)}>Submit</button>
    </div>
  );
}
