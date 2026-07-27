import { BadRequestException } from '@nestjs/common';
import { assertMongoObjectId, isMongoObjectId } from './mongo-id';

describe('mongo id helpers', () => {
  it('accepts 24-char hex ids', () => {
    expect(isMongoObjectId('6a67aff5b4084ac133255770')).toBe(true);
  });

  it('rejects malformed ids', () => {
    expect(isMongoObjectId('undefined')).toBe(false);
    expect(isMongoObjectId('not-an-objectid')).toBe(false);
    expect(isMongoObjectId('')).toBe(false);
  });

  it('throws BadRequest for invalid ids', () => {
    expect(() => assertMongoObjectId('undefined', 'visitor id')).toThrow(BadRequestException);
  });
});
