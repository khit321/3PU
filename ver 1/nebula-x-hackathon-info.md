# Nebula X Hackathon 2026 — Master Info Doc

> Purpose: single reference file with everything about the **event itself** (dates, venue, rules, schedule, submission requirements, logistics). For our team's own project plan/strategy, see the separate `nebula-x-master-doc.md`.

## 1. Event Overview
- **Name:** NEBULA X Hackathon 2026 — theme "The Living Railway — Build the Future of Mobility"
- **Organiser:** Land Transport Authority (LTA) Rail Digitalisation & Guild
- **Supported by:** NUS College of Design and Engineering (CDE), Google Cloud, SMRT Corporation, SBS Transit, CRRC
- **Dates:** Friday 18 Sep 2026, 5pm → Sunday 20 Sep 2026, 5pm
- **Venue:** NUS Block EA (Engineering Auditorium / College of Design and Engineering), 9 Engineering Dr 1, Singapore 117575
- **Eligibility:** Any student currently enrolled in a Singapore university or polytechnic (Institute of Higher Learning) at time of registration and throughout the hackathon
- **Team size:** 3–4 members per team
- **Cost:** Free to enter; selected meals provided
- **Format:** In-person, presentations required Day 2 (top 10 selection) and Day 3 (finalist presentations)
- **Website:** https://nebulax.com.sg/ · **Telegram:** @NebulaXHackathon · **Enquiries:** LTA_Nebula_X@lta.gov.sg

## 2. Problem Tracks (3 total)
### PS1 — AI Maintenance Scheduler ("Smarter planning, better outcomes")
- **Problem:** Track maintenance/upgrades/renewals must be squeezed into short engineering hours; competing requests across sector availability, work compatibility, and engineer availability cause conflicts that need tedious manual coordination.
- **Mission:** Build a tool that automatically detects conflicts between maintenance requests, flags them, suggests alternatives, and automates scheduling.
- **Possible datasets:** MRT station locations API, key planning consideration data.

### PS2 — Smart Travel Companion ("Smarter decisions, smoother journeys")
- **Problem:** LTA's network moves millions of commuters daily; needs real-time coordination to prevent bottlenecks from passenger surges, varying train frequencies, shifting commuter flows.
- **Mission:** Build a smart commuter companion app giving proactive decision support during planned/unplanned events, tailored to commuters.
- **Possible datasets:** Public MRT service alerts, bus service data (alternate routing), real-time train arrivals/service data, rail station GeoJSON.

### PS3 — Predictive Fault Detection ("A living railway whispers secrets about our trains") ⭐ Our team's chosen track
- **Opportunity:** Modern trains are dense digital ecosystems — smart doors, braking relays, bogie temperature sensors, etc. stream high-velocity telemetry every second. Hidden in this data are early signatures of wear and tear.
- **Mission:** Build a tool embedded with AI/ML models to detect anomalies across signals from various train systems, and identify the best models for detecting future anomalies.
- **Challenge (as stated):** Detect anomalies amid signals from various train systems; identify best model(s) for future anomaly detection.
- **Possible datasets:** Train door data, bogie data, manually verified fault data.
- **PS3-specific submission requirement:** a folder of `*_predictions.csv` files (see `Problem_Statement_3_Specifications.md`, provided by organisers) — in addition to the standard submission items below.

## 3. Prizes
| Placement | Prize |
|---|---|
| 1st (Champion) | $5,000 |
| 2nd (Runner-up) | $3,000 |
| 3rd | $2,000 |
| 4th–10th (finalists) | $600 each (7 teams) |
| Most Unique (special) | $200 |
| Best Aesthetics / UI-UX (special) | $200 |
| Most Popular / crowd favourite via Devpost (special) | $200 |

Judging criteria: technical execution, problem fit, ease of use, real-world impact — judged by a panel of railway professionals and industry partners. Cash prize claim instructions sent to winners after the event concludes.

## 4. Full Schedule

