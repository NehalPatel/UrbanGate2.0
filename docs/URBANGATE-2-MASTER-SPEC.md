# UrbanGate 2.0 --- Product Requirements & Cursor Development Specification

**Document version:** 1.1\
**Project:** UrbanGate 2.0\
**Product type:** Multi-tenant Society / Gated Community Management
SaaS\
**Primary market:** India\
**Implementation approach:** Greenfield rebuild informed by the original
UrbanGate repositories\
**Primary development assistant:** Cursor AI\
**Amendment (2026-07-26):** Datastore is **MongoDB** (not PostgreSQL);
see `/docs/decisions/017-mongodb.md`. Docker Compose is deferred until
Docker is available.

------------------------------------------------------------------------

## 1. Purpose

UrbanGate 2.0 is a modern rebuild of the original UrbanGate
society-management platform.

The original system already established the core product domain: society
configuration, wings/properties, members, maintenance and invoices,
payments, complaints, notices, meetings, vendors, vehicles, amenities
and bookings, security users, emergency contacts, housekeepers/service
types, assets/inventory, attachments, member-facing features, and
gate/security workflows.

UrbanGate 2.0 must preserve useful business concepts from the old system
while **not copying the legacy architecture blindly**.

This document is the source of truth for the initial rebuild. Cursor
must not invent major business rules when this document is ambiguous.
Add a TODO or request a decision instead.

------------------------------------------------------------------------

## 2. Product Vision

UrbanGate will provide one platform for managing residential societies,
apartment complexes, gated communities, housing associations, and
similar communities.

The platform should replace fragmented workflows involving spreadsheets,
paper visitor registers, WhatsApp notices, manual maintenance ledgers,
complaint registers, and disconnected resident/security tools.

The product consists conceptually of:

1.  **Platform Administration** --- manages UrbanGate SaaS itself.
2.  **Society Administration** --- manages an individual society.
3.  **Resident Portal / PWA** --- self-service application for owners,
    tenants and residents.
4.  **Security Portal / PWA** --- optimized gate-management interface.
5.  **Mobile applications** --- optional later phase after web/PWA
    validation.

------------------------------------------------------------------------

## 3. Legacy Repository Findings

The rebuild is informed by these original repositories:

-   `NehalPatel/urbangate` --- Laravel 7 application containing society
    administration and operational modules.
-   `NehalPatel/Urbangate.io` --- Laravel 7.24 multi-tenant variant
    using Spatie multitenancy; the README states each society had an
    individual database.
-   `NehalPatel/Urbangate-Member` --- Flutter member application.
-   `NehalPatel/Urbangate-Security` --- Flutter security/gate
    application.
-   `NehalPatel/Urbangate-Mobile-App` --- early Flutter project.

Legacy functionality observed includes:

-   Society profile and location
-   Wings
-   Properties
-   Property access requests
-   Maintenance configuration
-   Maintenance invoice generation
-   Payments
-   Society members
-   Complaints
-   Notices
-   Meetings
-   Vendors
-   Vehicles
-   Amenities
-   Amenity booking
-   Security users
-   Emergency contacts
-   Society emergency contacts
-   Housekeepers
-   Service types
-   Assets
-   Asset inventory
-   Comments
-   Attachments/activity logging

The member app additionally exposes flows for:

-   Authentication and verification
-   Property selection
-   Dashboard
-   Notifications
-   My properties
-   Society members
-   Meetings
-   Complaints
-   Notices
-   Amenities and booking
-   Vehicles
-   Emergency contacts
-   Visitors
-   Maintenance
-   Housekeeping
-   Family members
-   Documents
-   Service partners

The security app exposes:

-   Login and lock screen
-   Dashboard
-   Notifications
-   Society contacts
-   Visitor list
-   Add visitor
-   Add vendor
-   Wing/flat selection
-   Vehicle search
-   Housekeeping
-   Member list

These capabilities should be treated as domain evidence, not as
mandatory implementation parity for MVP.

------------------------------------------------------------------------

## 4. Rebuild Principles

### 4.1 Greenfield architecture

Do not migrate Laravel controllers/models/views directly.

Reuse: - Business concepts - Terminology where appropriate - Valid
workflows - Useful UX ideas - Existing data only if migration is later
required

