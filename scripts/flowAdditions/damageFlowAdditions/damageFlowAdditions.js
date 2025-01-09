import { moduleID } from "../../global.js";
//Overpower Caliber
import { handleOverpowerCaliber, setOverpowerCaliberUsedFlags, onCombatUpdateGM as onOverpowerCaliberCombatUpdateGM, onCombatDeleteGM as onOverpowerCaliberCombatDeleteGM } from "../../lancer_rulings/core_boni/overpowerCaliber.js"

/**
 * ====================================
 * Init damage flow additions
 * ====================================
 */

/**
 * Registers the new flow steps to corresponding flows.
 * Must be called within register flows hook.
 */
export function registerFlowSteps(flowSteps, flows) {
    //Handle new steps
    //Overpower Caliber
    flowSteps.set(moduleID + ".handleOverpowerCaliber",                     handleOverpowerCaliber);
    flowSteps.set(moduleID + ".setOverpowerCaliberUsedFlags",               setOverpowerCaliberUsedFlags);
    
    //Insert steps
    //DamageFlow
    //OverpowerCaliber
    flows.get("DamageRollFlow")?.insertStepBefore("showDamageHUD",          moduleID + ".handleOverpowerCaliber");
    flows.get("DamageRollFlow")?.insertStepAfter ("printDamageCard",        moduleID + ".setOverpowerCaliberUsedFlags");
}

/**
 * Initializes some variables and pre/post flow hooks.
 * Should be called within ready hook.
 */
export function init() {
    //Currently nothing to do here!
}

/**
 * ====================================
 * On combat change (Hook Events)
 * ====================================
 */

/**
 * Function which handles all combat updates for damage flow additions.
 * Should be called within the updateCombat hook for the gm.
 * @param actor: The actor for the combat update handling.
 * @param currentCombatant: The current combatant instance after the turn change.
 * @param currentRound: The current round after the change.
 */
export async function onCombatUpdateGM(actor, currentCombatant, currentRound) {
    await onOverpowerCaliberCombatUpdateGM(actor, currentCombatant, currentRound);
}

/**
 * Function which handles all combat deletions for damage flow additions. * 
 * Should be called within the deleteCombat hook for the gm.
 * @param actor: The actor for the combat deletion handling.
 */
export async function onCombatDeleteGM(actor) {
    await onOverpowerCaliberCombatDeleteGM(actor);
}