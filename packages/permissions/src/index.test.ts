import assert from 'node:assert/strict';
import test from 'node:test';
import { hasPermission, permissionsForRoles } from './index';

test('SOCIETY_ADMIN has building.create', () => {
  assert.equal(hasPermission(['SOCIETY_ADMIN'], 'building.create'), true);
});

test('RESIDENT does not have member.invite', () => {
  assert.equal(hasPermission(['RESIDENT'], 'member.invite'), false);
});

test('permissionsForRoles unions multiple roles', () => {
  const set = permissionsForRoles(['RESIDENT', 'TREASURER']);
  assert.equal(set.has('audit.view'), true);
  assert.equal(set.has('building.create'), false);
});

test('OWNER can view documents but not manage', () => {
  assert.equal(hasPermission(['OWNER'], 'document.view'), true);
  assert.equal(hasPermission(['OWNER'], 'document.manage'), false);
});

test('SOCIETY_ADMIN can manage documents', () => {
  assert.equal(hasPermission(['SOCIETY_ADMIN'], 'document.manage'), true);
});

test('SECURITY_GUARD can check in visitors but not invite members', () => {
  assert.equal(hasPermission(['SECURITY_GUARD'], 'visitor.checkin'), true);
  assert.equal(hasPermission(['SECURITY_GUARD'], 'member.invite'), false);
});

test('TREASURER can create invoices', () => {
  assert.equal(hasPermission(['TREASURER'], 'invoice.create'), true);
});