Replace: - Legacy framework structure - Tight coupling - duplicated
mobile/backend logic - obsolete dependencies - database-per-tenant
assumption for the initial release (use shared MongoDB + `societyId`)

### 4.2 TypeScript-first

Use TypeScript throughout backend, frontend, shared packages and tests.

### 4.3 Modular monolith first

Do **not** start with microservices.

Build a well-separated modular monolith with domain boundaries. Modules
must be capable of extraction later if scale or organizational needs
justify it.

### 4.4 API-first

Business logic belongs in backend services/domain modules, not UI
components.

All clients consume the same versioned API.

### 4.5 Multi-tenancy from day one

Tenant isolation is not an optional later feature.

Every tenant-owned record must be scoped to a society/tenant.

### 4.6 Security and auditability by design

Financial, identity, access, visitor and administrative operations
require authorization, validation and audit trails.

------------------------------------------------------------------------

## 5. Recommended Technology Stack

### Runtime and workspace

-   Node.js LTS
-   TypeScript
-   pnpm
-   Turborepo monorepo

### Backend

-   NestJS
-   REST API
-   OpenAPI / Swagger
-   DTO validation
-   Prisma ORM

### Database

-   MongoDB (shared database / collections with `societyId` tenant
    ownership; see `/docs/decisions/017-mongodb.md`)

### Frontend

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   shadcn/ui

### Infrastructure

-   Redis
-   BullMQ for asynchronous jobs
-   Docker / Docker Compose for MongoDB + Redis when Docker is available
    (deferred on machines without Docker; local/Atlas MongoDB is fine)
-   S3-compatible object storage abstraction for uploaded files
-   WebSocket/SSE only where real-time behavior provides clear value

### Testing

-   Unit tests for domain/service logic
-   Integration tests for database-backed workflows
-   API tests for critical endpoints
-   E2E tests for high-value user journeys

------------------------------------------------------------------------

## 6. Proposed Monorepo

``` text
urbangate/
├── apps/
│   ├── api/                 # NestJS API
│   ├── admin-web/           # Society + platform admin
│   ├── resident-web/        # Resident PWA
│   └── security-web/        # Security/gate PWA
│
├── packages/
│   ├── database/            # Prisma schema/client
│   ├── contracts/           # API DTO/contracts where appropriate
│   ├── permissions/         # permission definitions
│   ├── validation/          # shared validation schemas
│   ├── ui/                  # shared UI primitives where useful
│   ├── config/              # shared configuration
│   └── types/
│
├── docs/
├── docker/
├── .env.example
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

Avoid creating shared packages prematurely. A package must have a clear
cross-application responsibility.

------------------------------------------------------------------------

## 7. Core Domain Model

### 7.1 Platform

UrbanGate SaaS contains many societies.

``` text
Platform
  └── Tenant / Society
        ├── Buildings / Wings
        │     └── Units
        ├── Memberships
        ├── Residents
        ├── Finance
        ├── Community
        ├── Visitors
        └── Facilities
```

### 7.2 Identity must be separated from residency

Do not model `User == Resident == Unit`.

A user is a human identity/account.

A user may: - belong to multiple societies, - own multiple units, -
reside in a unit they do not own, - have different roles in different
societies.

Suggested concepts:

-   User
-   Society
-   SocietyMembership
-   Role
-   Permission
-   Building/Wing
-   Unit
-   UnitRelationship

Unit relationships can include: - owner - co-owner - tenant - resident -
family member

------------------------------------------------------------------------

## 8. Multi-Tenancy Requirements

### Initial strategy

Use a shared MongoDB database with explicit tenant ownership on
documents.

Most tenant-owned collections/documents must include:

``` text
societyId
```

Requirements:

-   Tenant context must be resolved centrally.
-   Repositories/services must enforce tenant scope.
-   Client-supplied `societyId` must never be blindly trusted for
    authorization.
-   Unique indexes should usually include `societyId` when uniqueness
    is tenant-local.
-   Cross-tenant reads/writes must be impossible through normal society
    APIs.
-   Platform administrators require explicit privileged paths.
-   Automated tests must verify tenant isolation.

Database-per-tenant is **not** required for MVP.

------------------------------------------------------------------------

## 9. Authentication

Initial requirements:

-   Email/password authentication
-   Secure password hashing
-   Refresh/session strategy
-   Logout
-   Forgot/reset password
-   Email/mobile verification architecture
-   Account status: active, invited, suspended, disabled
-   Rate limiting on authentication endpoints
-   Device/session visibility later

Future: - Mobile OTP - Google - Apple - MFA/passkeys

------------------------------------------------------------------------

## 10. Authorization / RBAC

Implement permission-based authorization.

Suggested default roles:

### Platform

-   Platform Admin
-   Platform Support

### Society

-   Society Admin
-   Chairman
-   Secretary
-   Treasurer
-   Committee Member
-   Accountant

### Residents

-   Owner
-   Tenant
-   Resident

### Operations

-   Security Supervisor
-   Security Guard
-   Staff

Examples of permissions:

``` text
society.view
society.update

