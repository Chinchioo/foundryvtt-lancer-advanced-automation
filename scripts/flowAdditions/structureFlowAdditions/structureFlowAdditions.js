import { moduleID } from "../../global.js";

/**
 * ====================================
 * Init structure flow additions
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
    flowSteps.set(moduleID + ".initCustomStructureData",    initCustomStructureData);
    
    //Insert steps
    //StructureFlow
    flows.get("StructureFlow")?.insertStepBefore ("preStructureRollChecks", moduleID + ".initCustomStructureData");
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
 * Additional structure flow steps
 * ====================================
 */

/**
 * Structure flow step to init custom data for this module. Sets some state and flag data.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function initCustomStructureData(state, options) {
    if (!state.data) throw new TypeError("Structure flow state missing!"); 

    //Init laa data!
    if(!state.data.laa)
        state.data.laa = {};

    return true;
}