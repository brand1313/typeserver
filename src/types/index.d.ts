import { UserDocument } from '../lib/interfaces';

declare global {
    namespace Express {
        interface User extends UserDocument {}
    }    
}