### Day 1 — Fri 18 Sep
| Time | Activity | Location |
|---|---|---|
| 4.30pm | Registration opens | EA Foyer |
| 4.45pm | Doors open (seated by 5.25pm) | LT7A |
| 5.30pm | Safety & logistics briefing | Engineering Auditorium (live streamed) |
| 5.40pm | Arrival of Guest of Honour: Minister for Transport | — |
| 5.50pm | Opening remarks | — |
| 6.10pm | Dinner & networking | EA Atrium / The Lodge |
| 7.00pm | Google Workshop — Architecting the Future: Agentic Solutions with Google Cloud Gemini Enterprise Suite (registered participants only) | LT7A |
| 7.00pm–10.00pm | Mentor consultation session | EA 02-14, 02-15 |
| 7.45pm–10.00pm | Hack development & networking bingo | — |

*(Website version adds: 5.00–5.30pm Welcome Address & brief, 5.30–6.00pm Kahoot community quiz — slightly different ordering from the info pack; both sources agree on registration at 4.30pm and dinner ~6pm.)*

### Day 2 — Sat 19 Sep
| Time | Activity | Location |
|---|---|---|
| 9.00am | Mentor consultation session | EA 02-14, 02-15 |
| 11.30am–12.30pm | Lunch | EA Foyer and Atrium |
| 2.30pm | Submission counter opens | EA Foyer |
| 3.00pm | Mentor consultation session ends | EA 02-14, 02-15 |
| **4.00pm** | **SUBMISSION DEADLINE — no extensions, may submit early** | EA Foyer |
| 4.30pm–10.00pm | Judging & selection of top 10 teams | — |

### Day 3 — Sun 20 Sep
| Time | Activity | Location |
|---|---|---|
| 9.30–10.30am | Announcement of Top 10 finalists (physical + Telegram) | LT7A |
| 10.30am | Recruitment sharing by CRRC Sifang | LT7A |
| 11.00–11.30am | Recruitment talk | — |
| 12.00pm | Lunch | EA Foyer and Atrium |
| 1.00pm–2.30pm | Finalist presentations, first 5 teams (10 min/team) | LT7A |
| 2.30pm | Intermission | — |
| 3.00pm–4.00pm | Finalist presentations, remaining 5 teams (10 min/team) | LT7A |
| 4.00pm–5.00pm | Judges evaluation/deliberation | — |
| 5.00pm | Announcement of Top 3 awardees + special awards | LT7A |

## 5. Registration
- **Location:** NUS EA Foyer, Level 1 — **Time:** 4.30pm, 18 Sep — **Closes:** 8pm, 18 Sep
- At least 1 team member must register in person; show student ID, verify team name + members
- Event lanyard issued per member (must be worn at all times)
- Unique team **passkey** + QR code issued for the submission platform — screenshot/photo it, don't lose it
- Confirmation of participation is via official email from LTA_Nebula_X@lta.gov.sg with subject "[Nebula X Hackathon 2026] Registration Status Update" — Luma registration alone does NOT confirm a spot
- If arriving after general registration ends, approach the info counter at Block EA Level 1

## 6. Submission
- **Deadline:** 19 Sep, 4.00pm sharp — no extensions; early submission allowed
- Minimum 1 team member must physically sign in at the submission counter (EA Atrium, outside LT7A; counter opens 2.30pm)
- **Requirements — PS1 & PS2:**
  1. GitHub repository (URL + README)
  2. Link to hosted prototype
  3. 2–3 minute video pitch
  4. Short write-up: solution, uniqueness, tech stack used
  5. Zip file with results
- **Requirements — PS3 (our track)** — same as above **plus**:
  4. Prediction output: a folder of `*_predictions.csv` files (per `Problem_Statement_3_Specifications.md`)
- **Submission process:** Upload via the Hackathon Portal (QR code/link released 18 Sep 2026). Log in with the team's 6-character passkey issued at registration.

## 7. Rules
1. At least 1 team member must be physically present on both Day 1 (registration) and Day 2 (hackathon day) — or risk disqualification
2. Top 10 finalist teams must confirm attendance when notified and be physically present at the venue on time on Day 3, or risk disqualification
3. No team member changes allowed at any point during the hackathon
4. Problem statement selected at registration (on Luma) is final — cannot be changed
5. All participants must be enrolled in an IHL at registration and throughout the event
6. Participants must comply with organiser instructions and judging requirements
7. Organiser can disqualify/revoke eligibility/withdraw prizes for breaches, false info, misconduct (e.g. inappropriate team names), or compromising fairness
8. All organiser/judging panel decisions (eligibility, judging, awards, disqualification, conduct) are final

