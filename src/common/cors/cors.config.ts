import { AppEnvironment } from 'src/types';
import { APP, WHITELIST } from '../constants';

export class CorsConfig {
  private static whitelist = Object.values(WHITELIST) || [];

  static getCorsOptions() {
    return {
      origin: (requestOrigin: any, callback: any) => {
        console.log({ requestOrigin, appMode: APP.ENVIRONMENT });

        if (APP.ENVIRONMENT !== AppEnvironment.DEVELOPMENT) {
          const isWhitelisted = this.whitelist.includes(requestOrigin);
          const errorMessage = 'You are not authorized to perform this action';
          callback(
            isWhitelisted ? null : new Error(errorMessage),
            isWhitelisted ? requestOrigin : false,
          );
        } else {
          callback(null, requestOrigin);
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    };
  }
}
