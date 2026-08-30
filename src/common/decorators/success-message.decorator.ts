import { SetMetadata } from '@nestjs/common';

/**
 * Custom decorator to set a success message in the metadata.
 * @param message - The success message to return in the response.
 */
export const SuccessMessage = (message: string) =>
  SetMetadata('successMessage', message);
