import { SetMetadata } from '@nestjs/common';

export const GALPON_ACCESS_KEY = 'galponAccess';
export const GalponAccess = () => SetMetadata(GALPON_ACCESS_KEY, true);
