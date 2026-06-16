# US-015 Add a second booking platform

**Intent:** `001-booksaver-agent-mvp`  
**Unit:** `005-extensibility-future`  
**Status:** Ready  
**Tag:** Future  
**Former grouping:** Future extensibility (stories not implemented in MVP)

## Story

**As a** user  
**I want** to plug in another OTA or airline site later  
**So that** I am not locked to Booking.com forever  

**Acceptance criteria**

- Given a platform adapter interface exists in design
- When a new adapter is implemented
- Then registration, check, compare, notify, and rebook flows can route per booking’s platform
- And Booking.com hotel behavior remains unchanged

---
