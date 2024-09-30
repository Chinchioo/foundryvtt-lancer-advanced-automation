import { LIDs, moduleID, Settings, systemFlowClass } from "../../../../global.js";
import { simpleYesNoQuestion } from "../../../../automationHelpers/automationHelpers.js";
import { getItemFromActorByLID } from "../../../../automationHelpers/tokenOrActorHelpers.js";

/**
 * ====================================
 * Additional structure flow steps
 * ====================================
 */
export async function useCustomPaintJobBeforeStructure(state, options) {
    if (!state.data) throw new TypeError("Structure flow state missing!");

    if(game.settings.get(moduleID, Settings.gmsCustomPaintJobAutomation) && game.settings.get(moduleID, Settings.gmsCustomPaintJobStructureAutomation)) {
        const cpjItem = getItemFromActorByLID(state.actor, LIDs.customPaintJob);
        if(cpjItem && !cpjItem.system.destroyed && await simpleYesNoQuestion(cpjItem.name, "HP at 0 or lower", "Do you want to use Custom Paint Job?")) {
            const flow = new systemFlowClass(cpjItem);
            console.log("Start cpj system flow");
            await flow.begin();
            console.log("Finished cpj system flow");

            //Check if custom paint job was successfull and stop structure flow if yes!
            if(flow.state.data.custom_paint_job?.success)
                return false;
        }
    }
}