building.view
building.create
building.update
building.delete

unit.view
unit.create
unit.update

member.view
member.invite
member.update

invoice.view
invoice.create
invoice.issue
invoice.cancel

payment.view
payment.record
payment.verify

complaint.view
complaint.create
complaint.assign
complaint.resolve

notice.view
notice.create
notice.publish

visitor.view
visitor.create
visitor.approve
visitor.checkin
visitor.checkout
```

Never scatter role-name checks throughout controllers/components.

------------------------------------------------------------------------

## 11. Functional Requirements

# 11.1 Society Management

Store:

-   Name
-   Registration details
-   Address
-   City/state/postcode/country
-   Contact information
-   Logo
-   Time zone
-   Locale
-   Financial year configuration
-   Bank information where required
-   Tax configuration where applicable
-   Society rules/settings
-   Status

------------------------------------------------------------------------

# 11.2 Building / Wing Management

A society can contain one or more buildings/wings/blocks.

Fields may include:

-   Name/code
-   Number of floors
-   Address override
-   Active status
-   Display order

Terminology should eventually be configurable for societies that use
"Wing", "Tower", "Block", etc.

------------------------------------------------------------------------

# 11.3 Unit / Property Management

Unit types:

-   Flat
-   Apartment
-   Bungalow
-   Shop
-   Office
-   Other

Store:

-   Building/wing
-   Unit number
-   Floor
-   Area
-   Unit type
-   Occupancy status
-   Active status
-   metadata needed for maintenance calculation

Support multiple owners and historical occupancy relationships.

------------------------------------------------------------------------

# 11.4 Member and Household Management

Member profile:

-   Name
-   Email
-   Mobile
-   Profile image
-   Emergency contact
-   Society membership
-   Unit relationships
-   Status

Household:

-   Primary resident
-   Family members
-   Tenant relationships
-   Emergency information

Avoid unnecessary collection of sensitive personal documents during MVP.

------------------------------------------------------------------------

# 11.5 Property Access Requests

Preserve the useful legacy concept.

A user may request association with a unit/property.

Workflow:

``` text
Requested -> Under Review -> Approved / Rejected
```

Approval creates the appropriate unit relationship and society
membership if required.

All decisions must be audited.

------------------------------------------------------------------------

# 11.6 Maintenance Configuration

Society admins configure recurring charge components.

Examples:

-   Maintenance
-   Water
-   Lift
-   Security
-   Parking
-   Sinking fund
-   Repair fund
-   Other charges

Calculation modes:

-   Fixed amount per unit
-   Per area
-   Unit type/category
-   Custom per-unit override

Billing frequencies:

-   Monthly
-   Quarterly
-   Half-yearly
-   Yearly
-   One-time

Configuration must be versionable or historically reproducible so old
invoices do not change when rates change.

------------------------------------------------------------------------

# 11.7 Invoice Management

Invoice lifecycle:

``` text
DRAFT -> ISSUED -> PARTIALLY_PAID -> PAID
                     |
                     -> OVERDUE

