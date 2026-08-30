# Security policy

RUIN is a client-side speculative simulation and currently has no production backend, account system, or secret storage. Security reports are still welcome, especially for dependency risks, unsafe export behavior, cross-site scripting, or changes that could turn a safety-oriented model into harmful operational guidance.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature from the repository **Security** tab. Please do not open a public issue before a fix or mitigation is available.

Include, when possible:

- The affected commit, file, or dependency.
- Steps to reproduce the problem.
- The expected and observed impact.
- A minimal proof of concept that does not expose unrelated data.
- Any mitigation you have already identified.

The maintainer will acknowledge a complete report when practical, assess scope, and coordinate disclosure. This is a volunteer project and cannot promise a commercial response SLA.

## Supported versions

Only the current `main` branch is supported before the first stable release. Avoid relying on RUIN for real spacecraft, life-support, industrial, or safety-critical decisions; its outputs are conceptual scenarios, not certified engineering results.
