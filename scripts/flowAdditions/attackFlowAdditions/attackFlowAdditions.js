import { moduleID, Flags, Settings } from "../../global.js";
//Automation helpers
import { simpleYesNoQuestion } from "../../automationHelpers/automationHelpers.js";
import { removeTemplatesFromScene, targetsFromTemplate } from "../../automationHelpers/templateAndTargetingHelpers.js";
import { isRerollAttack } from "../../automationHelpers/rerollAttackHelpers.js";
import { autoHitAllRollAttack, isAutoHitAllWeaponAttackFlow } from "../../automationHelpers/autoHitAllWeaponAttackHelpers.js";
//Attack flow helpers
import { isSpecialWeaponAttackFlow } from "./attackFlowAdditionHelpers.js";
import { cleanupDelayedAttackData, handleDelayedAttacks, initCustomDelayedAttackData } from "../../automationHelpers/delayedAttackHelpers.js";
//Monarch
import { handlePostFlowTlaloc } from "../../lancer_rulings/licenses/monarch/tlaloc.js";
import { cleanupPinakaMissileData, initPinakaMissileAttackData, recalculatePinakaMissileSelfHeat } from "../../lancer_rulings/licenses/monarch/pinakaMissiles.js";
import { handlePostFlowAvengerSilos, onCombatUpdateGM as onAvengerSilosCombatUpdateGM, onCombatDeleteGM as onAvengerSilosCombatDeleteGM, setAvengerSilosUsedFlags } from "../../lancer_rulings/licenses/monarch/avengerSilos.js";
//Stormbringer
import { handlePostFlowStormbringer, onCombatUpdateGM as onStormbringerCombatUpdateGM, onCombatDeleteGM as onStormbringerCombatDeleteGM, rollTorrentMissileAttackRolls } from "../../lancer_rulings/pilot_talents/stormbringer.js";

let checkItemDestroyedFunction;
let checkWeaponLoadedFunction;
let checkItemLimitedFunction;
let checkItemChargedFunction;
let rollAttacksFunction;
let applySelfHeatFunction;
let updateItemAfterActionFunction;

/**
 * ====================================
 * Init attack flow additions
 * ====================================
 */

/**
 * Registers the new flow steps to corresponding flows.
 * Must be called within register flows hook.
 * @param flowSteps The flow steps container to register the flow steps to.
 * @param flows The flows container to insert flow steps in order.
 */
