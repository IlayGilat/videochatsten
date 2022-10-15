import {hash_handler} from './hash_handler.js'


const rgb = {0: 'r', 1: 'g', 2:'b', 3:'a'}


//all the flags will be in the same length
const flag = "100110011001100110011001"; //start and end
const remain_flag = "111000111000111000111000";
const str = "abdsadsa"
const bits = 2
const base = 4


//if functions have bits parameters they can only get or value of 1 or 2



//uses the module CryptoJS to make a sha256 object, it handles it and returns a string with the base we want
//the functionality of the hash string is to give us a long random indexes to hide our bits in
function SHA256_to_base(string,base) {
    if(typeof string === "string" && typeof base==="number" && base>1){
        //let res ="0b" + CryptoJS.SHA256(string).toString(CryptoJS.enc.Hex).split('').map(i => parseInt(i,16).toString(2).padStart(4,'0')).join('')
        //res = eval(res)
        let res = CryptoJS.SHA256(string).words.map(i => i= (new Uint32Array([i]))[0].toString(base)).join('')
        return res
    }
    return -1   
}


//rgba arr


let str_to_bin = (text) => {

}


//ascii
let bin_to_str = (bin_str, char_size) => {
    let char_arr = []
    for(let i=0;i<bin_str.length;i=i+char_size){
        if(i+char_size>bin_str.length) break;
        char_arr.push(String.fromCharCode(parseInt(bin_str.substring(i,i+char_size),2)));
    }
    return char_arr.join("");
}

//bits_n = 1 or 2





//not In use (work good with matrix i guess)
//pixel - 4 colors
//index = pixel_index*4 + (0-3) 
//size - bits counter
let pixels_counter = (start,size,bits_n) =>{
    
    if(bits_n>2 || bits_n<1){
        return -1
    }
    let after
    if(bits_n ==2){
        after = next(start,Math.floor(size/2)+size%2)
    }
    else{
        after = next(start,size)
    }
    let end_pixel = Math.floor(after/4)
    let start_pixel = Math.floor(start/4)
    if(after%4==0){
        end_pixel--
    }
    


    return end_pixel - start_pixel + 1
    
}



//its mainly created to get the counter parameter that is headen in a known place cell after cell

//bits =  1 or 2
//this function intended to return a string of 0 and 1 that hidden one after one in the array
let decode_consistant = (arr, start, size, bits) => {
    let index = next(start,0);
    let res_str = ""
    if(distance(start, arr.length, bits)< size)
        return -1
    
    for(let i=0;i<size;i=i+bits){
        let val
        if(bits===2 && i+1<size){
            val  = get_value(arr[index],4).toString(2).padStart(2,'0')
        }
        else{
            val = get_value(arr[index],2).toString(2)
        }
        res_str = res_str + val;
        index = next(index,1)
    }

    return res_str;
    
}




//it works fine for also every bit string you want to put in a consistant way in the arr
//start = main_index*4+color_index(0-3)
//arr - the arr is huge so we will slice
//we will write the flag on the array usin two bits of the end of the array, because flag need to defrentiate regular photo to sten one
let insertflag = (arr, start, flag) => {
    let buff_p = 0;
    let i,color
    let index = next(start,0)

    for(buff_p;buff_p<flag.length; buff_p = buff_p+2){
        if(index >= arr.length*4)
            return -1
        let val
        if(buff_p+1<flag.length)
            val = set_value(arr[index], parseInt(flag.substring(buff_p, buff_p+2),2),4)
        else
            val = set_value(arr[index], parseInt(flag.charAt(buff_p),2),2)
        
        arr[index] = val
        index = next(index,1)
    }

    return 1

}



//helpes us to check if the data we hiding in a known place is what we want like a flag
let checkflag = (arr,start, flag) => {
    let index=start;
    for(let i=0;i<flag.length;i=i+2){
        let val;
        if(i+1<flag.length)
        {
            val = get_value(arr[index],4);
            if(val!=parseInt(flag.substring(i,i+2),2)){
                return -1;
            }
        }
        else{
            val = get_value(arr[index],2);
            if(val!=parseInt(flag.charAt(i),2)){
                return -1;
            }
        }
        index = next(index,1);
            
    }

    return 1;
}
//set a value according to the base given
let set_value = (num, val, base) => {
    
    return num - num%base + val

}

