import { moduleID, LIDs, Settings, WeaponRanges, Flags } from "../../../global.js";
import { isAutomationActive } from "../../../automationHelpers/automationHelpers.js";
import { createTargetAreas } from "../../../automationHelpers/templateAndTargetingHelpers.js";
import { addItemOnceToActorByLID, getItemFromActorByLID } from "../../../automationHelpers/tokenOrActorHelpers.js";
import { beginAutoHitAllWeaponAttackFlow } from "../../../flowAdditions/attackFlowAdditions/attackFlowAdditionHelpers.js";

/**
 * ====================================
 * Additional activation flow steps
 * ====================================
 */

/**
 * Activation flow step to handle javelin rocket activation. Will allow the user to place the designated target areas.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled.
 */
export async function handleJavelinRocketsActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if((state.item.system.lid === LIDs.javelinRockets || state.item.system.lid === LIDs.javelinRocketsCustom) && isAutomationActive(Settings.monarchJavelinRocketsAutomation, Settings.monarchJavelinRocketsOnlyCombat, state.actor)) {        
        if(state.data.action?.lid == LIDs.javelinRocketsCustomAttack) {
            //Custom weapon attack
            return await attackJavelinRocketsTargetsIntern(state.actor);
        } else {
            //Place templates
            return await placeJavelinRocketsTemplatesIntern(state.actor, state.item);
        }
    }

    return true;
}

/**
 * ====================================
 * Helper functions
 * ====================================
 */

/**
 * Starts placement of the templates for javelin rockets system.
 * For internal use only.
 * @param actor The actor for which the templates shall be placed!
 * @param item The item for which the templates shall be placed!
 * @returns Boolean if the placement has worked without interruption.
 */
export async function placeJavelinRocketsTemplatesIntern(actor, item) {
    const templateIds = await createTargetAreas(0.5, WeaponRanges.blast, 3, game.settings.get(moduleID, Settings.monarchJavelinRocketsTemplateImage));
    if(!templateIds) {
        ui.notifications.warn(item.name + " activation got canceled!");
        return false;
    }
    return true;
}

/**
 * Starts placement of the templates for javelin rockets system.
 * For macro usage!
 * @param actor The actor for which the templates shall be placed!
 */
export async function placeJavelinRocketsTemplates(actor) {
    //Check if javelin rockets can be used!
    const javelinRocketsItem = getItemFromActorByLID(actor, LIDs.javelinRockets);
    if(!javelinRocketsItem) {
        ui.notifications.warn("Cannot use javelin rockets, system not installed on mech!");
        return;
    }
    await placeJavelinRocketsTemplatesIntern(actor, javelinRocketsItem);
}

/**
 * Starts attack for javelin rockets system targeting all javelin rocket templates which have a token inside.
 * For internal use only.
 * @param actor The actor for which the attack shall be done!
 * @returns Boolean if the attack has worked without interruption.
 */
export async function attackJavelinRocketsTargetsIntern(actor) {
    //Check if actor already has item, otherwise add it quickly for this usage and remove later again!
    const item = await addItemOnceToActorByLID(actor, LIDs.javelinRocketsWeapon);
    if(item) {
        await beginAutoHitAllWeaponAttackFlow(item, true);
    } else {
        ui.notifications.error("Internal issue, couldn't add item '" + LIDs.javelinRocketsWeapon + "' from compendium to actor '" + actor.name + "'");
        return false;
    }
    return true;
}

/**
 * Starts placement of the templates for javelin rockets system.
 * For macro usage!
 * @param actor The actor for which the templates shall be placed!
 */
export async function attackJavelinRocketsTargets(actor) {
    //Check if javelin rockets can be used!
    let javelinRocketsItem = getItemFromActorByLID(actor, LIDs.javelinRockets);
    if(!javelinRocketsItem)
        javelinRocketsItem = getItemFromActorByLID(actor, LIDs.javelinRocketsCustom);
    if(!javelinRocketsItem) {
        ui.notifications.warn("Cannot use javelin rockets, system not installed on mech!");
        return;
    }
    await attackJavelinRocketsTargetsIntern(actor, javelinRocketsItem);
}