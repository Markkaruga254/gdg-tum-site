export interface GdgEventImport {
  id: string;
  title: string;
  trackId: "chapter" | "cloud" | "web" | "ai-ml" | "cybersecurity" | "mobile";
  date: string;
  venue: "Online" | "Google Meet" | "Bevy Virtual Conference";
  description: string;
  attendance?: number;
  sourceUrl: string;
}

export const GDG_OCTOBER_2026_EVENTS: GdgEventImport[] = [
  {
    id: "gdg-2026-10-05-info-session",
    title: "Info Session",
    trackId: "chapter",
    date: "2026-10-05T13:30:00.000Z",
    venue: "Online",
    description: "A chapter-wide kickoff for the new semester. The session introduced the community, shared plans for the semester and gave members an opportunity to meet the core team and connect with fellow students interested in technology.",
    attendance: 34,
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-info-session/",
  },
  {
    id: "gdg-2026-10-12-cloud-fundamentals",
    title: "Cloud Track Week 1: Cloud Fundamentals",
    trackId: "cloud",
    date: "2026-10-12T11:30:00.000Z",
    venue: "Bevy Virtual Conference",
    description: "An introductory session on cloud computing and the IaaS, PaaS and SaaS service models. The session also guided learners through securely setting up a Google Cloud account and using Google and GitHub accounts with two-factor authentication. It was designed for beginners and did not require prior cloud experience.",
    attendance: 48,
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-cloud-track-week-1-cloud-fundamentals/",
  },
  {
    id: "gdg-2026-10-15-web-development-journey",
    title: "Kickstart Your Web Development Journey",
    trackId: "web",
    date: "2026-10-15T07:00:00.000Z",
    venue: "Bevy Virtual Conference",
    description: "A beginner-friendly introduction to the building blocks of the web, covering HTML for page structure, CSS for presentation and JavaScript for interactivity. The session was intended to help newcomers establish a foundation while giving learners with some experience an opportunity to revisit and strengthen core concepts.",
    attendance: 0,
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-kickstart-your-web-development-journey/",
  },
  {
    id: "gdg-2026-10-15-ai-ml-python-basics",
    title: "AI/ML Track Launch: Introduction and Python Basics for AI/ML",
    trackId: "ai-ml",
    date: "2026-10-15T11:00:00.000Z",
    venue: "Google Meet",
    description: "The AI/ML track launch introduced foundational machine-learning concepts and the role of Python in practical AI/ML workflows. The advertised session included Python demonstrations and an introduction to data preprocessing and model training. Python familiarity was useful, but the session was structured to introduce the concepts to learners building their foundations.",
    attendance: 0,
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-aiml-track-launch-introduction-and-python-basics-for-aiml/",
  },
  {
    id: "gdg-2026-10-16-cybersecurity-phishing",
    title: "Discovering the Cybersecurity World: Would You Survive a Phishing Attack?",
    trackId: "cybersecurity",
    date: "2026-10-16T13:30:00.000Z",
    venue: "Online",
    description: "An introduction to cybersecurity through the lens of everyday digital threats. Topics included the CIA Triad, recognising common online risks, safer handling of personal data, mobile-device safety and possible career paths in cybersecurity.",
    attendance: 9,
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-discovering-the-cybersecurity-world-would-you-survive-a-phishing-attack/",
  },
  {
    id: "gdg-2026-10-19-linux-git-docker",
    title: "Tools of the Trade Workshop: Linux, Git, & Docker",
    trackId: "cloud",
    date: "2026-10-19T11:30:00.000Z",
    venue: "Online",
    description: "The second Cloud Track session focused on essential developer and infrastructure tools: Linux, Git and Docker. Its advertised practical scope included creating a first container and an introduction to deploying an application with Google Cloud Run.",
    attendance: 0,
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-tools-of-the-trade-workshop-linux-git-amp-docker/",
  },
  {
    id: "gdg-2026-10-21-web-development-makeup",
    title: "Web Development Essentials Make-Up Session",
    trackId: "web",
    date: "2026-10-21T07:00:00.000Z",
    venue: "Google Meet",
    description: "A make-up session revisiting the previous week's web-development foundations: HTML, CSS and JavaScript. It provided another opportunity for beginners to work through the essentials and for more experienced learners to reinforce their understanding.",
    attendance: 26,
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-web-development-essentials-make-up-session-1/",
  },
  {
    id: "gdg-2026-10-27-mobile-development-journey",
    title: "Kickstart Your Mobile Development Journey",
    trackId: "mobile",
    date: "2026-10-27T07:00:00.000Z",
    venue: "Google Meet",
    description: "An introductory mobile-development session covering an orientation to Android Studio and its setup, a Kotlin workshop and a demonstration of Flutter. The session was designed to introduce learners to common tools and approaches for getting started with Android and cross-platform mobile development.",
    attendance: 0,
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-kickstart-your-mobile-development-journey/",
  },
  {
    id: "gdg-2026-10-28-foundation-lab-series",
    title: "Foundation Lab Series: Building Tech Fundamentals",
    trackId: "web",
    date: "2026-10-28T07:00:00.000Z",
    venue: "Online",
    description: "A Stage 2 foundation-lab session organised around five practical learning areas: Behind the Wi-Fi, Networking Lab, Linux Lab, Web Fundamentals Lab and a Cyber Clinic for questions. The programme connected foundational concepts across networking, operating systems, web technologies and cybersecurity.",
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-foundation-lab-series-building-tech-fundamentals/",
  },
  {
    id: "gdg-2026-10-30-docker-in-practice",
    title: "Docker in Practice: From First Container to Production",
    trackId: "cloud",
    date: "2026-10-30T12:00:00.000Z",
    venue: "Online",
    description: "A beginner-friendly practical workshop introducing containerisation with Docker. The advertised topics covered building and running containers, using Docker Compose, creating lean images and considering production and security practices. Participants were asked to bring a laptop with Docker installed and a GitHub account.",
    sourceUrl: "https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-docker-in-practice-from-first-container-to-production/",
  },
];