## 8. Working Locations (where teams can build)
| Location | Fri 18 Sep | Sat 19 Sep | Sun 20 Sep |
|---|---|---|---|
| The Lodge | 6–9pm | – | – |
| Open benches across CDE | All day | All day | All day |
| EA Atrium | 7pm onwards | All day | All day |
| EA Foyer | 7pm onwards | All day | All day |
| Engineering Auditorium | 7pm onwards | All day | All day |
| LT7A | 8pm onwards | All day | All day |
| LT7 | Open only when needed | | |

Nebula X is an **overnight hackathon**, but there's **no requirement** to work overnight on campus — teams may work elsewhere. Tutorial rooms are out of bounds at all times. The venue (NUS EA Block) has a reserved overnight space with air conditioning and light refreshments for those staying.

## 9. Facilities & Wayfinding
- **24-hour food:** Cheers Unmanned Store (Block E3, Level 6); vending machine clusters outside LT6 and at Block E5 Level 1; more options ~10–15 min walk at NUS University Town
- **Other food (Sat 19 Sep only):** Arise and Shine (Block E3 L6, 8.30am–3.30pm); Techno Edge Canteen (7.30am–2.30pm, limited stalls)
- **Shower facilities:** Block EA Level 3 All-Access Restroom (via Lift Lobby 1); SDE4 Levels 1 (female) / 2 (male); also at Multi-Purpose Sports Hall, NUS University Sports Centre, University Town Stephen Riady Centre
- **Toilets/watercoolers:** Nearest to registration is EA Level 1; watercoolers scattered across engineering blocks (see floor maps in info pack)
- **Meals provided by organiser:** Dinner 18 Sep; Lunch 19 & 20 Sep; light refreshments for overnight stayers

### Getting to NUS Block EA
- **From Clementi MRT/Interchange:** Bus 96 → alight Bus Stop 16159 (College of Design and Engineering) → side glass door entrance → walk to BLK EA Level 1 Atrium
- **From Haw Par Villa MRT:** Walk to Bus Stop 16011 (Opp Haw Par Villa Stn) → Bus 188 → alight Bus Stop 16151 (Japanese Primary School) → overhead bridge to BLK EA → side glass entrance → EA Level 1 Atrium
- **From Kent Ridge MRT:** Board Bus 95 or NUS Internal Shuttle A2/K at Kent Ridge Stn Exit A → alight Central Library Bus Stop → cross road, climb hill → up the stairs, turn left → follow signage/yellow ceilings to EA (no stairs/lifts needed except the one lift at EA)

## 10. WiFi (for non-NUS students)
- **SSID:** NUS_Guest — **PIN:** 0UFDSR — **Event location:** LT7A
- Connect to NUS_Guest → select "Event Login" → enter PIN above

## 11. Google Cloud Platform Access (7 steps)
1. Log in to the Hackathon Portal → find your hackathon workspace URL → enter your email (the one used on Luma registration)
2. You'll see a credentials page — click through to the Google Cloud console link. **Note your username and password** (unique per team)
3. Open an **Incognito window**, paste the console link, sign in with the same email
4. Enter the password from step 2
5. Click "I understand" on the account welcome screen
6. Tick "I agree to the Terms of Service" → Agree and continue
7. Full access granted. Double-check top-left shows the correct project selected (matching step 2) — if it says "Select a project," pick it manually

### For the Google Workshop (18 Sep, 7pm) — Download Antigravity BEFOREHAND
1. Go to https://antigravity.google/download/
2. Download either (a) Antigravity 2.0 standalone, or (b) install as a VS Code extension (follow site instructions)
3. Don't take further action until guided live during the workshop on login

