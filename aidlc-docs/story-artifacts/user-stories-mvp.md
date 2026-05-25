# User stories — MVP (Booking.com hotels)

Scope: [`../requirements/mvp-scope.md`](../requirements/mvp-scope.md)

**Tags:** `MVP` = this release; `Future` = explicit placeholder for extensibility.

---

## Epic: Local daemon

### US-001 Run BookSaver as a local daemon — MVP

**As a** user on my own computer  
**I want to** start and stop BookSaver as a background daemon  
**So that** price checks run on a schedule without me keeping a terminal open  

**Acceptance criteria**

- Given BookSaver is installed locally
- When I start the daemon with my local config
- Then it runs as a background process on my machine (not a remote service)
- And scheduled jobs run according to my configured interval
- And I can stop the daemon cleanly without corrupting local state

---

### US-002 Configure daemon locally — MVP

**As a** user  
**I want to** set schedule, paths, and notification settings in local config  
**So that** the tool behaves for my household without a cloud account  

**Acceptance criteria**

- Given a config file or local config directory on my machine
- When I set check interval, data directory, email, and Telegram settings
- Then the daemon loads them on startup
- And secrets are not committed to git or sent to a BookSaver-hosted backend
- And misconfiguration produces a clear local error message

---

## Epic: Register booking

### US-003 Register a refundable Booking.com hotel — MVP

**As a** user  
**I want to** register an existing Booking.com hotel booking for monitoring  
**So that** the daemon knows what to watch and my original price baseline  

**Acceptance criteria**

- Given I have a refundable hotel reservation on Booking.com
- When I register the booking (confirmation id, dates, property, room type, amount paid, refundability note)
- Then the booking is stored in local persistence
- And the original total price and currency are recorded as the baseline
- And only Booking.com hotel bookings are accepted in MVP (other types rejected with clear message)

---

### US-004 Store Booking.com session locally — MVP

**As a** user  
**I want to** authenticate to Booking.com in a browser context the daemon controls  
**So that** automated checks can reach my manage-booking pages  

**Acceptance criteria**

- Given browser automation is configured
- When I complete login (or refresh session) through the supported local flow
- Then session cookies or credentials are stored only on my machine
- And the daemon can reuse the session for scheduled checks until expiry
- And session expiry surfaces a local alert telling me to re-authenticate

---

## Epic: Scheduled price check

### US-005 Run scheduled browser check — MVP

**As a** user  
**I want** the daemon to periodically open my booking on Booking.com via browser automation  
**So that** I get an up-to-date live price without manual visits  

**Acceptance criteria**

- Given a registered booking and valid local session
- When the schedule triggers
- Then the daemon launches browser automation against Booking.com (not a travel API)
- And it navigates to the booking’s manage/view flow for that reservation
- And each run appends a check record (timestamp, outcome, raw price if parsed) to local storage
- And transient failures are logged and retried without deleting the booking

---

### US-006 Extract booking and offer data with LLM — MVP

**As a** user  
**I want** the system to use an LLM to interpret complex booking pages  
**So that** price and policy details are extracted reliably when the DOM is messy  

**Acceptance criteria**

- Given a Booking.com page is loaded in the automated browser
- When structured selectors are insufficient or ambiguous
- Then the daemon invokes the configured LLM API with page context for extraction/reasoning
- And extracted fields include at minimum: current total price, currency, and cancellation/refund indicators
- And LLM API keys are read from local config only
- And extraction failures are logged and do not crash the daemon

---

## Epic: Compare and detect savings

### US-007 Compare live price to baseline — MVP

**As a** user  
**I want** the daemon to compare the live equivalent offer to what I paid  
**So that** I only hear about real savings opportunities  

**Acceptance criteria**

- Given a successful check with parsed live price
- When live total is strictly less than my stored baseline (same currency)
- Then the booking is flagged as a potential savings opportunity
- When live total is greater or equal
- Then no savings alert is raised for that run

---

### US-008 Enforce pragmatic equivalence and refundability — MVP

**As a** user  
**I want** “cheaper” to mean same stay and room, still refundable  
**So that** I am not pushed toward worse or non-refundable deals  

**Acceptance criteria**

- Given a candidate live offer
- When dates differ from my registered check-in/out
- Then it is rejected as not equivalent
- When property or room type differs
- Then it is rejected as not equivalent
- When cancellation terms are not refundable (free cancellation / refundable policy absent per extraction)
- Then it is rejected even if price is lower
- When dates, property, and room match and offer is refundable
- Then it may proceed to notification (policy tier may differ from original if still refundable)

