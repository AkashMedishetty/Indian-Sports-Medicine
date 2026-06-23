# ISMC 2026 — Brand System

**Indian Sports Medicine Conference 2026**
Hyderabad · September 5–6, 2026 · Post-conference workshop September 7
Organized by the **Indian Association of Sports Medicine (IASM)** & **Telangana Association of Sports Medicine (TASM)**.

> The contract for art direction. Every concept page derives from this. Derived only from *this* client — no carried-over house style.

---

## 1. Who this is

A national clinical conference where **science meets sport**. The audience is sports physicians, orthopaedic surgeons, physiotherapists, sports scientists, athletic trainers and PG students — credibility-seeking professionals, but the *subject* is the human body at peak motion. The brand must hold two truths at once: **clinical precision** and **athletic energy**. It is the lab and the track in one room.

- **Positioning line:** Uniting Science, Practice & Performance for Stronger Athletes.
- **Support line:** Together, Advancing Sports Health. Elevating Performance.
- **The single feeling:** *the precise science behind peak human motion.* Clinical, kinetic, confident.

## 2. Color — a position, not a palette

Dominant **deep navy** field, decisive **signal-orange** accent, **electric blue** as the connective/secondary energy, on cool white. Orange is rationed — it marks the live, the vital, the "go." Sampled from the conference poster.

| Token | Hex | Role |
|---|---|---|
| `--ismc-navy` | `#0E2A57` | Dominant brand field, text on light |
| `--ismc-navy-deep` | `#0A1E40` | Deepest backgrounds, dark mode base |
| `--ismc-orange` | `#F5A524` | Signal accent — CTAs, vitals, "live" (rationed) |
| `--ismc-orange-deep` | `#E07B0A` | Orange pressed/hover, gradients |
| `--ismc-blue` | `#1E5BB0` | Electric blue — links, connective energy |
| `--ismc-sky` | `#4F8FE0` | Lighter blue — facets, depth, data lines |
| `--ismc-light` | `#F3F6FB` | Cool off-white surfaces |

Tokens live in `app/globals.css`, `tailwind.config.ts`, and `conference.config.ts.theme` (single source for the backend).

## 3. Typography

No Inter/Geist/system default on the marketing pages. Each concept runs its **own** type pairing (concepts must read as different studios), but all stay within these families:

- **Instrument / data voice (Concept 1):** `Space Grotesk` (display) + `IBM Plex Mono` (labels, data).
- **Athletic / cinematic voice (Concept 2):** a bold expanded display (`Archivo` / `Archivo Expanded`) + `Hanken Grotesk` body.
- **Editorial / poster voice (Concept 3):** high-contrast condensed display (`Anton` / `Archivo` heavy) + grotesque body.

Backend/admin pages keep the functional Geist base — they don't need the award treatment.

## 4. Motion & signature moment (one per concept)

Motion is authored, GPU-friendly (transform/opacity), with a real `prefers-reduced-motion` still-frame for every heavy moment.

- **C1 VITALS** — flatline springs to a heartbeat then a sprinter's gait; title assembles from monitor pixels. (Canvas/SVG + GSAP)
- **C2 IN MOTION** — a motion-capture point-cloud athlete assembles from scattered particles into a mid-stride pose, then loops a run cycle; joints flare orange. (R3F / three.js)
- **C3 CONVERGENCE** — two halves (lab-blue × field-orange) slide from opposite edges and lock at a seam under the title; draggable magnetic divider. (GSAP + Lenis + clip-path)

## 5. Imagery direction

Clinical-meets-kinetic. Anatomical line-art, motion-capture dots, kinesiology-tape underlines, ECG/EMG waveforms, faceted navy geometry, a restrained Charminar line motif for Hyderabad. Avoid stock-photo athletes and generic medical clip-art. Where photography is used, treat it duotone (navy/orange).

## 6. Voice samples

- *"Every stride is a system. We study the system so the stride never stops."*
- *"Two days. The clinic and the field, in one room. Then a workshop where you put your hands on it."*
- *"Diagnosis, repair, return-to-play — the full arc of an athlete, in evidence."*

## 7. Open items (need client input)

- Exact venue (currently "to be announced — Hyderabad").
- Official contact email / phone (Conference Secretary: **Dr. Nithin**).
- Registration categories & pricing (placeholders in `conference.config.ts`).
- Real logos for IASM + TASM (poster has both crests), OG image.
- Confirm domain (`indiansportsmedicine.com` assumed).