DRAFT/ISSUED -> CANCELLED where policy permits
```

Invoice includes:

-   Society
-   Unit
-   Billing period
-   Invoice number
-   Issue date
-   Due date
-   Line items
-   Previous balance where policy requires
-   Adjustments
-   Late fee
-   Tax where applicable
-   Total
-   Paid amount
-   Outstanding amount
-   Status

Requirements:

-   Bulk invoice generation must run as a background job.
-   Generation must be idempotent.
-   Duplicate invoices for the same billing run/unit must be prevented.
-   Issued invoice financial values must not silently mutate.
-   PDF generation should be asynchronous/cached.

------------------------------------------------------------------------

# 11.8 Payments and Receipts

Initial payment modes:

-   Cash
-   Cheque
-   Bank transfer
-   UPI
-   Manual online reference

Support:

-   Full payment
-   Partial payment
-   Payment allocation to invoice(s)
-   Reference number
-   Payment date
-   Recorded by
-   Verification status if needed
-   Receipt generation

Payment records must not be hard-deleted after financial posting. Use
reversal/void workflows.

Online gateway integration is a later phase.

------------------------------------------------------------------------

# 11.9 Complaints

Resident can create a complaint with:

-   Category
-   Subject
-   Description
-   Attachments
-   Priority
-   Unit
-   Visibility rules

Workflow:

``` text
OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
                         |
                         -> REOPENED
```

Store history/comments and assignment changes.

Residents must see status history relevant to them.

------------------------------------------------------------------------

# 11.10 Notices

Admins can:

-   Create draft
-   Publish
-   Schedule
-   Archive

Target audiences:

-   Entire society
-   Selected buildings
-   Selected units
-   Roles/groups

Support attachments and notification dispatch.

------------------------------------------------------------------------

# 11.11 Meetings

Preserve the legacy module.

Support:

-   Title
-   Agenda
-   Date/time
-   Location / online link
-   Description
-   Attachments
-   Audience
-   Meeting status
-   Minutes after completion

Future: - RSVP - attendance - voting/resolutions

------------------------------------------------------------------------

# 11.12 Vehicles

Resident vehicle:

-   Registration number
-   Type
-   Make/model optional
-   Unit
-   Owner/member
-   Parking allocation
-   Active status

Security must have fast vehicle-number search.

Vehicle registration number should be normalized for search.

------------------------------------------------------------------------

# 11.13 Amenities

Amenity configuration:

-   Name
-   Description
-   Images
-   Availability
-   Capacity
-   Booking rules
-   Time slots
-   Fee
-   Deposit where applicable
-   Advance-booking limit
-   cancellation rules

------------------------------------------------------------------------

# 11.14 Amenity Booking

Workflow:

``` text
AVAILABLE -> REQUESTED/BOOKED -> CONFIRMED -> COMPLETED
                              -> CANCELLED
```

Requirements:

-   Prevent overlapping bookings.
-   Use database-level protection/transactions against race conditions.
-   Calculate fees server-side.
-   Store booking rule snapshot where required.

------------------------------------------------------------------------

# 11.15 Visitors

Visitor categories:

-   Guest
-   Delivery
-   Cab
-   Vendor
-   Service provider
-   Contractor
-   Other

Visitor record may contain:

-   Name
-   Mobile
-   Photo where permitted
-   Vehicle
-   Purpose
-   Destination unit
-   Entry gate
-   Security guard
-   Requested/approved by
-   Entry time
-   Exit time
-   Status

Workflow:

``` text
REQUESTED -> APPROVED -> CHECKED_IN -> CHECKED_OUT
          -> REJECTED
