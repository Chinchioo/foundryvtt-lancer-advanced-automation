import { moduleID, LIDs, Settings, WeaponRanges, Flags } from "../../../global.js";
import { isAutomationActive } from "../../../automationHelpers/automationHelpers.js";
import { createTargetAreas } from "../../../automationHelpers/templateAndTargetingHelpers.js";
import { getItemFromActorByLID } from "../../../automationHelpers/tokenOrActorHelpers.js";

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

    if(state.item.system.lid === LIDs.javelinRockets && isAutomationActive(Settings.monarchJavelinRocketsAutomation, Settings.monarchJavelinRocketsOnlyCombat, state.actor)) {
        placeJavelinRocketsTemplatesIntern(state.actor, state.item);
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
 */
export async function placeJavelinRocketsTemplatesIntern(actor, item) {
    let templateIds = [];
    const newTemplateIds = await createTargetAreas(0.5, WeaponRanges.blast, 3, game.settings.get(moduleID, Settings.monarchJavelinRocketsTemplateImage));
    if(!newTemplateIds) {
        ui.notifications.warn(item.name + " activation got canceled!");
        return false;
    }
    const oldTemplateIds = actor.getFlag(moduleID, Flags.javelinRocketsTemplates);
    if(oldTemplateIds) {
        templateIds = oldTemplateIds.concat(newTemplateIds);
    } else {
        templateIds = newTemplateIds;
    }
    
    await actor.setFlag(moduleID, Flags.javelinRocketsTemplates, templateIds);
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
 * Cleans up the javelin rockets flags.
 * Use in case of issues!
 * @param actor: The actor to clean the flags for.
 */
export async function cleanupJavelinRocketsFlags(actor) {
    await actor.unsetFlag(moduleID, Flags.javelinRocketsTemplates);
}