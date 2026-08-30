# WAYSTATION orbital port

WAYSTATION will model a spacecraft port as infrastructure rather than scenery. A port is the shared failure boundary between traffic control, docking, propellant, power, heat rejection, cargo custody, repair, quarantine, crew survival, and departure geometry.

## First executable question

Which ship misses its departure window when every berth, radiator, tug, fuel line, repair team, and cargo inspection has a different bottleneck?

## Proposed state

- Approaching, holding, docking, serviced, quarantined, and departing vessels.
- Berths classified by mass, geometry, pressure interface, and hazardous-cargo compatibility.
- Propellant, power, cooling, atmosphere, food, water, spares, and cargo inventory.
- Tugs, robotic arms, inspection drones, repair cells, and AEGIS-qualified EVA crews.
- Ephemeris-based arrival and departure windows with confidence bounds.
- Cargo provenance from ASCENT, PROGENITOR, and FOUNDRY.

## Failure scenarios

- Docking collar fails a pressure or alignment check.
- Cryogenic propellant boiloff exceeds the departure reserve.
- A radiator outage limits simultaneous servicing.
- Unidentified cargo or biological contamination triggers quarantine.
- Debris closes an approach corridor.
- A disabled vessel consumes the emergency tug and berth reserve.

## Safety invariants

1. No docking clearance without positive identity, relative-state confidence, and a compatible berth.
2. No propellant transfer across an unverified connection.
3. Traffic capacity always preserves an emergency approach or departure path.
4. Cargo custody and contamination state survive every transfer.
5. A missed window returns the vessel to a safe holding state rather than forcing departure.

WAYSTATION should be built after LUMEN power contracts and the shared campaign event schema, alongside ASCENT orbital logistics.
