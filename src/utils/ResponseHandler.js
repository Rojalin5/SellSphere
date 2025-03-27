class ResponseHandler{
    constructor(statusCode,data,message="Success",pagonation=null){
        this.statusCode = statusCode
        this.data = data
        this.message=message
        if(pagonation){
            this.pagonation = pagonation
        }
    }
}



export {ResponseHandler}