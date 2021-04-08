import mongoose from 'mongoose';

const dbconn = () => {

    const connect = () =>{

        const db:string = 'mongodb://localhost:27017/user';
        
        mongoose.connect(db,{ useUnifiedTopology: true, useNewUrlParser: true }, (err:mongoose.CallbackError) => {

            if(err){
                console.error(`error - 몽구스 디비 연결 에러`, err);
            }

            console.log(`몽고 DB 연결 성공`);
        });
    }
 
    connect();

    mongoose.connection.on('disconnected', connect);

}

export default dbconn;