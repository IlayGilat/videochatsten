//I want that this handler with with a created sha256 hash to give a base4 value of steps for the sten module

class hash_handler{

    constructor(base_str, base){
        this.pointer = 0
        this.base_str = base_str
        this.base = base
    }


    next(){
        if(this.base <= 0 || this.base_str == null)
            return 0
       
        if(this.pointer>=this.base_str.length)
            this.pointer = 0
        
        if(this.pointer < 0)
            this.pointer = 0

        
        if(this.pointer < this.base_str.length && this.pointer>=0){
            let integer = parseInt(this.base_str.charAt(this.pointer), this.base)
            this.pointer = (this.pointer+1)%this.base_str.length
            return integer
        }
    }
    check_next(){
        return parseInt(this.base_str.charAt(this.pointer), this.base)
    }
}
//not done

export {hash_handler}