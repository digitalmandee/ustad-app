import { CustomError } from './custom-error';
export class NotFoundError extends CustomError {
  statusCode = 404;

  constructor(public message: string | null) {
    super(message);

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message || 'Not Found' }];
  }
}
