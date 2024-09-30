import { moduleID } from "../../global.js";
import { useCustomPaintJobBeforeStructure } from "./mechs/GMS/customPaintJob.js";

/**
 * ====================================
 * Init structure flow additions
 * ====================================
 */

/**
 * Registers the new flow steps to corresponding flows.
 * Must be called within register flows hook.
 */
export function registerFlowSteps(flowSteps, flows) {
    //Handle new steps
    //Custom Paint Job
    flowSteps.set(moduleID + ".useCustomPaintJobBeforeStructure",   useCustomPaintJobBeforeStructure);
    
    //Insert steps
    //StructureFlow
    //Custom Paint Job
    flows.get("StructureFlow")?.insertStepBefore("preStructureRollChecks",   moduleID + ".useCustomPaintJobBeforeStructure");
}

/**
 * Initializes some variables and pre/post flow hooks.
 * Should be called within ready hook.
 */
export function init() {
    //Currently nothing to do here!
}