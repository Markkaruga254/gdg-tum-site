# GDG TUM Writeups Editorial Backlog

## Editorial direction

The Writeups section should document the community's real learning activities and publish practical technical resources that remain useful after an event. Event-led articles should be the primary source of community identity; evergreen explainers and tutorials should extend the learning.

### Content types

1. **Session recaps** — what was actually covered, demonstrated, built, discussed, and learned. Require confirmation from the session lead or reliable session notes.
2. **Practical companion guides** — independently useful tutorials based on the technical subject of a session. These may be published without claiming that every step was demonstrated during the event.
3. **Community/project stories** — verified accounts of hackathons, projects, collaborations, and outcomes. Require participant/organiser confirmation and evidence for claims.

## Editorial rules

- Never infer that an advertised activity happened exactly as planned.
- Never invent attendee experiences, questions, demos, project outcomes, quotes, speaker names, or attendance.
- Event listings are evidence of the advertised scope and date, not proof of what was delivered.
- Treat an attendance value of zero or a missing value as unavailable, not as zero attendees.
- Verify technical instructions against current primary documentation before publication.
- Use named authors only after confirming authorship and obtaining their review. Otherwise use an approved chapter/track byline.
- AI-assisted drafts must be substantively reviewed by the named lead before publication; disclose AI drafting according to the site's existing metadata.
- Every article needs a useful summary, clear learning outcomes, structured body, relevant links, correct track, and a connected event when it is event-led.
- Avoid publishing placeholder text or thin recaps written only to populate the page.

## Candidate editorial backlog

The following candidates are based on the October 2026 event records and their linked public event descriptions in `src/lib/gdg-events.ts`. Unless explicitly marked verified below, they are **editorial leads, not verified session reports**. A track lead must confirm the actual session content before any recap is published.

| Priority | Track | Event / source | Proposed writeup | Format | Verification needed |
|---|---|---|---|---|---|
| 1 | Cloud | [Cloud Track Week 1: Cloud Fundamentals](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-cloud-track-week-1-cloud-fundamentals/) | Getting Started with Cloud Computing: Inside GDG TUM's Cloud Track Kickoff | Session recap | **Lead-confirmed and drafted** in `docs/writeups/drafts/cloud-track-week-01-cloud-fundamentals.md`; verify final metadata and website rendering before publication |
| 2 | Cloud | [Docker in Practice: From First Container to Production](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-docker-in-practice-from-first-container-to-production/) | Docker in Practice: from your first container to safer, leaner deployments | Companion guide + optional recap | Confirm exercises, Compose coverage, image optimisation and security topics actually delivered |
| 3 | Cloud | [Tools of the Trade Workshop: Linux, Git, & Docker](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-tools-of-the-trade-workshop-linux-git-amp-docker/) | Linux, Git and Docker: the developer toolkit, explained through a practical workflow | Companion guide + optional recap | Confirm which tools/demos were actually completed; confirm any Cloud Run exercise |
| 4 | Web | [Kickstart Your Web Development Journey](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-kickstart-your-web-development-journey/) | How HTML, CSS and JavaScript work together to power the web | Beginner tutorial + optional recap | Confirm the actual examples and exercises used |
| 5 | Web | [Web Development Essentials Make-Up Session](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-web-development-essentials-make-up-session-1/) | From a static page to an interactive page: a guided HTML/CSS/JS exercise | Practical tutorial + optional recap | Confirm the make-up session content and whether an exercise/project was completed |
| 6 | AI/ML | [AI/ML Track Launch: Introduction and Python Basics for AI/ML](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-aiml-track-launch-introduction-and-python-basics-for-aiml/) | Python foundations for an AI/ML workflow: data, preprocessing and model training | Beginner guide + optional recap | Confirm Python libraries, demos, datasets and whether model training was performed |
| 7 | Cybersecurity | [Discovering the Cybersecurity World: Would You Survive a Phishing Attack?](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-discovering-the-cybersecurity-world-would-you-survive-a-phishing-attack/) | Phishing explained: warning signs, safe verification and account protection | Security explainer + optional recap | Confirm scenarios, practical examples and advice presented |
| 8 | Mobile | [Kickstart Your Mobile Development Journey](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-kickstart-your-mobile-development-journey/) | Android, Kotlin and Flutter: choosing a starting point for mobile development | Comparison/guide + optional recap | Confirm setup steps, Kotlin examples and Flutter demonstration actually delivered |
| 9 | Web / Foundations | [Foundation Lab Series: Building Tech Fundamentals](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-foundation-lab-series-building-tech-fundamentals/) | The foundations behind the web: networking, Linux and browser fundamentals | Learning-path guide + optional recap | Confirm which labs ran, exercises completed and how the Cyber Clinic was structured |
| 10 | Chapter | [Info Session](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-info-session/) | Getting involved in GDG TUM: tracks, learning paths and how to participate | Community guide / event recap | Confirm chapter plans and details shared; get organiser approval |

## First publication candidate

**Cloud Track Week 1 recap**

The lead-confirmed recap is drafted in `docs/writeups/drafts/cloud-track-week-01-cloud-fundamentals.md`. It records the topics and guided Cloud Shell demonstration confirmed by the Cloud Track lead. It is a source draft only; it has not been written to production Firestore or published on the website.

**Docker in Practice: From Your First Container to Safer, Leaner Deployments**

The practical companion guide in `docs/writeups/drafts/docker-in-practice.md` teaches Docker concepts and workflows independently. It must not be presented as a factual recap of the October session until the Cloud Track lead confirms what was actually covered.

## Publication workflow

1. Select a candidate and identify the responsible track lead.
2. Gather the event notes, slides, demo repository, photos (with permission), and corrections from the lead.
3. Draft the technical guide and/or factual recap as separate pieces when that improves clarity.
4. Verify every command, code sample, external link, and event-specific claim.
5. Ask the named author/lead to review and approve the final draft.
6. Add it through the site's existing writeup workflow as a draft; verify author, track, event, tags, resources and AI-drafting metadata.
7. Publish only after editorial and technical review, then check the public listing and detail page.

## Primary technical references

- [Docker: What is Docker?](https://docs.docker.com/get-started/docker-overview/)
- [Docker: Get started with containers](https://docs.docker.com/learn/paths/get-started-with-docker-containers/)
- [Docker: Building best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker: Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
