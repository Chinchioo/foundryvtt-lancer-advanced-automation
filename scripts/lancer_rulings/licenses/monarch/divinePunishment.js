import { LIDs, Settings } from "../../../global.js";
import { addItemOnceToActorByLID, getItemFromActorByLID } from "../../../automationHelpers/tokenOrActorHelpers.js";
import { beginAutoHitAllWeaponAttackFlow } from "../../../automationHelpers/autoHitAllWeaponAttackHelpers.js";
import { isAutomationActive } from "../../../automationHelpers/automationHelpers.js";

/**
 * ====================================
 * Additional activation flow steps
 * ====================================
 */

/**
 * Activation flow step to handle divine punishment core power activation. Will start an attack flow with the divine punishment item.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
export async function handleDivinePunishmentActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(state.item.system.lid === LIDs.monarchFrame && isAutomationActive(Settings.monarchDivinePunishmentAutomation, Settings.monarchDivinePunishmentOnlyCombat, state.actor)) {
        await startDivinePunishmentAttackIntern(state.actor);
    }

    return true;
}


/**
 * ====================================
 * Helper functions
 * ====================================
 */

/**
 * Starts the divine punishment attack.
 * For internal use only.
 * @param actor The actor for which the attack shall be started!
 */
async function startDivinePunishmentAttackIntern(actor) {
    //Check if actor already has item, otherwise add it quickly for this usage and remove later again!
    const item = await addItemOnceToActorByLID(actor, LIDs.monarchDivinePunishment);
    if(item) {
        await beginAutoHitAllWeaponAttackFlow(item, true);
        //Removing the item stops roll damage functionality from working!!! Keep the item despite the riks of cluttering the item list.
        //removeItemFromActorByLID(actor, LIDs.monarchDivinePunishment);
    } else {
        ui.notifications.error("Internal issue, couldn't add item '" + LIDs.monarchDivinePunishment + "' from compendium to actor '" + actor.name + "'");
    }
}

/**
 * Starts the divine punishment attack.
 * For macro usage!
 * @param actor The actor for which the attack shall be started!
 */
export async function startDivinePunishmentAttack(actor) {
    //Check if punishment can be used!
    const monarchItem = getItemFromActorByLID(actor, LIDs.monarchFrame);
    if(!monarchItem) {
        ui.notifications.warn("Cannot use divine punishment, this mech is not a monarch!");
        return;
    }
    await startDivinePunishmentAttackIntern(actor);
}