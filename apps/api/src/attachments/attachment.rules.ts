/** Allowed attachment parent entity types (Gate C+ files rule). */

export const ATTACHMENT_ENTITY_TYPES = [
  'Notice',
  'Complaint',
  'Meeting',
  'SocietyDocument',
] as const;

export type AttachmentEntityType = (typeof ATTACHMENT_ENTITY_TYPES)[number];

export function isAllowedAttachmentEntity(entityType: string): boolean {
  return (ATTACHMENT_ENTITY_TYPES as readonly string[]).includes(entityType);
}