//get the value that in the num
let get_value = (num,base) =>{
    return num%base
}


//its for measuring how mych space we got(free cells including the start not including the end)
//the start counts but the end not
//start = main_index*4+color_index(0-3)
//end = end_index*4+color_index(0-3)+1
let distance = (start, end, bits) => {
    let reminder_start = start%4
    let reminder_end = end%4
    let new_start = start - reminder_start
    let new_end = end - reminder_end
    //new start and new end points on the first color of the selected pixel. they can be devided by 4
    let res = (new_end-new_start)*(3/4)- reminder_start+ reminder_end

    return bits* res
}


//return an index for the cell "steps" steps from "index"
//steps>=0
let next = (index, steps) => {
    if(steps === 0){
        if(index%4<3){
            return index
        }
        return index+1
    }

    
    let new_index = index - index%4
    let steps_remain = steps + index%4
    if(index%4 === 3){
        steps_remain --
    }

    let res = new_index + Math.floor(steps_remain/3)*4 + steps_remain%3
    //middle and tail part
    //new_index = new_index + Math.floor(steps_remain/3)*4 + steps_remain%3
    return res

}

//suppose to work bi directional. if index is on 'a' -  0 and 1 will take it to 'r', -1 will take it to 'g'
//I created it to help me calculate the limit index with we can hide the data into - because we need a flag at the end to determine 
// - if the data ended or the data will come on different frames
let next_signed = (index,steps) => {
    let index_helper = index
    let steps_helper = steps
    if(index%4==3 || index%4 ==-1){
        index_helper++
        if(steps>0) steps_helper--
    }
    let new_index = index_helper - index_helper%4
    let steps_remain = steps_helper + index_helper%4
    if(index_helper%4<0) steps_remain++

    let res = new_index + Math.floor(steps_remain/3)*4 + steps_remain%3
    if(steps_remain%3<0){
      res = res +3
    }
    
    return res
}


let cell_counter = (size,bits) => {
    let res = Math.floor(size/bits)
    if(size%bits !==0){
        res = res + 1
    } 
    return res;
} 



//encodes ascii for now
//the encoding takes the arr - the values are ints and every 4 cells represent a pixel, we cant touch the "a" parameter,
//firstly we put a flag that will help us destinct this frame from others for decoding, 
//after that we save a 16 cells for an 32 bit unsigned int that will represent our bit size that hidden
//after that we hide the bin_str content with the object hash_handler that give us the next ammpunt of steps we go to the hide the next 2 bits


//eventually it meant to return the bin_str that remained for an other frame that will carry the part

