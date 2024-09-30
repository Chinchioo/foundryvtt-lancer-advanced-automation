import { basicAttackFlowClass, weaponAttackFlowClass } from "../global.js";
import { wait } from "./automationHelpers.js";

/**
 * Begins a reroll attack flow.
 * @param item: The item for which a reroll shall happen.
 * @param damage_results: The damage rolls to be used on attack reroll.
 * @param crit_damage_results: The crit damage rolls to be used on attack reroll.
 * @param overkill_heat: The overkill heat values from the current attack to be used to calculate correct overkill heat on attack reroll.
 */
export async function beginRerollAttackFlow(actor, damage_results, crit_damage_results, overkill_heat) {
    const flow = new basicAttackFlowClass(actor);
    flow.state.data.laa = { 
        reroll_data: {
            damage_results: damage_results,
            crit_damage_results: crit_damage_results,
            last_overkill_heat: overkill_heat,
    } }
    console.log("Start reroll attack flow");
    await flow.begin();
    console.log("Finished reroll attack flow");
    //Used to wait till the flow really is finished, as reroll flows are normally called from inside other flows!
    //Needed for example to wait for action resolver to finish...
    while(!flow.state.data.laa.reroll_data.finished) {
        await wait(100);
    }
}

/**
 * Begins a reroll weapon attack flow.
 * @param item: The item for which a reroll shall happen.
 * @param damage_results: The damage rolls to be used on attack reroll.
 * @param crit_damage_results: The crit damage rolls to be used on attack reroll.
 * @param overkill_heat: The overkill heat values from the current attack to be used to calculate correct overkill heat on attack reroll.
 */
export async function beginRerollWeaponAttackFlow(item, damage_results, crit_damage_results, overkill_heat) {
    if (!item.is_mech_weapon() && !item.is_npc_feature() && !item.is_pilot_weapon()) {
      ui.notifications.error(`Item ${item.id} cannot attack as it is not a weapon!`);
      return;
    }
    const flow = new weaponAttackFlowClass(item);
    flow.state.data.laa = { 
        reroll_data: {
            damage_results: damage_results,
            crit_damage_results: crit_damage_results,
            last_overkill_heat: overkill_heat,
    } }
    //flow.state.data.isReroll = false;
    console.log("Start reroll weapon attack flow");
    await flow.begin();
    console.log("Finished reroll weapon attack flow");
    //Used to wait till the flow really is finished, as reroll flows are normally called from inside other flows!
    //Needed for example to wait for action resolver to finish...
    while(!flow.state.data.laa.reroll_data.finished) {
        await wait(100);
    }
}

/**
 * Checks if the current attack flow is a reroll attack flow.
 * @param state: The current flow state.
 * @returns Boolean true if this is a reroll attack flow, false if not.
 */
export function isRerollAttack(state) {
    return state.data.laa?.reroll_data;
}