---

## Epic: Notify user

### US-009 Notify via email and Telegram — MVP

**As a** user  
**I want** email and Telegram alerts when savings are found  
**So that** I can act before the rate changes again  

**Acceptance criteria**

- Given a validated savings opportunity
- When notification runs
- Then I receive an email with booking id, baseline vs live price, and percent/amount saved
- And I receive a Telegram message with the same core facts
- And messages include a pointer to start the guided rebook flow (local CLI or documented command)
- And notification failures for one channel do not block the other (both attempted; failures logged)

---

## Epic: Guided rebook (safety)

### US-010 Start guided rebook only after explicit intent — MVP

**As a** user  
**I want** to opt in before any rebook automation runs  
**So that** nothing is cancelled or purchased without my approval  

**Acceptance criteria**

- Given a savings alert
- When I have not started a rebook session
- Then the daemon performs no cancel or purchase actions
- When I explicitly start guided rebook for that booking id
- Then browser automation prepares the rebook path but waits at confirmation gates

---

### US-011 Mandatory confirmation before cancel or purchase — MVP

**As a** user  
**I want** a clear confirmation step before cancel or new booking  
**So that** I remain in control of money and itinerary changes  

**Acceptance criteria**

- Given an active guided rebook session
- When the flow reaches a cancel-existing or confirm-new-booking action
- Then the daemon stops and presents what will happen (old vs new price, refundability summary)
- And it requires explicit yes/no confirmation from me in the local interface
- When I decline
- Then no cancel or charge occurs and the session ends safely
- When I confirm
- Then automation may proceed only for that single approved action
- And each subsequent destructive step requires a new confirmation

---

### US-012 Log rebook outcomes locally — MVP

**As a** user  
**I want** a local audit trail of rebook attempts  
**So that** I can troubleshoot what the agent did on my behalf  

**Acceptance criteria**

- Given any guided rebook session
- When steps complete or fail
- Then events (started, confirmation requested, confirmed, cancelled by user, completed, error) are appended to local logs/storage
- And logs stay on my machine

---

## Epic: Operations and trust

### US-013 Operate without a BookSaver cloud — MVP

**As a** user  
**I want** all booking and check data to stay on my machine  
**So that** I am not tied to a vendor account for a personal tool  

**Acceptance criteria**

- Given the daemon is running
- When checks and notifications occur
- Then booking details and history are read/written only to local persistence
- And there is no requirement to register with a centralized BookSaver service

---

### US-014 Handle check failures gracefully — MVP

**As a** user  
**I want** failed checks to be visible but non-fatal  
**So that** one broken session does not delete my monitoring setup  

**Acceptance criteria**

- Given a check fails (network, captcha, layout change, LLM error)
- When the run ends
- Then failure reason is logged locally
- And the booking remains registered for the next scheduled run
- And repeated failures can trigger a local warning (configurable threshold) — MVP: log + optional single alert

---

## Epic: Future extensibility (stories not implemented in MVP)

### US-015 Add a second booking platform — Future

**As a** user  
**I want** to plug in another OTA or airline site later  
**So that** I am not locked to Booking.com forever  

**Acceptance criteria**

- Given a platform adapter interface exists in design
- When a new adapter is implemented
- Then registration, check, compare, notify, and rebook flows can route per booking’s platform
- And Booking.com hotel behavior remains unchanged

---

### US-016 Support non-hotel product types — Future

**As a** user  
**I want** flights or other products with their own equivalence rules  
**So that** the same daemon can expand beyond hotels  

**Acceptance criteria**

- Given a booking type other than hotel
- When registered
- Then equivalence rules are selected per product type
- And MVP hotel rules on Booking.com are unchanged

---

## Requirement traceability

| Requirement theme | Stories |
|-------------------|---------|
| Local daemon workflow | US-001, US-002, US-013 |
| One-user / small trusted circle | US-002, US-013 |
| Browser automation, not APIs | US-005, US-010 |
| Explicit MVP scoping | US-003, US-008; US-015–016 Future |
| Refundable booking constraints | US-003, US-008 |
| Safety & confirmation on rebook | US-010, US-011 |
| Future platform extensibility | US-015, US-016 |
| LLM for interpretation | US-006 |
| Email + Telegram notify | US-009 |