let encode = (arr, text = ' ', id=0, part=0,hash_str=str) => {
    let bin_str = String(text).split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(8,'0');
     }).join('');

    if(distance(0,arr.length,2)<flag.length)
        return -1

    let obj = new Object()
    //flag - (cant vary but for now 24 bits)
    let index_after_flag = next(0,cell_counter(flag.length,2))
    let insertFlag_res = insertflag(arr,0,flag)
    if(insertFlag_res !==1 ) return -1
    let temp_id = id
    //id - word (16 bits)
    if(id==0){
        temp_id = Math.floor(1+Math.random()*65535)
    }
    else{
        temp_id = id
    }
    insertFlag_res = insertflag(arr,index_after_flag, temp_id.toString(2).padStart(16,'0').substring(0,16))
    index_after_flag = next(index_after_flag,8)
    if(insertFlag_res !==1) return -1
    //part - (8 bits)

    insertFlag_res = insertflag(arr,index_after_flag,parseInt(part).toString(2).padStart(8,'0').toString(0,8))
    index_after_flag = next(index_after_flag,4)
    if(insertFlag_res !=1) return -1

    //counter
    let bin32_str = bin_str.length.toString(2).padStart(32,'0');
    let insertBin32_res = insertflag(arr,index_after_flag,bin32_str)
    if(insertBin32_res!==1) return -1
    //end flag

    
    //main
    let hash_obj = new hash_handler(SHA256_to_base(hash_str,4),4);
    let index = next(index_after_flag, 16);
    let index_helper=index;
    let bit_counter = 0;
    let base=4
    let char_size = 8
    let is_partly = false
    let end_index = next_signed(arr.length, (-1)*(cell_counter(flag.length,bits)))
    for(let str_p=0;str_p<bin_str.length ;str_p=str_p+2)
    {
        let val;
        if(str_p%char_size==0  && distance(index,end_index,1)<cell_counter(char_size*base,bits)){
            bin32_str = bit_counter.toString(2).padStart(32,'0');
            insertBin32_res = insertflag(arr,index_after_flag,bin32_str)
            is_partly = true;
            break;
        }

        if(str_p+1<bin_str.length){
            val = set_value(arr[index], parseInt(bin_str.substring(str_p, str_p+2),2),4);
            bit_counter = bit_counter+2;
        }
        else{
            val = set_value(arr[index], parseInt(bin_str.charAt(str_p),2),2);
            bit_counter++;
        }
        arr[index] = val;
        index_helper = index;
        index = next(index,1+hash_obj.next());
    }
    

    if(is_partly){
        insertflag(arr,next(index_helper,1),remain_flag)
    }
    else{
        insertflag(arr,next(index_helper,1),flag)
    }
    
    //console.log("bin_str: ", bin_str.length, "counter: ", bit_counter );
    //console.log("so yeah", next(index_helper,1))
    
    obj.str = text.substring(Math.floor(bit_counter/char_size),text.length)
    obj.id = temp_id
    obj.part = part
    obj.is_end = !(is_partly)
    //end main
    return obj


}

//decode: gets arr returns the text
//we first checking for the flag if it exists
//we get the bit_size of the text
//we iterate until we get all the bits hidden in the frame
//decodes ascii for now
//
let decode = (arr, hash_str=str) => {
//checkFlag 
    if(checkflag(arr,0,flag)==-1 || (arr.length/4)*3<=cell_counter(2*flag.length+16+8,2))
        return -1;
    
    let obj = new Object()
    let index = next(0,cell_counter(flag.length,2))
    //get id
    let id = parseInt(decode_consistant(arr,index,16,2),2)
    index = next(index,8)
    let part = parseInt(decode_consistant(arr,index,8,2),2)
    index = next(index,4)     
    
    //get counter
    //index = next(0,cell_counter(flag.length,2))
    let int32_str = decode_consistant(arr,index,32,2)
    let bit_size = parseInt(int32_str,2);

    obj.str = ""
    obj.id = id
    obj.part = part

    //console.log("int32_str: ",bit_size)
//end
//"12031001201201210301020102012"


    let hash_obj = new hash_handler(SHA256_to_base(hash_str,4),4);

    index = next(index,16);
    let index_helper = index;
    let bits = 2; //1 or 2
    let res_str = "";
    for(let i=0;i<bit_size && index<arr.length; i=i+bits){
        let val
        if(i+1<bit_size){
            val = get_value(arr[index],4).toString(2).padStart(2,'0');
        }
        else{
            val = get_value(arr[index],2).toString(2);
        }
        res_str = res_str+val;
        index_helper = index;
        index = next(index,1+hash_obj.next());

    }
    obj.str = bin_to_str(res_str,8);
    
    obj.is_end = 1

    //checking if the end flag is about that not all the data of the ecxoding hiding in this frame and there will come more frames - to wait
    if(checkflag(arr,next(index_helper,1),remain_flag)===1){
        obj.is_end = 2
    }
    if(checkflag(arr,next(index_helper,1),flag)===1){
        obj.is_end = 1
    }

    //return a obj[str,id,part,is_end]
    return obj;

}







export {encode,decode, insertflag,next_signed ,next, distance}