# Code Visualizer — Execution Sandbox Container
#
# This container is used when USE_DOCKER_SANDBOX=true.
# It provides a hardened environment for running untrusted code:
#   - No network access
#   - Read-only filesystem (except /tmp)
#   - Non-root user
#   - Minimal attack surface
#
# Build:
#   docker build -t code-visualizer-sandbox:latest -f docker/sandbox.Dockerfile docker/
#
# The backend executor spawns a new container per execution request,
# passes code via stdin, and reads the trace JSON from stdout.

FROM python:3.11-slim

# Remove unnecessary tools
RUN apt-get purge -y --auto-remove \
    wget curl apt-transport-https ca-certificates \
    && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man

# Create non-root user
RUN useradd -m -u 1000 -s /bin/false sandbox

# Working directory
WORKDIR /sandbox

# Copy the tracer script that will be invoked inside the container
COPY sandbox_runner.py /sandbox/runner.py
RUN chown -R sandbox:sandbox /sandbox

USER sandbox

# Security: no new privileges
LABEL sandbox="true"

# Default: run the sandbox runner
ENTRYPOINT ["python", "/sandbox/runner.py"]
