//Handling all try catch error & promises
const asyncHandler = (request_Handler) => {
    return (req, res, next) =>{
        Promise.resolve(request_Handler(req, res, next)).catch((err)=>next(err));
    }
}

export {asyncHandler}