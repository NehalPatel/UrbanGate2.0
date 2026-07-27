import { isAllowedAttachmentEntity, ATTACHMENT_ENTITY_TYPES } from './attachment.rules';

describe('attachment entity rules', () => {
  it('allows known entity types including SocietyDocument', () => {
    expect(ATTACHMENT_ENTITY_TYPES).toContain('SocietyDocument');
    expect(isAllowedAttachmentEntity('Notice')).toBe(true);
    expect(isAllowedAttachmentEntity('SocietyDocument')).toBe(true);
  });

  it('rejects unknown entity types', () => {
    expect(isAllowedAttachmentEntity('Invoice')).toBe(false);
    expect(isAllowedAttachmentEntity('')).toBe(false);
  });
});
