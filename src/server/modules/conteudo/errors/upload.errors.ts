import { BadRequestError } from '@server/lib/http/errors'

export class UploadInvalidoError extends BadRequestError {
  constructor(message: string) {
    super(message)
  }
}
