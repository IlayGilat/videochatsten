
/*
Convert an ArrayBuffer into a string
from https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string/
*/
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }


/*
Export the given key and write it into the "exported-key" space.
*/

async function exportCryptoKey(key) {
  const exported = await window.crypto.subtle.exportKey(
    "spki",
    key
  );
  const exportedAsString = ab2str(exported);
  const exportedAsBase64 = window.btoa(exportedAsString);
  const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
  return pemExported
  //const exportKeyOutput = document.querySelector(".exported-key");
  //exportKeyOutput.textContent = pemExported;
}

//pem representation of public key
async function importCryptoKey(key_str) {
  let new_key = key_str
  if(/^(-----BEGIN PUBLIC KEY-----\n)/.test(key_str) && /(\n-----END PUBLIC KEY-----)$/.test(key_str)){
    new_key = key_str.substring(27,key_str.length-25)
  }
  let atob_op = window.atob(new_key)
  let bytes = new Uint8Array(atob_op.length);
  for(let i=0;i<atob_op.length; i++) {
    bytes[i] = atob_op.charCodeAt(i);
  }

  let buffer = bytes.buffer
  //console.log(buffer)
  
  let importedPublicKey = await window.crypto.subtle.importKey(
    "spki",
    buffer,
    {
        name: "RSA-OAEP",
        hash: {name: "SHA-256"}
    },
    true,
    ["encrypt"]
);
//console.log(importedPublicKey)
return importedPublicKey

}
/*
Generate an encrypt/decrypt key pair,
then set up an event listener on the "Export" button.
*/



let generateRsaPair = async () =>{
return window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      // Consider using a 4096-bit key for systems that require long-term security
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  )
}
//public key obj, plaintext returns base64
async function rsa_encrypt(key,data){
  let enc = new TextEncoder();
  let encoded = enc.encode(data);
  let encrypted =  await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    key,
    encoded,
  );
  let base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(encrypted)));
  return base64String
}

//base64 cipher to plaintext

async function rsa_decrypt(key,data){
  let atob_op = window.atob(data)
  let key_bytes = new Uint8Array(atob_op.length);
  for(let i=0;i<atob_op.length;i++){
    key_bytes[i] = atob_op.charCodeAt(i);
  }
  let data_buffer = key_bytes.buffer

  let decoded = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    key,
    data_buffer,
  );
  let str = "";
  let bytes = new Uint8Array(decoded)
  for(let i=0;i<bytes.length;i++){
    str+=String.fromCharCode(bytes[i])
  }
  return str
}





export{generateRsaPair,exportCryptoKey,importCryptoKey,rsa_encrypt,rsa_decrypt};