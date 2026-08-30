# Fleet operations

RUIN's “battleship” is a deep-space protection platform, not a weapon blueprint. Its executable model covers convoy screening, rescue, communication loss, debris impacts, thermal faults, propellant reserves, and damage control.

## Operational question

Can an autonomous escort preserve civilian and industrial ships when command decisions arrive minutes or years late?

## Safety boundary

The module intentionally excludes weapon construction, targeting solutions, munition effects, and real-world tactical advice. An unknown contact triggers a protective screen; a communications loss triggers hold; a debris strike triggers rescue. These policies are testable in `src/fleet.ts`.

## Next executable slice

Connect fleet logistics to FOUNDRY replacement-kit output and HELIOS energy availability. A fleet should be unable to repair itself using resources that the industrial graph did not actually produce.