export function registerFlowSteps(flowSteps, flows) {
    //TODO: Change some functionality to use custom flows instead of overwriting attack flows...
    //as soon as I understand how to create my own flows and get weaponfx to give support for custom flows!

    //Overwrite base steps (e.g. to skip some steps during an attack reroll!).
    checkItemDestroyedFunction = flowSteps.get("checkItemDestroyed");
    checkWeaponLoadedFunction = flowSteps.get("checkWeaponLoaded");
    checkItemLimitedFunction = flowSteps.get("checkItemLimited");
    checkItemChargedFunction = flowSteps.get("checkItemCharged");
    rollAttacksFunction = flowSteps.get("rollAttacks");
    applySelfHeatFunction = flowSteps.get("applySelfHeat");
    updateItemAfterActionFunction = flowSteps.get("updateItemAfterAction");
    flowSteps.set("checkItemDestroyed",                             customCheckItemDestroyed);
    flowSteps.set("checkWeaponLoaded",                              customCheckWeaponLoaded);
    flowSteps.set("checkitemLimited",                               customCheckItemLimited);
    flowSteps.set("checkItemCharged",                               customCheckItemCharged);
    flowSteps.set("rollAttacks",                                    customRollAttacks);
    flowSteps.set("applySelfHeat",                                  customApplySelfHeat);
    flowSteps.set("updateItemAfterAction",                          customUpdateItemAfterAction);

    
    //Handle new steps
    flowSteps.set(moduleID + ".initCustomAttackData",               initCustomAttackData);
    flowSteps.set(moduleID + ".targetingHelper",                    targetingHelper);
    flowSteps.set(moduleID + ".targetingHelper2",                   targetingHelper2);
    flowSteps.set(moduleID + ".prepareAnimationMacroData",          prepareAnimationMacroData);
    flowSteps.set(moduleID + ".manipulateRerollTargeting",          manipulateRerollTargeting);

    //Avenger Silos
    flowSteps.set(moduleID + ".setAvengerSilosUsedFlags",           setAvengerSilosUsedFlags);

    //Pinaka Missiles
    flowSteps.set(moduleID + ".initPinakaMissileAttackData",        initPinakaMissileAttackData);
    flowSteps.set(moduleID + ".recalculatePinakaMissileSelfHeat",   recalculatePinakaMissileSelfHeat);

    //Delayed Attack
    flowSteps.set(moduleID + ".handleDelayedAttacks",               handleDelayedAttacks);
    flowSteps.set(moduleID + ".initCustomDelayedAttackData",        initCustomDelayedAttackData);

    //Stormbringer
    flowSteps.set(moduleID + ".rollTorrentMissileAttackRolls",      rollTorrentMissileAttackRolls);
    
    //Insert steps
    //BasicAttackFlow
    flows.get("BasicAttackFlow")?.insertStepAfter ("initAttackData",                    moduleID + ".initCustomAttackData");
    flows.get("BasicAttackFlow")?.insertStepBefore("showAttackHUD",                     moduleID + ".targetingHelper");
    flows.get("BasicAttackFlow")?.insertStepAfter ("showAttackHUD",                     moduleID + ".targetingHelper2");
    flows.get("BasicAttackFlow")?.insertStepBefore("printAttackCard",                   moduleID + ".prepareAnimationMacroData");
    flows.get("BasicAttackFlow")?.insertStepBefore("printAttackCard",                   moduleID + ".manipulateRerollTargeting");

    //WeaponAttackFlow
    flows.get("WeaponAttackFlow")?.insertStepAfter ("initAttackData",                   moduleID + ".initCustomAttackData");
    flows.get("WeaponAttackFlow")?.insertStepBefore("showAttackHUD",                    moduleID + ".targetingHelper");
    flows.get("WeaponAttackFlow")?.insertStepAfter ("showAttackHUD",                    moduleID + ".targetingHelper2");
    flows.get("WeaponAttackFlow")?.insertStepBefore("printAttackCard",                  moduleID + ".prepareAnimationMacroData");
    flows.get("WeaponAttackFlow")?.insertStepBefore("printAttackCard",                  moduleID + ".manipulateRerollTargeting");   

    //Avenger Silos
    flows.get("WeaponAttackFlow")?.insertStepAfter("printAttackCard",                   moduleID + ".setAvengerSilosUsedFlags");

    //Pinaka Missiles
    flows.get("WeaponAttackFlow")?.insertStepAfter(moduleID + ".initCustomAttackData",  moduleID + ".initPinakaMissileAttackData");
    flows.get("WeaponAttackFlow")?.insertStepAfter("setAttackTags",                     moduleID + ".recalculatePinakaMissileSelfHeat");

    //Delayed Attack
    flows.get("WeaponAttackFlow")?.insertStepAfter("checkItemCharged",                  moduleID + ".handleDelayedAttacks");
    flows.get("WeaponAttackFlow")?.insertStepAfter(moduleID + ".handleDelayedAttacks",  moduleID + ".initCustomDelayedAttackData");

    //Stormbringer
    flows.get("WeaponAttackFlow")?.insertStepAfter("rollAttacks",                       moduleID + ".rollTorrentMissileAttackRolls");
}

/**
 * Initializes some variables and pre/post flow hooks.
 * Should be called within ready hook.
 */