```

Support resident-created pre-approved visitors later in MVP/Phase 2.

------------------------------------------------------------------------

# 11.16 Security Portal

Design for speed, low training requirement and mobile/tablet use.

Core actions:

-   Login
-   Select/identify assigned gate
-   Visitor entry
-   Visitor list
-   Check-in/check-out
-   Wing/unit selection
-   Member lookup
-   Vehicle lookup
-   Vendor/service-person entry
-   Housekeeping lookup
-   Society emergency contacts
-   Notifications

Avoid exposing financial/admin data to security roles.

------------------------------------------------------------------------

# 11.17 Housekeeping / Domestic Staff

Legacy housekeeper/service-type functionality should evolve into Service
Personnel.

Types:

-   Maid
-   Cook
-   Driver
-   Cleaner
-   Babysitter
-   Plumber
-   Electrician
-   Gardener
-   Other

A service person may be associated with multiple units.

Store: - profile - contact - service type - associated units - status -
optional verification status - entry history where used

------------------------------------------------------------------------

# 11.18 Vendors / Service Partners

Store:

-   Business/person name
-   Service category
-   Contact information
-   Address
-   Status
-   Contracts/documents later
-   Society association

Later finance integration: - vendor bills - expenses - payments

------------------------------------------------------------------------

# 11.19 Emergency Contacts

Support:

-   Society emergency contacts
-   Resident personal emergency contacts

Society examples:

-   Security desk
-   Fire
-   Police
-   Ambulance
-   Hospital
-   Electrician
-   Plumber
-   Society office

Permissions and visibility must be appropriate.

------------------------------------------------------------------------

# 11.20 Documents and Attachments

Resident and society document features existed in the legacy member app.

Initial document system should support:

-   Society documents
-   Meeting documents
-   Complaint attachments
-   Notice attachments
-   Invoice/receipt PDFs

Object storage requirements:

-   Never trust original filename.
-   Generate storage keys.
-   Validate MIME type and size.
-   Use signed/private URLs for restricted documents.
-   Store metadata in MongoDB.
-   Authorization required before access.

------------------------------------------------------------------------

# 11.21 Assets and Inventory

Legacy admin supported assets and asset inventory.

Not MVP-critical, but design later module for:

-   Asset category
-   Asset
-   Serial/reference
-   Purchase date/value
-   Location
-   Status
-   Maintenance/service history
-   Inventory quantities
-   Vendor

------------------------------------------------------------------------

# 11.22 Notifications

Central notification subsystem.

Initial channels:

-   In-app
-   Email

Architecture should allow:

-   Push
-   SMS
-   WhatsApp

Events:

-   Invitation
-   Invoice issued
-   Payment received
-   Payment overdue
-   Complaint updates
-   Notice published
-   Visitor approval request
-   Amenity booking status

Dispatch non-critical notifications asynchronously.

------------------------------------------------------------------------

# 11.23 Activity / Audit Log

Legacy project already used activity logging. UrbanGate 2.0 must make
auditability a first-class feature.

Capture:

-   actor
-   tenant
-   action
-   entity type/id
-   timestamp
-   request/correlation ID
-   meaningful before/after changes where safe
-   source/client
-   IP/device metadata where justified

Audit records must not expose passwords, tokens or secrets.

High-value audited operations:

-   permission changes
-   member approvals
-   invoice creation/cancellation
-   payment recording/reversal
-   tenant configuration changes
-   visitor overrides
-   administrative changes

------------------------------------------------------------------------

## 12. Resident Portal Requirements

Resident PWA initial navigation:

-   Dashboard
-   My Unit(s)
-   Maintenance / Invoices
-   Payments / Receipts
-   Complaints
-   Notices
-   Visitors
-   Amenities
-   Vehicles
-   Meetings
-   Household
-   Emergency Contacts
-   Documents
-   Notifications
-   Profile

Responsive mobile-first design.

PWA should be sufficient for initial product validation before
committing to native apps.

------------------------------------------------------------------------

## 13. Society Admin Requirements

Suggested navigation:

``` text
Dashboard

Community
  Societies/Settings
  Buildings/Wings
  Units
  Members
  Access Requests
  Vehicles

Finance
  Maintenance Rules
  Billing Runs
  Invoices
  Payments
  Reports

Community Operations
  Complaints
  Notices
  Meetings
  Documents

Gate & Services
  Visitors
  Security Staff
  Service Personnel
  Vendors
  Emergency Contacts

Facilities
  Amenities
  Bookings
  Assets (later)

Administration
  Roles & Permissions
  Audit Log
  Notification Settings
