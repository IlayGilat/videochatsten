import {
  encode as encode_arr,
  insertflag,
  decode as decode_arr,
  next_signed,
  next,
  distance,
} from "./sten.js";
let width;
let height;
let inputCtx;
let remote_hash_str;
let current_hash_str;
let dataChannel;

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

let str2frame = (str, width, height) => {
  let frameData = new ImageData(width, height);
  let arr = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
    frameData.data[i] = arr[i];
  }
  return frameData;
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let sendFrame = async (arr, dataChannel) => {
  let ascii_buffer = 10000;
  let ascii_str = String();
  for (let i = 0; i < arr.length; i++) {
    ascii_str = ascii_str + String.fromCharCode(arr[i]);
  }

  //now we got a full ascii string that represents the pixelData array
  //we need to devide the string to a couple of massages  - will choose massages that less then 16kB
  let c = 1;
  dataChannel.send("start-frame");
  for (let i = 0; i < ascii_str.length; i = i + ascii_buffer) {
    await dataChannel.send(ascii_str.substring(i, i + ascii_buffer));
    c++;
  }
  dataChannel.send("end-frame");
  //console.log("end", --c);
};

let sendMessage = async (
  text,
  inputCtx,
  width,
  height,
  dataChannel,
  remote_hash_str
) => {
  let index = 0;
  let encode_res;
  let temp_text = text;
  let first_time = true;
  let id = 0;
  let part = 0;
  do {
    await sleep(60);
    inputCtx.drawImage(document.getElementById("user-1"), 0, 0, width, height);
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

export { makeid, sleep, str2frame, sendFrame, sendMessage };