export async function init() {
    //Set flag for usage in other functions (e.g. LibWrapper for updateTokenTargets)
    await game.user.setFlag(moduleID, Flags.attackFlowRunning, false);
    //Set flag for usage in other functions (e.g. animation on attack templates)
    await game.user.setFlag(moduleID, Flags.attackFlowTemplates, []);
    //Set damage types flag for usage in other functions (e.g. animation per damage types)
    await game.user.setFlag(moduleID, Flags.attackFlowDamageTypes, []);
    //Set damage types flag for usage in other functions (e.g. animation per damages)
    await game.user.setFlag(moduleID, Flags.attackFlowDamages, []);
    
    libWrapper.register(moduleID, 'User.prototype.updateTokenTargets', async (wrapped, ...args) => {
        if(args.length > 0 && game.user.getFlag(moduleID, Flags.attackFlowRunning) && game.settings.get(moduleID, Settings.disableAttackTemplateUntargeting)) {
            const targets = canvas.tokens?.placeables.filter(token => {
                for(let targetID of args[0]) {
                    if(targetID === token.id)
                        return token;
                }
            });
            for(let target of targets) {
                target.setTarget(true, { releaseOthers: false, groupSelection: true });
            }
            //broadcastActivity({ targets });
        } else {
            return wrapped(...args);
        }
    }, 'MIXED');

    Hooks.on("lancer.postFlow.BasicAttackFlow", async (flow, isContinue) => {
        //Cleanup main shit
        await cleanupAdvancedAutomationData(flow.state, flow.options, isContinue);        
        if(game.settings.get(moduleID, Settings.untargetAfterAttack))
            await untargetTokens();

        //Handle special systems
        await handlePostFlowTlaloc(flow.state, flow.options, isContinue);
        await handlePostFlowAvengerSilos(flow.state, flow.options, isContinue);

        //Resolve multiple simultaneous actions
        await actionResolver(flow.state);

        //Remove attack templates
        if(game.settings.get(moduleID, Settings.removeTemplatesAfterAttack))
            await removeAttackTemplates(flow.state, flow.options, isContinue);

        //Cleanup the rest
        
        //Set finished!
        if(flow.state.data.laa?.reroll_data)
            flow.state.data.laa.reroll_data.finished = true;
    });

    Hooks.on("lancer.postFlow.WeaponAttackFlow", async (flow, isContinue) => {
        //Cleanup main shit
        await cleanupAdvancedAutomationData(flow.state, flow.options, isContinue);
        if(game.settings.get(moduleID, Settings.untargetAfterAttack))
            await untargetTokens();

        //Handle special systems
        await handlePostFlowTlaloc(flow.state, flow.options, isContinue);
        await handlePostFlowAvengerSilos(flow.state, flow.options, isContinue);
        await handlePostFlowStormbringer(flow.state, flow.options, isContinue);
        
        //Resolve multiple simultaneous actions
        await actionResolver(flow.state);

        //Remove attack templates
        if(game.settings.get(moduleID, Settings.removeTemplatesAfterAttack))
            await removeAttackTemplates(flow.state, flow.options, isContinue);

        //Cleanup the rest
        await cleanupPinakaMissileData(flow.state, flow.options, isContinue);
        await cleanupDelayedAttackData(flow.state, flow.options, isContinue);

        //Set finished!
        if(flow.state.data.laa?.reroll_data)
            flow.state.data.laa.reroll_data.finished = true;
    });    
}

/**
 * Resolve multiple simultaneous actions at end of attack flow!
 * @param state: The current flow state.
 */
async function actionResolver(state) {
    if(state.data.laa?.action_resolver) {
        const resolveActionFunc = async (state, selectedAction) => { 
            await state.data.laa.action_resolver[selectedAction].resolver_function(state);
            state.data.laa.action_resolver.splice(selectedAction, 1);

            let invalidActionIndizies = [];
            for(let i = 0; i < state.data.laa.action_resolver.length; i++) {
                if(!await state.data.laa.action_resolver[i].reevaluate_function(state)) {
                    invalidActionIndizies.push(i);
                }
            }
            for(const invalidActionIndex of invalidActionIndizies) {
                state.data.laa.action_resolver.splice(invalidActionIndex, 1);
            }
        }

        //If we only have one action, do not show the message!
        if(state.data.laa.action_resolver.length === 1) {
            await resolveActionFunc(state, 0);
        } else {
            while(state.data.laa.action_resolver.length > 0) {
                let messageActions = '';
                for(let i = 0; i < state.data.laa.action_resolver.length; i++) {
                    messageActions = messageActions + '<option value="' + i + '">' + state.data.laa.action_resolver[i].name + '</option>';
                }
                let selectedAction = -1;
                try {
                    selectedAction = await Dialog.prompt({
                        title: "Action resolver " + state.item?.name ?? "" + isRerollAttack(state) ? " Reroll Attack" : "",
                        content: `
                            <div>
                                <h2>Found multiple actions to trigger!</h2>
                            </div>
                            <div>
                                Please select which action you want to trigger first!
                            </div>
                            <div>
                                <select name="actionSelect">` + messageActions + `</select>
                            </div>
                            <br/>`,
                        callback: async(html) => {
                            return html.find('[name="actionSelect"]').val();
                        }
                    });
                } catch {
                    selectedAction = -1;
                    if(await simpleYesNoQuestion("Action resolver", "Cancel action resolver?", "Do you really want to cancel resolving the actions?"))
                        break; //If yes jump out of the while loop canceling the action resolving!
                }

                if(selectedAction >= 0) {
                    await resolveActionFunc(state, selectedAction);
                }            
            }
        }
    }
}

/**
 * Untargets all currently targeted tokens.
 */
async function untargetTokens() {
    //Untarget
    await game.user.updateTokenTargets();
}

/**
 * ====================================
 * Additional attack flow steps
 * ====================================
 */

