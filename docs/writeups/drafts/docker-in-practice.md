# Docker in Practice: From Your First Container to Safer, Leaner Deployments

> **Content type:** Practical companion guide  
> **Track:** Cloud  
> **Related activity:** [Docker in Practice: From First Container to Production](https://gdg.community.dev/events/details/google-gdg-on-campus-technical-university-of-mombasa-mombasa-kenya-presents-docker-in-practice-from-first-container-to-production/)  
> **Editorial status:** Technical draft. The linked event listing describes the planned scope; a session recap must be reviewed separately by the Cloud Track lead.

Docker helps developers package an application with the files and dependencies it needs, then run that package in a consistent environment. That is useful when an application works on one laptop but fails on another because the machines have different runtimes, libraries, or configuration.

This guide builds a mental model of images and containers, runs a container, packages a small application, and introduces Compose and a few production-minded habits.

## 1. Images and containers are not the same thing

A **Docker image** is a packaged, versioned filesystem and configuration used to start containers. A **container** is a running (or stopped) instance created from an image.

A useful analogy is a class and an object: the image is the reusable definition; containers are instances created from it. You can start multiple containers from the same image, each with its own runtime state and configuration.

Containers share the host operating-system kernel, while virtual machines run a guest operating system on virtualised hardware. This is one reason containers are generally lighter to start, although containers and VMs solve overlapping but different isolation and infrastructure problems.

## 2. Run your first container

You need Docker Engine or Docker Desktop installed and running. Check the CLI:

```bash
docker version
```

Run the official Nginx image:

```bash
docker run --detach --name hello-web --publish 8080:80 nginx:stable
```

What the flags mean:

- `--detach` runs the container in the background.
- `--name hello-web` gives the container a readable name.
- `--publish 8080:80` maps port 8080 on your machine to port 80 inside the container.
- `nginx:stable` selects the image and tag.

Open [http://localhost:8080](http://localhost:8080). You should see the Nginx welcome page.

Useful inspection and cleanup commands:

```bash
docker ps                 # running containers
docker ps -a              # running and stopped containers
docker logs hello-web     # container output
docker stop hello-web
docker rm hello-web
```

Stopping a container does not delete its image. Removing a container does not automatically remove the image either.

## 3. Package an application with a Dockerfile

A `Dockerfile` is a set of instructions Docker uses to build an image. For a simple Node.js application with a `package.json`, a lockfile and an entry point at `server.js`, start with:

```dockerfile
FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .
USER node

EXPOSE 3000
CMD ["node", "server.js"]
```

This example assumes the project has a compatible `package-lock.json`, the app listens on port 3000, and its start file is `server.js`. Adapt those details to your project rather than copying the file blindly.

- `FROM` chooses the base image.
- `WORKDIR` sets the working directory for later instructions.
- Copying package manifests before the rest of the source allows dependency installation to be reused when application code changes but dependencies do not.
- `npm ci` installs from the lockfile for a reproducible dependency install.
- `USER node` avoids running the application as root inside the container.
- `EXPOSE` documents the container port; it does not publish that port on the host.
- `CMD` supplies the default process.

Create a `.dockerignore` file so local-only files and secrets do not enter the build context:

```text
node_modules
.git
.env
.env.*
npm-debug.log
coverage
.DS_Store
```

Do not copy credentials into an image. Pass runtime configuration through your deployment environment or an appropriate secrets manager.

Build and run it:

```bash
docker build -t hello-node .
docker run --rm --name hello-node-app --publish 3000:3000 hello-node
```

Visit [http://localhost:3000](http://localhost:3000). The app must listen on `0.0.0.0` inside the container, not only on `127.0.0.1`, or the published port may not reach it.

## 4. Use Compose when your app needs more than one service

Real applications often depend on a database, cache, or other service. Docker Compose describes a multi-container application in a YAML file so the environment can be started and stopped together.

For example, create `compose.yaml` for a local PostgreSQL service:

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: local-development-only
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  postgres_data:
```

Start it with:

```bash
docker compose up --detach
docker compose ps
docker compose logs db
```

Compose creates a private network for the project. Other services in the same Compose project can reach PostgreSQL using the hostname `db` and port `5432`. From your host machine, the example publishes the database only on loopback (`127.0.0.1`).

The named volume `postgres_data` keeps database files when the container is replaced. A container's writable layer is not a substitute for persistent storage.

The password above is deliberately a local-development placeholder, not a production secret. Do not commit real credentials. For a shared or production environment, use your platform's secret-management mechanism and review network exposure, backups, access control and database configuration.

Stop the services:

```bash
docker compose down
```

This removes the containers and network but keeps the named volume. To also delete the database volume, you would use `docker compose down --volumes`; that is destructive to the stored database data.

## 5. Make images more suitable for production

A successful local build is only the beginning. Before deploying an image, consider these practices:

1. **Choose a trusted, maintained base image.** Prefer a suitable small image from a trusted publisher, and keep it updated.
2. **Use multi-stage builds when there is a build step.** Compile or install build-time tools in one stage, then copy only the runtime artefacts into a smaller final stage.
3. **Run as a non-root user where possible.** Give the process only the permissions it needs.
4. **Keep secrets out of images and source control.** A secret copied into an image can remain in its layers even if a later instruction deletes the file.
5. **Use a `.dockerignore` file.** Exclude local dependencies, Git history, environment files and other irrelevant material.
6. **Persist state deliberately.** Use volumes or managed storage for data that must survive container replacement.
7. **Rebuild and scan images regularly.** Base images and dependencies change; an old image does not acquire security updates automatically.
8. **Keep services focused.** Separating the application, database and worker into appropriate services makes their lifecycles and scaling easier to manage.

For applications with a compilation or asset-build step, Docker's multi-stage builds help keep compilers and development dependencies out of the final runtime image. The exact stages depend on the language and framework.

## 6. A short practice challenge

Try this without copying a prebuilt project:

1. Run the Nginx container and inspect its logs.
2. Build an image for a small application you wrote.
3. Add a `.dockerignore` file and explain why each excluded path should stay out of the image.
4. Run the application with a published port.
5. Start a PostgreSQL service with Compose and connect to it from your application using the service name.
6. Stop and recreate the database container. Confirm that the named volume preserves the data.
7. Identify which values in your local setup must be replaced with secrets or managed configuration before deployment.

You should finish understanding not just which commands to type, but what Docker is doing with images, containers, networks, ports and storage.

## Further reading

- [Docker overview](https://docs.docker.com/get-started/docker-overview/)
- [Get started with Docker containers](https://docs.docker.com/learn/paths/get-started-with-docker-containers/)
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Compose documentation](https://docs.docker.com/compose/)

---

*Editorial note: This is an evergreen technical companion guide associated with the October Docker event listing. It is not a report of what participants specifically did at that event. Add an event recap only after the session lead confirms the actual activities, demonstrations and outcomes.*
