import config from './lib/config';
import { ApiServer, init } from './server';
import { UserController, userRouterInit } from './routes/user';


const main = async () => {

    const userRoutes:UserController = await userRouterInit();
    /** 필요한 라우터는 여기서 추가 후 배열에 넣는다. */
    
    const routes:Array<any> = [userRoutes]; 
    
    const basicConfig = config.basicConfig();
    const server:ApiServer = await init(basicConfig, routes);
    
    server.listen(basicConfig.port, () => {
        console.log(`running server at ${basicConfig.port}`);
    });

    process.on('SIGTERM', () => server.shutdown());
    process.on('SIGINT', () => server.shutdown());
}

main();