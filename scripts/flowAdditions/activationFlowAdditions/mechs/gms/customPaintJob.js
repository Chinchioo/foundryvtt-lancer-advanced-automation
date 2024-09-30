import { LIDs, moduleID, Settings } from "../../../../global.js";
import { simpleRollChatMessage } from "../../../../automationHelpers/automationHelpers.js";

/**
 * ====================================
 * Additional activation flow steps
 * ====================================
 */
export async function handleCustomPaintJobActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(game.settings.get(moduleID, Settings.gmsCustomPaintJobAutomation)) {
        if(state.item.system.lid === LIDs.customPaintJob) {
            if(state.actor.system.hp.value <= state.actor.system.hp.min) {
                let messageDescription = "";
                let roll = new Roll("1d6");
                await roll.roll();
                if(roll.total === 6) {
                    //Used to later check if the roll was successfull (e.g. during structure flow)
                    state.data.custom_paint_job = { success: true };
                    //Set hp back to 1
                    await state.actor.update({ "system.hp.value": 1 });
                    //Destroy item
                    await state.item.update({ "system.destroyed": true });
                    //Post chat message!
                    messageDescription = state.item.name + " successfully used! HP reset to 1 and item destroyed!";
                }
                await simpleRollChatMessage(state.actor, roll, state.item.name, messageDescription);
            } else {
                ui.notifications.warn("Custom paint job currently not needed, therefore won't be automated!");
            }
        }
    }

    return true;
}