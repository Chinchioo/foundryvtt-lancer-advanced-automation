import { basicAttackFlowClass, weaponAttackFlowClass } from "../global.js";
import { wait } from "./automationHelpers.js";

/**
 * Begins a reroll attack flow.
 * @param actor: The actor for which a reroll shall happen.
 * @param attack_results: The current attack results to be used for reroll attack.
 * @param hit_results: The current hit results to be used for reroll attack.
 * @param targets: The current targets to be used for reroll attack.
 */
export async function beginRerollAttackFlow(actor, attack_results, hit_results, targets) {
    //Only save hits for reroll attack, misses aren't relevant.
    let rerollAttackResults = [];
    let rerollHitResults = [];
    let rerollTargets = [];
    for(let i = 0; i < attack_results.length; i++) {
        if(hit_results[i].hit) {
            rerollAttackResults.push(attack_results[i]);
            rerollHitResults.push(hit_results[i]);
            rerollTargets.push(targets[i]);
        }        
    }
    //Create attack flow instance.
    const flow = new basicAttackFlowClass(actor);
    flow.state.data.laa = { 
        reroll_data: {
            attack_results: rerollAttackResults,
            hit_results: rerollHitResults,
            targets: rerollTargets,
            finished: false,
        },
    };
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
 * @param attack_results: The current attack results to be used for reroll attack.
 * @param hit_results: The current hit results to be used for reroll attack.
 * @param targets: The current targets to be used for reroll attack.
 */
export async function beginRerollWeaponAttackFlow(item, attack_results, hit_results, targets) {
    if (!item.is_mech_weapon() && !item.is_npc_feature() && !item.is_pilot_weapon()) {
      ui.notifications.error(`Item ${item.id} cannot attack as it is not a weapon!`);
      return;
    }
    //Only save hits for reroll attack, misses aren't relevant.
    let rerollAttackResults = [];
    let rerollHitResults = [];
    let rerollTargets = [];
    for(let i = 0; i < attack_results.length; i++) {
        if(hit_results[i].hit) {
            rerollAttackResults.push(attack_results[i]);
            rerollHitResults.push(hit_results[i]);
            rerollTargets.push(targets[i]);
        }        
    }
    //Create weapon attack flow instance.
    const flow = new weaponAttackFlowClass(item);
    flow.state.data.laa = { 
        reroll_data: {
            attack_results: rerollAttackResults,
            hit_results: rerollHitResults,
            targets: rerollTargets,
            finished: false,
        },
    };
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