### GCP Labs Available (pre-hackathon learning / Google Cloud Skills Boost style labs)
Includes (non-exhaustive, from the labs list provided):
- Google Cloud Fundamentals: Getting Started with Compute Engine
- Google Kubernetes Engine: Qwik Start
- Cloud Run Functions: Qwik Start (Console & Command Line)
- Cloud Storage: Qwik Start (Console & CLI/SDK)
- Cloud Spanner: Qwik Start
- AlloyDB – Database Fundamentals
- Explore Data with Gemini in BigQuery
- BigQuery: Qwik Start – Console
- Import Data to a Firestore Database
- Pub/Sub: Qwik Start (Console & Python)
- Build No-Code Agents with Agent Designer
- Build and deploy ADK Agents with Google Agents CLI in Agent Platform

> These look like optional self-paced prep labs (likely via Google Cloud Skills Boost) rather than a mandatory checklist — worth working through the ones relevant to our AI model + agent/chatbot pieces (BigQuery/Gemini, Firestore, Pub/Sub, and the two Agent-building labs are most relevant to our stack).

## 12. Site Visits (exclusive to registered teams)
- **CRL Tunnel** — underground worksite tour, tunnel systems, safety brief (28 Aug)
- **SMRT Depot** — maintenance base, depot ops, rolling stock (11 Sep)
- **Singapore Rail Test Centre (SRTC)** — testing/integration of new trains (10 Sep)
- **LTOC (command centre)** — SBST & LTA RDG sharing at the Land Transport Operations Centre (16 Sep)
Registration for these was via a form shared with shortlisted teams.

## 13. Key Dates Timeline (Jul–Sep 2026)
| Date | Event |
|---|---|
| 10 Jul | Registration opens |
| 1 Aug, 23:59 | Registration closes |
| 28 Aug | Site visit — CRL Tunnel |
| 2 & 9 Sep | Workshop — "Ideas Worth Breaking Things For" (with NUS CDE) |
| 10 Sep | Site visit — Singapore Rail Test Centre |
| 11 Sep | Site visit — SMRT Depot |
| 12 & 16 Sep | Workshop — "UI/UX Design in the Age of AI" (with NUS CDE) |
| 16 Sep | Site visit — LTOC |
| 18 Sep, 4.30pm | Hackathon kick-off |
| 19 Sep, 4.00pm | Submission deadline → judging → top 10 announced |
| 20 Sep | Finals, closing ceremony, awards |

## 14. Safety & Support
- **NUS Campus Security:** 6874 1616 (24 hrs)
- **SCDF (Fire/Ambulance):** 995 — **Police:** 999
- **Student Liaisons (Telegram):** Faith Yap – @stones_and_pebbles; Choy Keanric – @Ravenguy96 (overnight)
- **Staff Advisor:** Assoc. Prof Teo Chiang Juay – mpeteocj@nus.edu.sg
- **Zero-tolerance policy:** harassment of participants/staff, alcohol/tobacco possession or consumption, and unruly behaviour → immediate disqualification + removal from venue; police informed if necessary. Report to venue supervisor or the contacts above.
- **General enquiries:** LTA_Nebula_X@lta.gov.sg

## 15. FAQ Highlights
- **Participation confirmation:** Only the official confirmation email (31 Aug 2026, subject "[Nebula X Hackathon 2026] Registration Status Update") counts — Luma sign-up alone isn't confirmation.
- **Arriving late:** Registration cutoff 8pm, 18 Sep; approach EA Level 1 info counter if general registration has ended; only 1 member needs to register for the team.
- **Team name changes:** Not allowed, except if organiser flags it as duplicate/inappropriate.
- **Team member changes:** Frozen after registration closes; exceptions reviewed case-by-case, not guaranteed; discovered swaps risk disqualification.
- **Overnight hackathon:** Space reserved on campus, but no requirement to stay overnight on-site.
- **What to bring:** Student ID, laptop, charger (+ any hardware needed).
- **Mentors:** Available at scheduled mentor sessions (see schedule) — approach them during those windows.
- **Cash prizes:** Claim instructions sent after the event concludes.
- **Stay updated:** Telegram — http://t.me/NebulaXHackathon — plus email inbox.

## 16. Related Files
- Our team's project plan/strategy for PS3 (Predictive Fault Detection): see `nebula-x-master-doc.md`
