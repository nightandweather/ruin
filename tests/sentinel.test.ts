import{describe,it,expect}from"vitest";import{assessFailure,FAILURE_PLANS,plansFor,SYSTEM_META,type RuinSystem}from"../src/sentinel";
describe("SENTINEL failure registry",()=>{const systems=Object.keys(SYSTEM_META)as RuinSystem[];
it("covers every executable module with at least three failures",()=>{expect(systems).toHaveLength(16);for(const s of systems)expect(plansFor(s).length).toBeGreaterThanOrEqual(3)});
it("uses unique plan identifiers",()=>{expect(new Set(FAILURE_PLANS.map(p=>p.id)).size).toBe(FAILURE_PLANS.length)});
it("requires detection isolation fallback recovery and an invariant",()=>{for(const p of FAILURE_PLANS){expect(p.detector.length).toBeGreaterThan(8);expect(p.automatic.length).toBeGreaterThanOrEqual(2);expect(p.safeState).toBeTruthy();expect(p.fallback).toBeTruthy();expect(p.recovery.length).toBeGreaterThanOrEqual(2);expect(p.invariant).toBeTruthy()}});
it("keeps dependency references inside the registry",()=>{for(const p of FAILURE_PLANS)for(const d of p.dependencies)expect(systems).toContain(d)});
it("produces an ordered response timeline",()=>{const a=assessFailure(FAILURE_PLANS[0],"critical");expect(a.timeline.map(x=>x.at)).toEqual([0,15,30,60,120]);expect(a.timeline[2].action).toBe(FAILURE_PLANS[0].safeState)});
it("raises risk with severity",()=>{const p=FAILURE_PLANS[0];expect(assessFailure(p,"critical").riskPriority).toBeGreaterThan(assessFailure(p,"minor").riskPriority)});
});