/**
 * Attack flow step to init custom data for this module. Sets some state and flag data.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function initCustomAttackData(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");

    //Untarget (Is annoying as fuck!!!)
    if(game.settings.get(moduleID, Settings.untargetBeforeAttack))
        await untargetTokens(state, options);  

    //Init laa data!
    if(!state.data.laa)
        state.data.laa = {};
    //Store temporary attack data!
    if(!state.data.laa.temp)
        state.data.laa.temp = { attack_results: [], hit_results: [], targets: [] }    
    //Store templates!
    if(!state.data.laa.attack_templates)
        state.data.laa.attack_templates = new Map();
    //Hooks for template creation!
    if(!state.data.laa.hooks)
        state.data.laa.hooks = { createTemplate: "", deleteTemplate: "" };

    return true;
}

/**
 * Attack flow step to overwrite checkItemDestroyed flow step. Used to either completely ignore or add on top of original functionalitiy.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function customCheckItemDestroyed(state, options) {
    if(isRerollAttack(state))
        return true;
    
    return checkItemDestroyedFunction(state, options);
}

/**
 * Attack flow step to overwrite checkWeaponLoaded flow step. Used to either completely ignore or add on top of original functionalitiy.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function customCheckWeaponLoaded(state, options) {
    if(isRerollAttack(state))
        return true;

    return checkWeaponLoadedFunction(state, options);
}

/**
 * Attack flow step to overwrite checkItemLimited flow step. Used to either completely ignore or add on top of original functionalitiy.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function customCheckItemLimited(state, options) {
    if(isRerollAttack(state))
        return true;

    return checkItemLimitedFunction(state, options);
}

/**
 * Attack flow step to overwrite checkItemCharged flow step. Used to either completely ignore or add on top of original functionalitiy.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function customCheckItemCharged(state, options) {
    if(isRerollAttack(state))
        return true;

    return checkItemChargedFunction(state, options);
}

/**
 * Attack flow step to handle some special targeting stuff. Sets some necessary flags and saves created templates during attack flow for later usage.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled.  
 */
async function targetingHelper(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");    
    
    //Set flag for usage in other functions (e.g. LibWrapper for updateTokenTargets)
    await game.user.setFlag(moduleID, Flags.attackFlowRunning, true);
    //Set flag for usage in other functions (e.g. animation on attack templates)
    await game.user.setFlag(moduleID, Flags.attackFlowTemplates, state.data.laa.attack_templates);
    
    //Hooks for template creation!
    state.data.laa.hooks.createTemplate = await Hooks.on("createMeasuredTemplate", 
    (document, opitons, user) => {
        if(game.user.id === user) {
            state.data.laa.attack_templates.set(document.id, []);
        }
    });
    state.data.laa.hooks.deleteTemplate = await Hooks.on("deleteMeasuredTemplate", 
    (document, opitons, user) => {
        if(game.user.id === user) {
            state.data.laa.attack_templates.delete(document.id);
        }
    });
    
    return true;
}

/**
 * Attack flow step to handle some special targeting stuff. Adds found target tokens inside placed templates to the attack templates flag for later usage.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled.  
 */
async function targetingHelper2(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    
    //Must be done after concluding the attack hud, as we cannot find the targets during template creation....
    if(state.data.laa.attack_templates) {
        for(let key of state.data.laa.attack_templates.keys()) {
            state.data.laa.attack_templates.set(key, targetsFromTemplate(key, false));
        }
    }
    
    return true;
}

