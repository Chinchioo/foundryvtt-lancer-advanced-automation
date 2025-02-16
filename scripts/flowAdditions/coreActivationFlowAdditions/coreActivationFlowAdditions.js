import { moduleID } from "../../global.js";
import { handleDivinePunishmentActivation } from "../../lancer_rulings/licenses/monarch/divinePunishment.js";


/**
 * ====================================
 * Init core activation flow additions
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
    flowSteps.set(moduleID + ".initCustomCoreActivationData",       initCustomCoreActivationData);
    //DivinePunishment
    flowSteps.set(moduleID + ".handleDivinePunishmentActivation",   handleDivinePunishmentActivation);
    
    //Insert steps
    //CoreActiveFlow
    flows.get("CoreActiveFlow")?.insertStepAfter ("initActivationData", moduleID + ".initCustomCoreActivationData");
    //DivinePunishment
    flows.get("CoreActiveFlow")?.insertStepAfter("printActionUseCard",  moduleID + ".handleDivinePunishmentActivation");
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
 * Additional core activation flow steps
 * ====================================
 */

/**
 * Core activation flow step to init custom data for this module. Sets some state and flag data.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function initCustomCoreActivationData(state, options) {
    if (!state.data) throw new TypeError("Core Activation flow state missing!"); 

    //Init laa data!
    if(!state.data.laa)
        state.data.laa = {};

    return true;
}


/**
 * ====================================
 * On combat change (Hook Events)
 * ====================================
 */

/**
 * Function which handles all combat round changes for attack flow additions.
 * Should be called within the combatRound hook.
 * @param hookEventData: The hook event data for which this event got called.
 * @param actor: The actor for the combat round changes handling.
 * @param combat: The current combat instance.
 * @param round: The current round after the change.
 */
export function onCombatRoundChange(hookEventData, actor, combat, round) {
}

/**
 * Function which handles all combat deletions for attack flow additions.
 * Should be called within the deleteCombat hook.
 * @param hookEventData: The hook event data for which this event got called.
 * @param actor: The actor for the combat deletion handling.
 * @param combatDocument: The current combat document instance.
 */
export function onCombatDelete(hookEventData, actor, combatDocument) {
}