```

------------------------------------------------------------------------

## 14. Platform Admin

Separate platform-level permissions from society administration.

Platform admin capabilities:

-   Create/manage tenants
-   Activate/suspend societies
-   Plans/subscriptions later
-   Usage/limits
-   Feature flags
-   Platform support
-   System health visibility
-   Cross-tenant support access with explicit auditing

Do not let ordinary society admins access platform APIs.

------------------------------------------------------------------------

## 15. API Standards

Base:

``` text
/api/v1
```

Example resources:

``` text
/api/v1/auth
/api/v1/societies
/api/v1/buildings
/api/v1/units
/api/v1/memberships
/api/v1/members
/api/v1/vehicles
/api/v1/maintenance-rules
/api/v1/billing-runs
/api/v1/invoices
/api/v1/payments
/api/v1/complaints
/api/v1/notices
/api/v1/meetings
/api/v1/visitors
/api/v1/amenities
/api/v1/bookings
/api/v1/service-personnel
/api/v1/vendors
/api/v1/documents
/api/v1/notifications
```

Standards:

-   JSON
-   consistent error envelope
-   pagination
-   filtering
-   sorting
-   request validation
-   API versioning
-   OpenAPI documentation
-   correlation/request IDs
-   idempotency for selected write endpoints
-   never expose internal errors/stack traces in production

------------------------------------------------------------------------

## 16. Database Rules

-   Use MongoDB ObjectId (Prisma `@db.ObjectId`) as the default document
    primary key strategy, or another deliberately chosen globally safe
    ID strategy documented in `/docs/decisions/`.
-   Store timestamps in UTC.
-   Society time zone controls display and billing interpretation.
-   Use Prisma `Decimal` for money; never floating point.
-   Prefer Prisma relations and application invariants (MongoDB has no
    SQL foreign keys); enforce referential integrity in services + tests.
-   Add indexes based on real query patterns (including `societyId`).
-   Use unique constraints/indexes to enforce invariants.
-   Soft delete only where business requirements justify it.
-   Financial/audit records should generally use status/reversal rather
    than deletion.
-   Use Prisma interactive transactions for multi-document financial and
    booking operations where required.

------------------------------------------------------------------------

## 17. Security Requirements

Mandatory:

-   Secure password hashing
-   Authentication rate limiting
-   DTO/input validation
-   Output shaping
-   RBAC guards
-   tenant isolation
-   secure HTTP headers
-   CORS configuration
-   CSRF strategy appropriate to chosen auth architecture
-   SQL/NoSQL injection protection through ORM/query parameterization
    (Prisma; never interpolate untrusted input into raw queries)
-   XSS-aware rendering
-   upload validation
-   secrets only via environment/secret manager
-   no secrets committed to repository
-   logs must redact sensitive fields
-   audit sensitive actions
-   dependency/security scanning in CI
-   backups and restore procedure before production

Personally identifiable information must be minimized and
access-controlled.

------------------------------------------------------------------------

## 18. Performance Requirements

Design targets, not premature benchmarks:

-   Typical API reads should feel immediate under normal load.
-   Use pagination for unbounded collections.
-   Avoid N+1 database access.
-   Cache only when measurements justify it.
-   Use Redis for appropriate transient/cache workloads.
-   Bulk invoice generation must use queues.
-   Notification fan-out must use queues.
-   Report/PDF generation should use background jobs when expensive.
-   Search-heavy fields such as vehicle number, unit number and invoice
    number require indexes.
-   Build stateless API instances where practical to support horizontal
    scaling.

Node.js does not replace database optimization. Performance decisions
must be measurement-driven.

------------------------------------------------------------------------

## 19. Localization

The old security application supported:

-   English
-   Hindi
-   Gujarati

UrbanGate 2.0 should be localization-ready from the beginning.

Initial UI may launch in English, but do not hard-code user-facing text
throughout components.

Target later: - English - Gujarati - Hindi

------------------------------------------------------------------------

## 20. Accessibility and UX

-   Responsive layouts
-   Keyboard-accessible admin UI
-   Accessible labels
-   adequate contrast
-   clear loading/error/empty states
-   confirmation for destructive/financial actions
-   large touch targets in security portal
-   minimize security guard typing
-   search/select destination unit quickly
-   resident portal optimized for phones

------------------------------------------------------------------------

## 21. MVP Scope

### MVP-0 --- Engineering foundation

-   Monorepo
-   Docker Compose prepared for later (MongoDB + Redis)
-   MongoDB (local install, Atlas, or Compose when Docker is available)
-   Redis (optional until queues; Compose later)
-   NestJS
-   Next.js applications
-   Prisma (MongoDB provider)
-   environment validation
-   logging
-   API error conventions
-   CI
-   test foundation

### MVP-1 --- Identity and tenant core

-   Authentication
-   Society
-   Buildings/wings
-   Units
-   Membership
-   RBAC
-   Resident/unit relationships
-   Society admin dashboard foundation
-   Audit log

### MVP-2 --- Finance core

-   Maintenance rules
-   Billing runs
-   Invoice generation
-   Invoice viewing
-   Manual payments
-   Receipts
-   Outstanding balances
-   basic collection report

### MVP-3 --- Community

-   Complaints
-   Notices
-   Meetings
-   attachments
-   in-app/email notifications

### MVP-4 --- Gate

-   Security users
-   Security PWA
-   Visitors
-   resident approval
-   check-in/check-out
-   member/unit lookup
-   vehicle lookup
-   emergency contacts

### MVP-5 --- Facilities and household

-   Amenities
-   Booking
-   Vehicles
-   Household/family
-   Service personnel

Native mobile applications are explicitly **not required before the PWA
MVP is validated**.

------------------------------------------------------------------------

## 22. Out of Scope for Initial MVP

Do not implement without explicit approval:

-   Microservices
-   Kubernetes
-   Native mobile apps
-   AI features
-   Facial recognition
-   ANPR
-   IoT gate hardware
-   Full double-entry accounting suite
-   Formal society elections
-   WhatsApp integration
-   SMS integration
-   Online payment gateway
-   biometric attendance
-   marketplace
-   advertisement system
-   advanced asset management
-   database-per-tenant
-   custom workflow builder

Architecture may leave room for these without building them now.

------------------------------------------------------------------------

## 23. Testing Requirements

Critical business flows require tests.

At minimum:

### Tenancy

-   User in Society A cannot read/write Society B data.

### RBAC

-   Resident cannot invoke society-admin operations.
-   Security cannot access finance.
-   Treasurer/accountant permissions behave as configured.

### Billing

-   Correct calculation for each maintenance rule.
-   Bulk generation is idempotent.
-   Duplicate invoice prevention.
-   Partial payment calculations.
-   Payment reversal behavior.

### Booking

-   Concurrent attempts cannot double-book the same slot.

### Visitor

-   Unauthorized user cannot approve another society's visitor.
-   Check-in requires valid workflow state.
-   Exit is timestamped and audited.

### Files

-   Restricted attachments require authorization.

------------------------------------------------------------------------

## 24. Observability

Provide:

-   structured logs
-   request/correlation IDs
-   error tracking integration point
-   health endpoint
-   readiness endpoint
-   queue health visibility
-   database health visibility
-   metrics integration point

Never log passwords, OTPs, tokens, sensitive identity documents or full
payment secrets.

------------------------------------------------------------------------

## 25. Development Rules for Cursor AI

Cursor must follow these rules.

### Rule 1 --- Documentation is source of truth

Before implementing a module, inspect `/docs`.

If implementation conflicts with documented architecture, stop and
identify the conflict.

### Rule 2 --- No speculative architecture

Do not introduce: - new databases - frameworks - state libraries -
microservices - infrastructure - major dependencies

without a clear need.

### Rule 3 --- Keep controllers thin

NestJS controllers: - validate/receive request - enforce guards - call
application/domain service - return response

Business logic belongs in services/domain code.

### Rule 4 --- Tenant scope every operation

Every tenant-owned query/mutation must derive and enforce tenant
context.

Do not accept a tenant ID from the request body as proof of access.

### Rule 5 --- Permission checks server-side

UI hiding is not authorization.

Backend must enforce permissions.

### Rule 6 --- Database invariants belong in the database too

Use: - foreign keys - unique constraints - transactions - appropriate
indexes

Do not rely only on frontend checks.

### Rule 7 --- Do not duplicate types casually

Use shared contracts/types only where they genuinely represent stable
cross-app contracts.

### Rule 8 --- Financial records are immutable-minded

Never silently edit posted financial history.

Implement explicit adjustments, cancellations, reversals and audit
trails.

### Rule 9 --- Validate all external input

Use DTO validation and safe parsing.

### Rule 10 --- Tests accompany critical logic

Billing, permissions, tenant isolation, booking concurrency and visitor
state transitions require automated tests.

### Rule 11 --- Keep commits/tasks small

Implement one coherent module/slice at a time.

Do not generate the entire application in one pass.

### Rule 12 --- No placeholder production behavior

Mocks/fakes are allowed in development/tests but must be clearly
isolated.

### Rule 13 --- Document decisions

Important architecture decisions should be recorded in
`/docs/decisions/`.

------------------------------------------------------------------------

## 26. Initial Data Entities

Expected early entities include:

``` text
User
Session
Society
SocietySetting
SocietyMembership
Role
Permission
RolePermission
MembershipRole

