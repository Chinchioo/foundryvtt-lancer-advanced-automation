import { moduleID } from "../../global.js";
import { handleDivinePunishmentActivation } from "./mechs/monarch/divinePunishment.js";


/**
 * ====================================
 * Init activation flow additions
 * ====================================
 */

/**
 * Registers the new flow steps to corresponding flows.
 * Must be called within register flows hook.
 */
export function registerFlowSteps(flowSteps, flows) {
    //Handle new steps
    //DivinePunishment
    flowSteps.set(moduleID + ".handleDivinePunishmentActivation", handleDivinePunishmentActivation);
    
    //Insert steps
    //CoreActiveFlow
    //DivinePunishment
    flows.get("CoreActiveFlow")?.insertStepAfter("printActionUseCard", moduleID + ".handleDivinePunishmentActivation");
}

/**
 * Initializes some variables and pre/post flow hooks.
 * Should be called within ready hook.
 */
export function init() {    
    Hooks.on("lancer.postFlow.CoreActiveFlow", async (flow, isContinue) => {
    });
}

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