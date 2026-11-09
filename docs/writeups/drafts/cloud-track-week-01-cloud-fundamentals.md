# Getting Started with Cloud Computing: Inside GDG TUM's Cloud Track Kickoff

> **Content type:** Session recap  
> **Track:** Cloud  
> **Event:** [Cloud Track Week 1: Cloud Fundamentals](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-cloud-track-week-1-cloud-fundamentals/)  
> **Date:** 12 October 2026  
> **Venue:** Bevy Virtual Conference  
> **Editorial status:** Lead-reviewed draft; not yet published on the website.

*An introduction to cloud computing, Google Cloud Platform, and the tools that help engineers work with cloud infrastructure.*

On 12 October 2026, GDG on Campus – Technical University of Mombasa kicked off its Cloud Track with a session focused on one important question: **What does it actually mean to work with the cloud?**

Cloud computing has become an essential part of modern software development. Applications, databases, infrastructure and services increasingly depend on cloud platforms. But before deploying applications or building complex systems, it is important to understand the environment in which they operate.

That was the starting point of our first Cloud Track session: building a foundation, getting familiar with Google Cloud Platform (GCP), and introducing members to the tools they will encounter as they progress through the track.

## Understanding the Cloud

We began by exploring the fundamentals of cloud computing and what it means to use computing resources over the internet rather than managing all the underlying infrastructure ourselves.

An important part of this introduction was understanding the three main cloud service models:

- **Infrastructure as a Service (IaaS):** Provides access to computing infrastructure such as virtual machines, storage and networking.
- **Platform as a Service (PaaS):** Provides an environment for building and deploying applications without having to manage all the underlying infrastructure.
- **Software as a Service (SaaS):** Provides ready-to-use software applications over the internet.

We also explored Google Cloud's global infrastructure, including regions and zones, and discussed the shared responsibility model.

One important takeaway was that moving to the cloud does not mean responsibility for security disappears. Cloud providers and customers have different responsibilities, and understanding those boundaries is essential when designing and operating cloud environments.

## Exploring Google Cloud Platform

With the fundamentals established, we moved into Google Cloud Platform.

Members were introduced to the Google Cloud Console and its resource hierarchy, helping them understand how cloud resources are organised and managed.

We explored the process of creating a Google Cloud project and discussed billing awareness, including configuring a budget alert. Understanding cloud costs early is important: even small experiments with cloud resources should be approached responsibly.

The session was not just about knowing where to find things in the console. It was also about becoming comfortable navigating an actual cloud environment.

## From the Console to the Command Line

One of the practical highlights was introducing members to **Google Cloud Shell**.

Cloud Shell provides a browser-based command-line environment for interacting with Google Cloud. During the demonstration, members followed along on their own devices as we explored the Cloud Shell terminal and editor.

We switched between the available tools and introduced common Google Cloud CLI commands, including listing projects:

```bash
gcloud projects list
```

This provided an initial look at how engineers can inspect and interact with cloud environments through a terminal.

This is an important step in developing cloud engineering skills. Although graphical interfaces are useful, working with command-line tools becomes increasingly valuable when managing infrastructure, automating workflows and building repeatable engineering processes.

## Security Starts at the Beginning

Another important part of the session was introducing members to basic cloud security practices.

We discussed Identity and Access Management (IAM), the principle of least privilege, and why access should only be granted at the level required for a particular task.

We also covered practical account-security measures, including enabling two-factor authentication on Google and GitHub accounts.

These practices may seem basic, but they establish habits that become increasingly important as developers work with more infrastructure, services and sensitive resources.

Cloud engineering is not simply about getting applications running. It is also about ensuring that the resources supporting those applications are managed securely and responsibly.

## Building Beyond the First Session

The kickoff was an introduction, not the destination.

Our Cloud Track follows a 16-week learning roadmap designed to take members from foundational concepts towards practical cloud engineering and operations.

The upcoming topics include:

- Linux and command-line fundamentals.
- Networking and Git collaboration.
- Application runtimes and Docker.
- Google Cloud services and IAM.
- Cloud deployment and Cloud Run.
- Storage, databases and cloud networking.
- CI/CD pipelines and Terraform.
- Cloud security, observability and reliability.
- A capstone project and final demonstrations.

The broader goal is to connect theory with practical engineering. Members should not only understand concepts but also learn to build, deploy, secure and explain the systems they work on.

## The Beginning of the Journey

Our first Cloud Track session established the foundation for what comes next.

From understanding IaaS, PaaS and SaaS to navigating the Google Cloud Console, exploring Cloud Shell and learning introductory `gcloud` commands, members were introduced to the environment and tools that underpin modern cloud engineering.

There is much more to explore, but every engineering journey needs a starting point.

**This was ours.**

*Learn it. Build it. Deploy it. Secure it.*

---

**Event:** Cloud Track Week 1 – Cloud Fundamentals  
**Date:** 12 October 2026  
**Venue:** Bevy Virtual Conference  
**Organised by:** GDG on Campus – Technical University of Mombasa

[View the event on GDG Community](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-cloud-track-week-1-cloud-fundamentals/)

[Explore the Cloud Track curriculum](https://github.com/GDG-TUM/Cloud-Track-GDG-on-Campus-TUM)
