import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3001/api/v1';

async function req(method, urlPath, body, cookieHeader) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers.Cookie = cookieHeader;
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data, setCookie, text };
}

function pickCookie(setCookie) {
  const line = setCookie.find((c) => c.startsWith('ug_session='));
  if (!line) return null;
  return line.split(';')[0];
}

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail: String(detail).slice(0, 300) });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : ' :: ' + String(detail).slice(0, 200)}`);
}

async function login(email) {
  const r = await req('POST', '/auth/login', { email, password: 'Password123!' });
  const cookie = pickCookie(r.setCookie);
  check(`${email} login`, r.ok && cookie, JSON.stringify(r.data));
  return cookie;
}

async function run() {
  // Frontends
  for (const [name, url] of [
    ['admin web', 'http://localhost:3000'],
    ['resident web', 'http://localhost:3002'],
    ['security web', 'http://localhost:3003'],
    ['admin login page', 'http://localhost:3000/login'],
    ['resident login page', 'http://localhost:3002/login'],
    ['security login page', 'http://localhost:3003/login'],
  ]) {
    try {
      const res = await fetch(url);
      check(name, res.ok, `status=${res.status}`);
    } catch (e) {
      check(name, false, e.message);
    }
  }

  // ADMIN
  const admin = await login('admin@urbangate.demo');
  const me = await req('GET', '/auth/me', null, admin);
  check('admin me', me.ok && me.data?.user?.activeSocietyId, JSON.stringify(me.data));

  const units = await req('GET', '/units', null, admin);
  check('admin units', units.ok && units.data?.length > 0, `n=${units.data?.length}`);
  const unitId = units.data?.[0]?.id;

  const gates = await req('GET', '/gates', null, admin);
  const gateId = gates.data?.[0]?.id;
  check('admin gates', gates.ok && gateId, `n=${gates.data?.length}`);

  const amenities = await req('GET', '/amenities', null, admin);
  const amenityId = amenities.data?.[0]?.id;
  check('admin amenities', amenities.ok && amenityId, `n=${amenities.data?.length}`);

  const notice = await req(
    'POST',
    '/notices',
    { title: 'Dry-run notice', body: 'Smoke test notice body for dry run', publish: true },
    admin,
  );
  check('admin create+publish notice', notice.ok, JSON.stringify(notice.data));

  const complaint = await req(
    'POST',
    '/complaints',
    {
      category: 'MAINTENANCE',
      subject: 'Dry-run leak',
      description: 'Smoke test complaint description',
      unitId,
      priority: 'MEDIUM',
    },
    admin,
  );
  check('admin create complaint', complaint.ok, JSON.stringify(complaint.data));

  const meeting = await req(
    'POST',
    '/meetings',
    {
      title: 'Dry-run AGM',
      agenda: 'Smoke agenda items',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      location: 'Clubhouse',
      schedule: true,
    },
    admin,
  );
  check('admin create meeting', meeting.ok, JSON.stringify(meeting.data));

  const doc = await req(
    'POST',
    '/documents',
    { title: 'Dry-run bylaws', category: 'BYLAWS', description: 'Smoke', published: true },
    admin,
  );
  check('admin create document', doc.ok, JSON.stringify(doc.data));

  const visitorAdmin = await req(
    'POST',
    '/visitors',
    {
      name: 'Admin Guest',
      mobile: '9999900001',
      purpose: 'Testing',
      unitId,
      gateId,
      preApproved: true,
    },
    admin,
  );
  check('admin create visitor', visitorAdmin.ok, JSON.stringify(visitorAdmin.data));
  const visitorAdminId = visitorAdmin.data?.id;

  if (visitorAdminId) {
    const cin = await req('POST', `/visitors/${visitorAdminId}/check-in`, null, admin);
    check('admin check-in visitor', cin.ok, JSON.stringify(cin.data));
    const cout = await req('POST', `/visitors/${visitorAdminId}/check-out`, null, admin);
    check('admin check-out visitor', cout.ok, JSON.stringify(cout.data));
  }

  const start = new Date(Date.now() + (12 + Math.floor(Math.random() * 40)) * 3600000).toISOString();
  const end = new Date(new Date(start).getTime() + 3600000).toISOString();
  const booking = await req(
    'POST',
    '/bookings',
    { amenityId, startAt: start, endAt: end, unitId },
    admin,
  );
  check('admin create booking', booking.ok, JSON.stringify(booking.data));

  const invoices = await req('GET', '/invoices', null, admin);
  check('admin invoices', invoices.ok, `n=${invoices.data?.length}`);
  const invoiceId = invoices.data?.[0]?.id;
  if (invoiceId) {
    const inv = await req('GET', `/invoices/${invoiceId}`, null, admin);
    check('admin invoice detail', inv.ok, inv.data?.id);
  } else {
    check('admin invoice detail', false, 'no invoices');
  }

  const payments = await req('GET', '/payments', null, admin);
  check('admin payments list', payments.ok, `n=${payments.data?.length}`);

  const report = await req('GET', '/invoices/reports/collection', null, admin);
  check('admin collection report', report.ok, JSON.stringify(report.data).slice(0, 120));

  const vehicles = await req('GET', '/vehicles', null, admin);
  check('admin vehicles', vehicles.ok, `n=${vehicles.data?.length}`);

  const lookupM = await req('GET', '/lookups/members?q=owner', null, admin);
  check('admin lookup members', lookupM.ok, `n=${lookupM.data?.length}`);
  const lookupU = await req('GET', '/lookups/units?q=101', null, admin);
  check('admin lookup units', lookupU.ok, `n=${lookupU.data?.length}`);

  // RESIDENT
  const owner = await login('owner1@urbangate.demo');
  const ome = await req('GET', '/auth/me', null, owner);
  check('owner me', ome.ok, ome.data?.user?.email);

  const oInv = await req('GET', '/invoices', null, owner);
  check('owner invoices scoped', oInv.ok, `n=${oInv.data?.length}`);

  const oNotices = await req('GET', '/notices', null, owner);
  check('owner notices', oNotices.ok, `n=${oNotices.data?.length}`);

  const oUnits = await req('GET', '/units', null, owner);
  check('owner units scoped', oUnits.ok && oUnits.data?.length >= 1, `n=${oUnits.data?.length}`);
  const oUnitId = oUnits.data?.[0]?.id;

  const oVisitor = await req(
    'POST',
    '/visitors',
    {
      name: 'Owner Guest',
      mobile: '9999900002',
      purpose: 'Family',
      unitId: oUnitId,
      category: 'GUEST',
    },
    owner,
  );
  check('owner create visitor', oVisitor.ok, JSON.stringify(oVisitor.data));
  const oVisitorId = oVisitor.data?.id;

  // approve as owner if REQUESTED
  if (oVisitorId && oVisitor.data?.status === 'REQUESTED') {
    const appr = await req('POST', `/visitors/${oVisitorId}/approve`, null, owner);
    check('owner approve visitor', appr.ok, JSON.stringify(appr.data));
  } else if (oVisitorId) {
    check('owner approve visitor', true, `status=${oVisitor.data?.status} skip`);
  }

  const oComplaint = await req(
    'POST',
    '/complaints',
    {
      category: 'NOISE',
      subject: 'Dry-run noise',
      description: 'Resident smoke complaint',
      unitId: oUnitId,
    },
    owner,
  );
  check('owner create complaint', oComplaint.ok, JSON.stringify(oComplaint.data));

  const oAmen = await req('GET', '/amenities', null, owner);
  const oAmenityId = oAmen.data?.[0]?.id;
  const oStart = new Date(Date.now() + (50 + Math.floor(Math.random() * 40)) * 3600000).toISOString();
  const oEnd = new Date(new Date(oStart).getTime() + 3600000).toISOString();
  const oBook = await req(
    'POST',
    '/bookings',
    { amenityId: oAmenityId, startAt: oStart, endAt: oEnd, unitId: oUnitId },
    owner,
  );
  check('owner create booking', oBook.ok, JSON.stringify(oBook.data));

  const oDocs = await req('GET', '/documents', null, owner);
  check('owner documents', oDocs.ok, `n=${oDocs.data?.length}`);

  const oHh = await req('GET', '/household-members', null, owner);
  check('owner household', oHh.ok, `n=${oHh.data?.length}`);

  const oVeh = await req('GET', '/vehicles', null, owner);
  check('owner vehicles', oVeh.ok, `n=${oVeh.data?.length}`);

  const oEm = await req('GET', '/emergency-contacts', null, owner);
  check('owner emergency', oEm.ok, `n=${oEm.data?.length}`);

  const oMeet = await req('GET', '/meetings', null, owner);
  check('owner meetings', oMeet.ok, `n=${oMeet.data?.length}`);

  const oNotif = await req('GET', '/notifications', null, owner);
  check('owner notifications', oNotif.ok, `n=${oNotif.data?.length}`);

  // SECURITY
  const guard = await login('guard@urbangate.demo');
  const gMe = await req('GET', '/auth/me', null, guard);
  check('guard me', gMe.ok, gMe.data?.user?.email);

  const gVisitors = await req('GET', '/visitors', null, guard);
  check('guard list visitors', gVisitors.ok, `n=${gVisitors.data?.length}`);

  const walkin = await req(
    'POST',
    '/visitors',
    {
      name: 'Walk-in Guest',
      mobile: '9999900003',
      purpose: 'Delivery',
      unitId,
      gateId,
      checkInNow: true,
    },
    guard,
  );
  check('guard walk-in check-in', walkin.ok, JSON.stringify(walkin.data));
  const walkinId = walkin.data?.id;
  if (walkinId) {
    const gOut = await req('POST', `/visitors/${walkinId}/check-out`, null, guard);
    check('guard check-out', gOut.ok, JSON.stringify(gOut.data));
  }

  // approve owner visitor as guard if still APPROVED
  if (oVisitorId) {
    const gCin = await req('POST', `/visitors/${oVisitorId}/check-in`, null, guard);
    check('guard check-in owner guest', gCin.ok, JSON.stringify(gCin.data));
    if (gCin.ok) {
      await req('POST', `/visitors/${oVisitorId}/check-out`, null, guard);
    }
  }

  const gLookup = await req('GET', '/lookups/members?q=owner', null, guard);
  check('guard lookup members', gLookup.ok, `n=${gLookup.data?.length}`);

  const gVeh = await req('GET', '/vehicles?q=MH', null, guard);
  check('guard vehicle lookup', gVeh.ok, `n=${gVeh.data?.length}`);

  const gEm = await req('GET', '/emergency-contacts', null, guard);
  check('guard emergency', gEm.ok, `n=${gEm.data?.length}`);

  // Tenancy: owner should NOT create document (no manage)
  const badDoc = await req(
    'POST',
    '/documents',
    { title: 'Should fail', category: 'X', published: true },
    owner,
  );
  check('owner cannot manage documents', badDoc.status === 403, `status=${badDoc.status}`);

  // Payment recording if unpaid invoice
  const unpaid = (invoices.data || []).find((i) => i.status !== 'PAID' && Number(i.balancePaise || i.outstandingPaise || 0) > 0);
  // try common fields
  let unpaidAny = (invoices.data || []).find((i) => ['ISSUED', 'PARTIAL', 'OVERDUE', 'UNPAID'].includes(i.status));
  if (!unpaidAny) unpaidAny = (invoices.data || [])[0];
  if (unpaidAny) {
    const pay = await req(
      'POST',
      '/payments',
      {
        invoiceId: unpaidAny.id,
        amount: '100',
        mode: 'CASH',
        reference: 'DRYRUN-100',
      },
      admin,
    );
    check('admin record payment', pay.ok, JSON.stringify(pay.data));
  } else {
    check('admin record payment', false, 'no invoice');
  }

  console.log('\n=== SUMMARY ===');
  const failed = results.filter((r) => !r.pass);
  console.log(`pass=${results.length - failed.length} fail=${failed.length}`);
  for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
  fs.writeFileSync(path.join(__dirname, 'smoke-results.json'), JSON.stringify(results, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
