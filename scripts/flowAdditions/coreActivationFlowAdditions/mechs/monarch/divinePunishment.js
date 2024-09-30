import { LIDs } from "../../../../global.js";
import { addItemOnceToActorByLID, removeItemFromActorByLID } from "../../../../automationHelpers/tokenOrActorHelpers.js";
import { beginAutoHitAllWeaponAttackFlow } from "../../../attackFlowAdditions/attackFlowAdditionHelpers.js";

/**
 * ====================================
 * Additional activation flow steps
 * ====================================
 */
export async function handleDivinePunishmentActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(state.item.system.lid === LIDs.monarchFrame) {
        //Check if actor already has item, otherwise add it quickly for this usage and remove later again!
        const item = await addItemOnceToActorByLID(state.actor, LIDs.monarchDivinePunishment);
        if(item) {
            beginAutoHitAllWeaponAttackFlow(item, true);
        } else {
            ui.notifications.error("Internal issue, couldn't add item '" + LIDs.monarchDivinePunishment + "' from compendium to actor '" + state.actor.name + "'");
        }
    }

    return true;
}

export async function cleanupDivinePunishmentActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;
    
    if(state.item.system.lid === LIDs.monarchFrame) {
        removeItemFromActorByLID(state.actor, LIDs.monarchDivinePunishment);
    }
}