/**
 * Attack flow step to overwrite rollAttacks flow step. Used to either completely ignore or add on top of original functionalitiy.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function customRollAttacks(state, options) {
    if(isAutoHitAllWeaponAttackFlow(state)) {
        autoHitAllRollAttack(state);
        return true;
    } else if(isSpecialWeaponAttackFlow(state)) {
        //Special weapons shall handle their hit rolling and detection either through auto_hit_all or through their own functionality!
        return true;
    } else {
        return rollAttacksFunction(state, options);
    }
}

/**
 * Attack flow step to overwrite applySelfHeat flow step. Used to either completely ignore or add on top of original functionalitiy.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function customApplySelfHeat(state, options) {
    //If reroll, remove self heat, as it should have been applied already and should not be shown on attack card...
    if(isRerollAttack(state))
        state.data.self_heat = 0;

    return applySelfHeatFunction(state, options);
}

/**
 * Attack flow step to overwrite updateItemAfterAction flow step. Used to either completely ignore or add on top of original functionalitiy.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function customUpdateItemAfterAction(state, options) {
    //If reroll, do not update item again, as it has already been updated....
    if(isRerollAttack(state))
        return true;

    return updateItemAfterActionFunction(state, options);
}

/**
 * Attack flow step to prepare some animation data for usage in macros (e.g. Created templates, damage tyypes ...).
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function prepareAnimationMacroData(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");

    //Set target templates flag for usage in other functions (e.g. animation on attack templates)
    let attackTemplates = [];
    if(state.data.laa.attack_templates)
        attackTemplates = Array.from(state.data.laa.attack_templates, ([id, targetIDs]) => ({ id, targetIDs }));
    await game.user.setFlag(moduleID, Flags.attackFlowTemplates, attackTemplates);

    //Set damage types and damage flags for usage in other functions (e.g. animation per damage types)
    let damages = [];
    let damageTypes = [];
    for(let damage of state.item?.currentProfile()?.damage ?? []) {
        damages.push(damage.val);
        damageTypes.push(damage.type);
    }
    await game.user.setFlag(moduleID, Flags.attackFlowDamages, damages);
    await game.user.setFlag(moduleID, Flags.attackFlowDamageTypes, damageTypes);
    
    return true;
}

/**
 * Attack flow step to save hit targets of normal attacks and add them to later happening rerolls.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
async function manipulateRerollTargeting(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");

    //Save hit targets for later usage
    state.data.laa.temp.attack_results = state.data.attack_results;
    state.data.laa.temp.hit_results = state.data.hit_results;
    state.data.laa.temp.targets = state.data.acc_diff.targets;

    //Add hit targets from normal attack to reroll attack
    if(isRerollAttack(state))
    {
        state.data.attack_results = state.data.laa.reroll_data.attack_results.concat(state.data.attack_results);
        state.data.hit_results = state.data.laa.reroll_data.hit_results.concat(state.data.hit_results);
        state.data.acc_diff.targets = state.data.laa.reroll_data.targets.concat(state.data.acc_diff.targets);
    }
    
    return true;
}

/**
 * ====================================
 * Additional post attack flow steps
 * ====================================
 */

/**
 * Post attack flow step to cleanup any attack flow addtion data created during attack flows.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow. 
 * @param isContinue Used to determine if the current flow has been canceled or not.
 */
async function cleanupAdvancedAutomationData(state, options, isContinue) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    
    if(state.data.laa.hooks?.createTemplate)
        Hooks.off("createMeasuredTemplate", state.data.laa.hooks.createTemplate);
    if(state.data.laa.hooks?.deleteTemplate)
        Hooks.off("deleteMeasuredTemplate", state.data.laa.hooks.deleteTemplate);
    
    //Set flag for usage in other functions (e.g. LibWrapper for updateTokenTargets)
    await game.user.setFlag(moduleID, Flags.attackFlowRunning, false);
    //Set flag for usage in other functions (e.g. animation on attack templates)
    await game.user.setFlag(moduleID, Flags.attackFlowTemplates, []);
    //Set damage types flag for usage in other functions (e.g. animation per damage types)
    await game.user.setFlag(moduleID, Flags.attackFlowDamageTypes, []);
    //Set damage types flag for usage in other functions (e.g. animation per damages)
    await game.user.setFlag(moduleID, Flags.attackFlowDamages, []);
}

/**
 * Post attack flow step to remove attack templates from the scene after attack has resolved.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow. 
 * @param isContinue Used to determine if the current flow has been canceled or not. 
 */
async function removeAttackTemplates(state, options, isContinue) {
    //Remove targeting helper templates from view
    if(!state.data.laa.delayed_attack || isContinue) //Do not remove if delayed attack got canceled!
        removeTemplatesFromScene(state.data.laa.attack_templates?.keys());
}


/**
 * ====================================
 * On combat change (Hook Events)
 * ====================================
 */

/**
 * Function which handles all combat updates for attack flow additions.
 * Should be called within the updateCombat hook for the gm.
 * @param actor: The actor for the combat update handling.
 * @param currentCombatant: The current combatant instance after the turn change.
 * @param currentRound: The current round after the change.
 */
export async function onCombatUpdateGM(actor, currentCombatant, currentRound) {
    await onAvengerSilosCombatUpdateGM(actor, currentCombatant, currentRound);
    await onStormbringerCombatUpdateGM(actor, currentCombatant, currentRound);
}

/**
 * Function which handles all combat deletions for attack flow additions. * 
 * Should be called within the deleteCombat hook for the gm.
 * @param actor: The actor for the combat deletion handling.
 */
export async function onCombatDeleteGM(actor) {
    await onAvengerSilosCombatDeleteGM(actor);
    await onStormbringerCombatDeleteGM(actor);
}