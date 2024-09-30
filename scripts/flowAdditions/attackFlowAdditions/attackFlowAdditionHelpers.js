import { moduleID, weaponAttackFlowClass, Flags } from "../../global.js";

/**
 * Provides the attack templates placed during the current attack flow.
 * @returns An array of following structure:
 *      id: The id of the template document.
 *      targetIDs: An array of ids for the target tokens.
 */
export function getAttackTemplates() {
    return game.user.getFlag(moduleID, Flags.attackFlowTemplates);
}

/**
 * Provides the damages used during the current attack flow.
 * @returns An array of all damages.
 */
export function getDamages() {
    return game.user.getFlag(moduleID, Flags.attackFlowDamages);
}

/**
 * Provides the damage types used during the current attack flow.
 * @returns An array of all damage types.
 */
export function getDamageTypes() {
    return game.user.getFlag(moduleID, Flags.attackFlowDamageTypes);
}

/**
 * Checks if the current attack flow has data for a normal (non-crit) hit.
 * @param state: The flow state from the active flow.
 * @returns Boolean, true if attack flow data has a normal hit, false if not.
 */
export function hasNormalHit(state) {
    return state?.data?.hit_results?.some(hit => hit?.hit && !hit?.crit); //(state?.data?.hit_results?.length === 0 && state?.data?.attack_results?.some(attack => (attack?.roll?.total ?? 0) < 20)) ||
}

/**
 * Checks if the current attack flow has data for a crit hit.
 * @param state: The flow state from the active flow.
 * @returns Boolean, true if attack flow data has a crit hit, false if not.
 */
export function hasCritHit(state) {
    return state?.data?.hit_results?.some(hit => hit?.crit); //(state?.data?.hit_results?.length === 0 && state?.data?.attack_results?.some(attack => (attack?.roll?.total ?? 0) >= 20)) ||
}

/**
 * Checks if the current attack flow has hit anything.
 * @param state: The current flow state.
 * @returns: True if attack flow has a hit, false if not.
 */
export function hasHit(state) {
    return hasNormalHit(state) || hasCritHit(state);
}

/**
 * Calculates the overkill heat based on state damage data and applies it to the flow state data.
 * @param state: The flow state from the active flow.
 */
export function calculateOverkillHeat(state) {
    if (state?.data?.overkill) {
        state.data.overkill_heat = 0;
        (hasCritHit(state) ? state.data.crit_damage_results : state.data.damage_results).forEach(result => {
            result.roll.terms.forEach(p => {
                if (p instanceof DiceTerm) {
                    p.results.forEach(r => {
                        if (r.exploded) state.data.overkill_heat += 1;
                    });
                }
            });
        });
    }
}

/**
 * Begins an auto hit all weapon attack flow. (Automatically hits all targets without roll!)
 * @param item: Item to start attack flow for.
 * @param isSpecialWeapon: If the given weapon is a fake weapon e.g. avenger silos.
 */
export async function beginAutoHitAllWeaponAttackFlow(item, isSpecialWeapon) {
    const flow = new weaponAttackFlowClass(item);
    flow.state.data.auto_hit_all = true;
    flow.state.data.is_special_weapon_attack_flow = isSpecialWeapon;
    console.log("Start auto hit all weapon attack flow");
    await flow.begin();
    console.log("Finished auto hit all weapon attack flow");
}

/**
 * Checks if the given flow state is from a special weapon attack flow. (Attack flow with a fake weapon e.g. avenger silos.)
 * This is needed to don't activate some systems based on these attacks.
 * @param state: The current flow state.
 * @returns True if this is a special weapon attack flow, false if not.
 */
export function isSpecialWeaponAttackFlow(state) {
    return state.data.is_special_weapon_attack_flow;
}

/**
 * Checks if a lock on was consumed during the current attack flow.
 * @param state: The current flow state.
 * @returns True if lock on was consumed, false if not.
 */
export function consumedLockOn(state) {
    let usedLockOn = false;
    for(const targetingData of state.data.attack_rolls.targeted) {
        if(targetingData.usedLockOn)
            usedLockOn = true;
    }
    return usedLockOn;
}

/**
 * Adds an action resolver element to the given state. 
 * This is used to resolve attack flows and give the user a possibility to decide in which order actions shall be resolved.
 * @param state: The current flow state.
 * @param resolverName: Name to show the user to select action.
 * @param resolverFunction: An asynchronous function which resolves the action when selected.
 * @param reevaluateFunction: An asynchronous function which reevaluates if the current action can be used. (Is called after every action again to check!)
 */
export function addActionResolver(state, resolverName, resolverFunction, reevaluateFunction) {
    if(!state.data.action_resolver)
        state.data.action_resolver = [];
    state.data.action_resolver.push({
        name: resolverName,
        resolver_function: resolverFunction,
        reevaluate_function: reevaluateFunction,
    });
}