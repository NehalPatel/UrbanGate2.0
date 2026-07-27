import { BadRequestException } from '@nestjs/common';

const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

export function isMongoObjectId(id: string | undefined | null): boolean {
  return typeof id === 'string' && OBJECT_ID_RE.test(id);
}

/** Throws 400 when id is not a valid Mongo ObjectId hex string. */
export function assertMongoObjectId(id: string, label = 'id'): void {
  if (!isMongoObjectId(id)) {
    throw new BadRequestException({
      error: 'INVALID_ID',
      message: `Invalid ${label}`,
    });
  }
}
