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
