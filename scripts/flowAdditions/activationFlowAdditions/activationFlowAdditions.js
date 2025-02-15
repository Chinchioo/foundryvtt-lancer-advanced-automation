import { moduleID } from "../../global.js";
import { handleJavelinRocketsActivation } from "../../lancer_rulings/licenses/monarch/javelinRockets.js";
import { cleanupPinakaMissileActivation, handlePinakaMissileActivation, printPinakaMissileActivationChatMessage, updatePinakaMissileItemAfterActivation } from "../../lancer_rulings/licenses/monarch/pinakaMissiles.js";
import { onCombatUpdateGM as onTlalocCombatUpdateGM, onCombatDeleteGM as onTlalocCombatDeleteGM, handleTlalocActivation, cleanupTlalocActivation } from "../../lancer_rulings/licenses/monarch/tlaloc.js";
import { handleStormbringerActivation } from "../../lancer_rulings/pilot_talents/stormbringer.js";

/**
 * ====================================
 * Init activation flow additions
 * ====================================
 */ 

/**
 * Registers the new flow steps to corresponding flows.
 * Must be called within register flows hook.
 * @param flowSteps The flow steps container to register the flow steps to.
 * @param flows The flows container to insert flow steps in order.
 */
export function registerFlowSteps(flowSteps, flows) {
    //Handle new steps
    //Javelin Rockets
    flowSteps.set(moduleID + ".handleJavelinRocketsActivation",             handleJavelinRocketsActivation);
    //Pinaka Missiles
    flowSteps.set(moduleID + ".handlePinakaMissileActivation",              handlePinakaMissileActivation);
    flowSteps.set(moduleID + ".updatePinakaMissileItemAfterActivation",     updatePinakaMissileItemAfterActivation);
    flowSteps.set(moduleID + ".printPinakaMissileActivationChatMessage",    printPinakaMissileActivationChatMessage);
    //Tlaloc
    flowSteps.set(moduleID + ".handleTlalocActivation",                     handleTlalocActivation);
    //Stormbringer
    flowSteps.set(moduleID + ".handleStormbringerActivation",               handleStormbringerActivation);
    
    //Insert steps
    //ActivationFlow
    //Javelin Rockets
    flows.get("ActivationFlow")?.insertStepAfter("checkItemCharged",        moduleID + ".handleJavelinRocketsActivation");
    //Pinaka Missiles
    flows.get("ActivationFlow")?.insertStepAfter("checkItemCharged",        moduleID + ".handlePinakaMissileActivation");
    flows.get("ActivationFlow")?.insertStepAfter("updateItemAfterAction",   moduleID + ".updatePinakaMissileItemAfterActivation");
    flows.get("ActivationFlow")?.insertStepAfter("printActionUseCard",      moduleID + ".printPinakaMissileActivationChatMessage");
    //Tlaloc
    flows.get("ActivationFlow")?.insertStepAfter("checkItemCharged",        moduleID + ".handleTlalocActivation");
    //Stormbringer
    flows.get("ActivationFlow")?.insertStepAfter("checkItemCharged",        moduleID + ".handleStormbringerActivation");
}

/**
 * Initializes some variables and pre/post flow hooks.
 * Should be called within ready hook.
 */
export function init() {    
    Hooks.on("lancer.postFlow.ActivationFlow", async (flow, isContinue) => {
        await cleanupPinakaMissileActivation(flow.state, flow.options, isContinue);
        await cleanupTlalocActivation(flow.state, flow.options, isContinue);
    });
}


/**
 * ====================================
 * On combat change (Hook Events)
 * ====================================
 */

/**
 * Function which handles all combat updates for activation flow additions.
 * Should be called within the updateCombat hook for the gm.
 * @param actor: The actor for the combat update handling.
 * @param currentCombatant: The current turns combatant.
 * @param currentRound: The current round after the change.
 */
export async function onCombatUpdateGM(actor, currentCombatant, currentRound) {
    await onTlalocCombatUpdateGM(actor, currentCombatant, currentRound);
}

/**
 * Function which handles all combat deletions for activation flow additions. * 
 * Should be called within the deleteCombat hook for the gm.
 * @param actor: The actor for the combat deletion handling.
 */
export async function onCombatDeleteGM(actor) {
    await onTlalocCombatDeleteGM(actor);
}