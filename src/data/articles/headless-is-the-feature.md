# Headless is the feature

A sales request can be simple: "Find open deals without a follow-up, then schedule a call for Acme."

A conventional CRM gives you filters, a pipeline board, a contact page, and an activity form. An agent can query the relevant records, identify the deal, and create the activity. It needs a schema it can understand and an API that enforces the rules of the business.

That is the premise behind [PocketContext](https://github.com/amiorin/pocketcontext) and [DealContext](https://github.com/amiorin/dealcontext). PocketContext gives coding agents SQL reads and PocketBase writes. DealContext is a CRM proof of concept built on it. Its user interface is the coding agent you already use. PocketBase's existing CRUD dashboard covers manual inspection and editing.

Headless is the feature. For an application operated by an agent, building a bespoke frontend spends tokens on an interface the operator does not need.

## The application is its schema and rules

Much of enterprise software describes familiar things. A CRM has people, organizations, deals, stages, activities, and notes. A scheduling application has hosts, availability, appointments, and cancellations. A project tracker has projects, tasks, assignments, and dependencies.

Agents can generate these schemas and implement the rules around them. There is no need to commission a new interface for each variation. Describe the business, have the agent write the migrations and validation, and verify the result with tests.

The important work is deciding what must always be true. A deal must reference an existing stage. Money needs a currency and a defined unit. Closing a deal should keep its status and closure date consistent. A scheduling application must prevent conflicting bookings even when two requests arrive together.

Those requirements belong in constraints, validation, hooks, and transactions. Agent instructions explain the workflow. They cannot substitute for the rule that rejects an invalid write.

An agent can know the common shape of a CRM without knowing your company's definition of a qualified opportunity. You still supply that requirement. The useful output is an executable rule and a test showing what it accepts and rejects. A screen that hides an invalid option would not protect the database from a different client anyway.

## PocketContext gives the agent two paths

[PocketBase](https://pocketbase.io/docs/) already supplies SQLite storage, authentication, record APIs, validation, and an administration dashboard. PocketContext extends it with a restricted SQL read endpoint and schema discovery.

<!-- pocketcontext-architecture -->

The read path accepts ordinary SQL. The agent can join contacts to deals, group pipeline value by currency, or find neglected opportunities without a separate tool for each question. Schema discovery tells it which tables and columns are available.

The write path uses PocketBase's standard BaaS API. Creating a contact, moving a deal, or recording a note goes through the same record operations as any other PocketBase client. Validation and application hooks remain part of that path. The agent never gets a SQL write connection.

This separation gives the agent freedom to investigate while keeping changes subject to application rules. It also avoids building a growing collection of tools such as `find_stale_deals`, `list_contacts_by_company`, and `sum_pipeline_value`. SQL already expresses those reads.

PocketContext uses a separate read-only connection to the same SQLite database, so it can see committed API writes without a synchronization job. A SQLite authorizer checks table and column access. The endpoint also restricts functions, rejects multiple statements, and bounds execution time and result size.

There is one important permission distinction. PocketBase's collection API rules do not automatically filter raw SQL. PocketContext has its own configured read allowlist. The current version supports one shared workspace, where every provisioned agent can read the same permitted context. Auth tables and hidden fields stay outside that context.

## DealContext proves the shape

DealContext borrows the sales concepts of a Pipedrive-style CRM. It is a proof of concept for the architecture, with seven CRM collections and a provisioned agent account type. It does not attempt Pipedrive feature parity.

The repositories have separate responsibilities:

| Repository | What it owns |
| --- | --- |
| PocketContext | The server, authenticated SQL reads, schema discovery, and query restrictions. |
| DealContext | CRM migrations, permissions, field validation, agent instructions, and workflow tests. |

That makes the CRM replaceable. A scheduling or project-tracking application could supply another schema and another set of business rules while using the same PocketContext server. External calendars, notification delivery, and other integrations would still need implementation. Removing the frontend does not remove the behavior users depend on.

Here is a CRM question expressed through the read path:

```sql
SELECT d.id, d.title, o.name AS organization
FROM deals d
LEFT JOIN organizations o ON o.id = d.organization
WHERE d.status = 'open'
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.deal = d.id
      AND a.done = 0
      AND a.due_at >= strftime('%Y-%m-%d %H:%M:%fZ', 'now')
  )
ORDER BY d.updated DESC
LIMIT 50;
```

The agent submits that SQL to `POST /api/context/query`. If the user asks it to schedule a call, it resolves the deal and owner IDs, translates the requested time to UTC, and creates a record through the normal API:

```http
POST /api/collections/activities/records
Authorization: <agent-token>
Content-Type: application/json

{
  "subject": "Follow up with Acme",
  "kind": "call",
  "deal": "<resolved-deal-id>",
  "owner": "<agent-id>",
  "due_at": "2026-09-25 09:00:00.000Z",
  "done": false
}
```

The date and IDs here are illustrative. If several deals match Acme, the agent must resolve the ambiguity before writing. The server can reject a missing deal reference, but it cannot infer that the user meant a different valid deal.

The integration test exercises this pattern against a real local server. It provisions an agent, creates an organization and contact, creates and moves a deal, schedules and completes an activity, records a note, and closes the deal. SQL reads verify the records after API writes. Separate tests reject SQL mutations, protected-table reads, and hidden-column access. The Go race tests and both repositories' CI passed for the initial implementation.

The proof of concept also exposes the next work. Field bounds and relations are validated today, but some lifecycle conventions, including setting closure dates with deal status, still live in agent instructions. Those need server enforcement before they can be treated as data-integrity guarantees. There is no automatic stage-history log or email synchronization yet.

## PocketBase's CRUD UI is enough

An agent-operated application does not require us to abandon every visual tool. PocketBase already has a dashboard for inspecting collections and editing records. That is enough for occasional manual administration.

The expensive part we can skip is the custom product interface: pipeline drag-and-drop, filter builders, responsive activity forms, navigation, and all the browser state connecting them. For this use case, those screens duplicate operations the agent can perform through SQL and HTTP.

The development budget can go into what survives every interface change. Test that an invalid relation fails. Test that unauthorized accounts cannot write. Test that two booking requests cannot reserve the same slot. Test what happens when a multi-request workflow succeeds halfway through and the agent retries it.

The agent can generate the implementation and its tests. We still need to inspect whether those tests express the actual business requirement. A passing test for the wrong rule is still the wrong application.

## Colors can package the deployment

A useful application also needs an address, persistent storage, email when required, and a way to recover after losing its machine. That is where [Colors](/) fits.

The proposed deployment is a Colors Package Skill that runs the application through [ONCE](https://github.com/getcolors/once), configures Cloudflare DNS, sets up Resend for email, and connects [Litestream](https://litestream.io/) to S3 for SQLite replication and recovery. The application owner supplies desired configuration and credentials; the package performs the repeatable setup.

| Component | Responsibility in the proposed deployment |
| --- | --- |
| Colors and ONCE | Provision the host and deploy the application with persistent storage. |
| Cloudflare DNS | Point the application's domain at its host. |
| Resend | Deliver email through the application's configured mail path. |
| Litestream | Continuously replicate SQLite changes to object storage. |
| S3 | Retain the replicated database data and other recovery artifacts. |

This deployment package has not been implemented for PocketContext yet. The CRM and SQL/API split are working code. The operational layer is the next step.

The goal is to make deployment routine, including recovery. A package should restore the database onto a replacement machine, start the pinned application version, and verify known records through the API. File uploads, if an application adds them, need their own backup coverage. Recovering SQLite alone would not recover those files.

Replication is also not a promise of zero data loss. Recovery depends on what reached object storage and what the retention policy kept. A restore rehearsal is the evidence that the configuration protects an application. An S3 bucket name in a YAML file is not that evidence.

## Build the business behavior

DealContext is the first example. The broader idea is that familiar enterprise applications can be rebuilt around agent-readable data and server-enforced rules, with PocketBase handling storage, APIs, and manual administration.

The frontend is no longer the first deliverable. The first deliverables are the schema, the rules, and the tests. Colors can then make the deployment and recovery procedure repeatable.

The code is public in [PocketContext](https://github.com/amiorin/pocketcontext) and [DealContext](https://github.com/amiorin/dealcontext). Start with DealContext's agent instructions and schema, inspect the workflow test, and decide which business rule your own application needs next.

## Further reading

This experiment draws on three sets of notes: [YC's AI playbook](https://gist.github.com/amiorin/e87a69b752a627c12f1a10b4483e0f6d), on giving agents access to shared organizational data; [the context warehouse](https://gist.github.com/amiorin/2b112bdcc763d26871d77ff7165ce3fa), on bringing fragmented context into a queryable store; and [managing agent context through SQL](https://gist.github.com/amiorin/22ba97453a3503b74b25a004f38ca5fa), on schemas, views, and bounded queries. These summaries informed PocketContext's SQL read path. DealContext explores what happens when the agent also becomes the application's everyday interface.