Building
Unit
UnitRelationship
PropertyAccessRequest

MaintenanceRule
MaintenanceRuleVersion
BillingRun
Invoice
InvoiceLine
Payment
PaymentAllocation
Receipt

Complaint
ComplaintComment
Notice
Meeting

Vehicle
Amenity
AmenitySlot/AvailabilityRule
AmenityBooking

Gate
SecurityAssignment
Visitor
VisitorEvent

ServiceType
ServicePerson
ServicePersonUnit

EmergencyContact
Vendor

Document
Attachment
Notification
AuditLog
```

This list is conceptual. Normalize/refine during database design before
generating migrations.

------------------------------------------------------------------------

## 27. Required Documentation Files

Create and maintain:

``` text
docs/
├── 01-PRODUCT-REQUIREMENTS.md
├── 02-FUNCTIONAL-REQUIREMENTS.md
├── 03-NON-FUNCTIONAL-REQUIREMENTS.md
├── 04-SYSTEM-ARCHITECTURE.md
├── 05-DATABASE-DESIGN.md
├── 06-RBAC-PERMISSIONS.md
├── 07-API-SPECIFICATION.md
├── 08-MULTITENANCY.md
├── 09-SECURITY.md
├── 10-MVP-SCOPE.md
├── 11-DEVELOPMENT-ROADMAP.md
├── 12-CURSOR-RULES.md
└── decisions/
```

This master document can initially be stored as:

``` text
docs/URBANGATE-2-MASTER-SPEC.md
```

and split into focused documents as Phase 0 proceeds.

------------------------------------------------------------------------

## 28. First Cursor Task

Do **not** implement all product modules yet.

Cursor's first task is:

1.  Read this complete specification.
2.  Create the proposed monorepo skeleton.
3.  Configure pnpm and Turborepo.
4.  Create NestJS API app.
5.  Create Next.js admin, resident and security apps.
6.  Configure shared TypeScript/ESLint/formatting.
7.  Configure MongoDB via `DATABASE_URL` (Docker Compose MongoDB + Redis
    deferred until Docker is available).
8.  Configure Prisma package (MongoDB provider).
9.  Add environment validation and `.env.example`.
10. Add API health endpoint.
11. Add structured logging foundation.
12. Add unit/integration test foundations.
13. Add CI for install, lint, typecheck and tests.
14. Create the `/docs` structure.
15. Do not implement business modules until the foundation is reviewed.

### Acceptance criteria

A new developer should be able to:

``` bash
git clone <repo>
pnpm install
docker compose up -d
pnpm dev
```

and start the development stack with documented prerequisites and
commands.

The API health endpoint must respond successfully, all apps must
compile, lint/typecheck must pass, and the initial test suite must pass.

------------------------------------------------------------------------

## 29. Phase 0 Decisions Still Required

Before or during foundation work, explicitly decide and document:

-   exact Node.js version
-   exact package versions after checking current stable compatibility
-   UUID / document ID strategy
-   authentication/session strategy
-   tenant resolution strategy
-   Prisma tenancy enforcement approach
-   datastore choice (MongoDB — decided in ADR-017)
-   object storage provider abstraction
-   email provider abstraction
-   frontend server-state approach
-   API error schema
-   audit log format
-   money/currency representation
-   date/time conventions
-   deployment target
-   CI/CD target
-   backup/restore strategy

Cursor should not silently choose irreversible architecture for these
items.

------------------------------------------------------------------------

## 30. Product Success Criteria

UrbanGate 2.0 MVP is successful when a real society can:

1.  onboard its society;
2.  configure buildings and units;
3.  add/invite residents;
4.  assign permissions;
5.  configure maintenance;
6.  generate bills;
7.  record payments and issue receipts;
8.  manage complaints and notices;
9.  manage gate visitors;
10. allow residents to perform their common self-service tasks from a
    phone;
11. allow security personnel to process visitors quickly;
12. maintain strict tenant isolation and auditable financial/admin
    actions.

------------------------------------------------------------------------

## 31. Guiding Principle

Build UrbanGate as a product that can serve one society correctly before
optimizing it to serve thousands.

Correct domain modeling, tenant isolation, financial integrity,
security, maintainability and user workflow quality take priority over
feature count.

**Do not build everything. Build the foundation, validate it, then
implement vertical slices.**
