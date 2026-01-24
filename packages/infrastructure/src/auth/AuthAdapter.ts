import { User } from '../../../core/src/identity/User';

export class AuthAdapter {
    authenticate(user: User): boolean {
        console.log(`Authenticating ${user.name}`);
        return true;
    }
}
