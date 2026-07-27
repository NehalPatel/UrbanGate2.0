const VISITOR_TRANSITIONS: Record<string, string[]> = {
  APPROVED: ['REQUESTED'],
  REJECTED: ['REQUESTED'],
  CHECKED_IN: ['APPROVED', 'REQUESTED'],
  CHECKED_OUT: ['CHECKED_IN'],
};

export function canTransitionVisitor(from: string, to: string): boolean {
  const allowed = VISITOR_TRANSITIONS[to];
  return Boolean(allowed?.includes(from));
}
