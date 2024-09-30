import { moduleID, Flags, Settings } from "../../global.js";
//Automation helpers
import { simpleYesNoQuestion } from "../../automationHelpers/automationHelpers.js";
import { removeTemplatesFromScene, targetsFromTemplate } from "../../automationHelpers/templateAndTargetingHelpers.js";
import { isRerollAttack } from "../../automationHelpers/rerollAttackHelpers.js";
//Attack flow helpers
import { hasNormalHit, hasCritHit, calculateOverkillHeat } from "./attackFlowAdditionHelpers.js";
import { cleanupDelayedAttackData, handleDelayedAttacks, initCustomDelayedAttackData } from "../../automationHelpers/delayedAttackHelpers.js";
//Overpower Caliber
import { handleOverpowerCaliber, setOverpowerCaliberUsedFlags, onCombatUpdateGM as onOverpowerCaliberCombatUpdateGM, onCombatDeleteGM as onOverpowerCaliberCombatDeleteGM } from "./core_bonus/overpowerCaliber.js"
//Monarch
import { handlePostFlowTlaloc } from "./mechs/monarch/tlaloc.js";
import { cleanupPinakaMissileData, initPinakaMissileAttackData, recalculatePinakaMissileSelfHeat } from "./mechs/monarch/pinakaMissiles.js";
import { handlePostFlowAvengerSilos, onCombatUpdateGM as onAvengerSilosCombatUpdateGM, onCombatDeleteGM as onAvengerSilosCombatDeleteGM, setAvengerSilosUsedFlags } from "./mechs/monarch/avengerSilos.js";
//Stormbringer
import { handlePostFlowStormbringer, onCombatUpdateGM as onStormbringerCombatUpdateGM, onCombatDeleteGM as onStormbringerCombatDeleteGM, rollTorrentMissileAttackRolls } from "./pilot_talents/stormbringer.js";

let checkItemDestroyedFunction;
let checkWeaponLoadedFunction;
let checkItemLimitedFunction;
let checkItemChargedFunction;
let rollAttacksFunction;
let rollDamagesFunction;
let applySelfHeatFunction;
let updateItemAfterActionFunction;

/**
 * ====================================
 * Init attack flow additions
 * ====================================
 */

/**
 * Registers the new flows and flow steps to corresponding flows.
 * Must be called within register flows hook.
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
    rollDamagesFunction = flowSteps.get("rollDamages");
    applySelfHeatFunction = flowSteps.get("applySelfHeat");
    updateItemAfterActionFunction = flowSteps.get("updateItemAfterAction");
    flowSteps.set("checkItemDestroyed",                             customCheckItemDestroyed);
    flowSteps.set("checkWeaponLoaded",                              customCheckWeaponLoaded);
    flowSteps.set("checkitemLimited",                               customCheckItemLimited);
    flowSteps.set("checkItemCharged",                               customCheckItemCharged);
    flowSteps.set("rollAttacks",                                    customRollAttacks);
    flowSteps.set("rollDamages",                                    customRollDamages);
    flowSteps.set("applySelfHeat",                                  customApplySelfHeat);
    flowSteps.set("updateItemAfterAction",                          customUpdateItemAfterAction);


    //Handle new steps
    flowSteps.set(moduleID + ".initCustomAttackData",               initCustomAttackData);
    flowSteps.set(moduleID + ".targetingHelper",                    targetingHelper);
    flowSteps.set(moduleID + ".targetingHelper2",                   targetingHelper2);
    flowSteps.set(moduleID + ".fakeHitRolls",                       fakeHitRolls);
    flowSteps.set(moduleID + ".resolveFakeHitRolls",                resolveFakeHitRolls);
    flowSteps.set(moduleID + ".recalculateOverkillHeat",            recalculateOverkillHeat);
    flowSteps.set(moduleID + ".prepareAnimationMacroData",          prepareAnimationMacroData);

    //Overpower Caliber
    flowSteps.set(moduleID + ".handleOverpowerCaliber",             handleOverpowerCaliber);
    flowSteps.set(moduleID + ".setOverpowerCaliberUsedFlags",       setOverpowerCaliberUsedFlags);

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
    flows.get("BasicAttackFlow")?.insertStepBefore("showAttackHUD",                     moduleID + ".targetingHelper");
    flows.get("BasicAttackFlow")?.insertStepAfter ("showAttackHUD",                     moduleID + ".targetingHelper2");
    flows.get("BasicAttackFlow")?.insertStepBefore("printAttackCard",                   moduleID + ".prepareAnimationMacroData");

    //WeaponAttackFlow
    flows.get("WeaponAttackFlow")?.insertStepAfter ("initAttackData",                   moduleID + ".initCustomAttackData");
    flows.get("WeaponAttackFlow")?.insertStepBefore("showAttackHUD",                    moduleID + ".targetingHelper");
    flows.get("WeaponAttackFlow")?.insertStepAfter ("showAttackHUD",                    moduleID + ".targetingHelper2");
    flows.get("WeaponAttackFlow")?.insertStepBefore("rollDamages",                      moduleID + ".fakeHitRolls");
    flows.get("WeaponAttackFlow")?.insertStepAfter ("rollDamages",                      moduleID + ".resolveFakeHitRolls");
    flows.get("WeaponAttackFlow")?.insertStepAfter (moduleID + ".resolveFakeHitRolls",  moduleID + ".recalculateOverkillHeat");
    flows.get("WeaponAttackFlow")?.insertStepBefore("printAttackCard",                  moduleID + ".prepareAnimationMacroData");

    //OverpowerCaliber
    flows.get("WeaponAttackFlow")?.insertStepAfter("rollAttacks",                       moduleID + ".handleOverpowerCaliber");
    flows.get("WeaponAttackFlow")?.insertStepAfter("printAttackCard",                   moduleID + ".setOverpowerCaliberUsedFlags");

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
        if(args.length > 0 && game.user.getFlag(moduleID, Flags.attackFlowRunning)) {
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
    if(state.data.action_resolver) {
        const resolveActionFunc = async (state, selectedAction) => { 
            await state.data.action_resolver[selectedAction].resolver_function(state);
            state.data.action_resolver.splice(selectedAction, 1);

            let invalidActionIndizies = [];
            for(let i = 0; i < state.data.action_resolver.length; i++) {
                if(!await state.data.action_resolver[i].reevaluate_function(state)) {
                    invalidActionIndizies.push(i);
                }
            }
            for(const invalidActionIndex of invalidActionIndizies) {
                state.data.action_resolver.splice(invalidActionIndex, 1);
            }
        }

        //If we only have one action, do not show the message!
        if(state.data.action_resolver.length === 1) {
            await resolveActionFunc(state, 0);
        } else {
            while(state.data.action_resolver.length > 0) {
                let messageActions = '';
                for(let i = 0; i < state.data.action_resolver.length; i++) {
                    messageActions = messageActions + '<option value="' + i + '">' + state.data.action_resolver[i].name + '</option>';
                }
                let selectedAction = -1;
                try {
                    selectedAction = await Dialog.prompt({
                        title: "Action resolver " + state.item?.name ?? "" + state.data.laa?.reroll_data ? " Reroll Attack" : "",
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

async function untargetTokens() {
    //Untarget
    await game.user.updateTokenTargets();
}

/**
 * ====================================
 * Additional attack flow steps
 * ====================================
 */ 
async function initCustomAttackData(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    //Store templates!
    state.data.attack_templates = new Map();

    //Init laa data!
    if(!state.data.laa)
        state.data.laa = {};
    
    return true;
}

async function customCheckItemDestroyed(state, options) {
    if(isRerollAttack(state))
        return true;
    
    return checkItemDestroyedFunction(state, options);
}

async function customCheckWeaponLoaded(state, options) {
    if(isRerollAttack(state))
        return true;

    return checkWeaponLoadedFunction(state, options);
}

async function customCheckItemLimited(state, options) {
    if(isRerollAttack(state))
        return true;

    return checkItemLimitedFunction(state, options);
}

async function customCheckItemCharged(state, options) {
    if(isRerollAttack(state))
        return true;

    return checkItemChargedFunction(state, options);
}

async function targetingHelper(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");    

    //Untarget (Is annoying as fuck!!!)
    if(game.settings.get(moduleID, Settings.untargetBeforeAttack))
        await untargetTokens(state, options);
    
    //Set flag for usage in other functions (e.g. LibWrapper for updateTokenTargets)
    await game.user.setFlag(moduleID, Flags.attackFlowRunning, true);
    //Set flag for usage in other functions (e.g. animation on attack templates)
    await game.user.setFlag(moduleID, Flags.attackFlowTemplates, state.data.attack_templates);
    
    //Hooks for template creation!
    state.data.hooks = { createTemplate: "", deleteTemplate: "" };
    state.data.hooks.creatTemplate = await Hooks.on("createMeasuredTemplate", 
    (document, opitons, user) => {
        if(game.user.id === user) {
            state.data.attack_templates.set(document.id, []);
        }
    });
    state.data.hooks.deleteTemplate = await Hooks.on("deleteMeasuredTemplate", 
    (document, opitons, user) => {
        if(game.user.id === user) {
            state.data.attack_templates.delete(document.id);
        }
    });
    
    return true;
}

async function targetingHelper2(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    
    //Must be done after concluding the attack hud, as we cannot find the targets during template creation....
    if(state.data.attack_templates) {
        for(let key of state.data.attack_templates.keys()) {
            state.data.attack_templates.set(key, targetsFromTemplate(key, false));
        }
    }
    
    return true;
}

async function customRollAttacks(state, options) {
    if(state.data.auto_hit_all) {
        const rollStr = "9000";
        const attack_roll = await new Roll(rollStr).evaluate({ async: true });
        let targetedAttackRolls = [];

        state.data.hit_results = [];
        for(const t of state.data.acc_diff.targets) {
            const target = t.target;

            targetedAttackRolls.push({ roll: rollStr, target: target, usedLockOn: null });
            state.data.hit_results.push({
                token: { name: target.name, img: target.actor?.img ?? "" },
                total: "--",
                hit: true,
                crit: false,
           });
        }
        state.data.attack_results = [{ roll: attack_roll, tt: await attack_roll.getTooltip() }];
        state.data.attack_rolls = { roll: rollStr, targeted: targetedAttackRolls };
        return true;
    } else {
        return rollAttacksFunction(state, options);
    }
}

//Do this shit to get damage_results and crit_damage_results as we need them for some automations.....
async function fakeHitRolls(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    if (!state.item) return true;
    if (isRerollAttack(state)) return true;

    state.data.hit_results.push({ total: 15, hit: true, crit: false });
    state.data.hit_results.push({ total: 25, hit: true, crit: true });
}

async function customRollDamages(state, options) {
    if(isRerollAttack(state)) {
        //Check if attack has normal or crit hit without fake hit rolls.
        const has_normal_hit = hasNormalHit(state);
        const has_crit_hit = hasCritHit(state);

        if(has_normal_hit)
            state.data.damage_results = state.data.laa.reroll_data.damage_results;
        if(has_crit_hit)
            state.data.crit_damage_results = state.data.laa.reroll_data.crit_damage_results;

        return true;
    }
    if(state.data.laa?.bonus_damage) {
        state.item.system.active_profile.damage = state.item.system.active_profile.damage.concat(state.data.laa.bonus_damage);
        /*
        //Do normal attack first!
        let isContinue = await rollDamagesFunction(state, options);
        if(isContinue) {
            //Save results as we need them later again. (Overkill heat not needed, as it will be recalculated later anyway!)
            const tempDamageResults = state.data.damage_results;
            const tempCritDamageResults = state.data.crit_damage_results;

            //Next do bonus damage rolls.
            const tempActiveProfile = state.item.system.active_profile;
            state.item.system.active_profile.damage = state.data.laa.bonus_damage;
            isContinue = await rollDamagesFunction(state, options);
            if(isContinue) {
                state.item.system.active_profile = tempActiveProfile;
                
                //Bonus damage halved if more than 1 target!
                //Currently cannot find a satisfying solution, they need to do this shit themselves!!!
                if(state.data.acc_diff.targets.length > 1) {
                    for(let damage_result of state.data.damage_results) {                        
                        damage_result.roll.formula = "" + damage_result.roll.formula + " / 2)";
                    }
                }

                state.data.damage_results = tempDamageResults.concat(state.data.damage_results);
                state.data.crit_damage_results = tempCritDamageResults.concat(state.data.crit_damage_results);                                                          
            }
        }

        return isContinue;
        */
    }
    
    return rollDamagesFunction(state, options);
}

//Do this shit to get damage_results and crit_damage_results as we need them for some automations.....
async function resolveFakeHitRolls(state, option) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    if (!state.item) return true;
    if (isRerollAttack(state)) return true;

    //Save the damage result data for later usage...    
    state.data.temp = { damage_results: [], crit_damage_results: [], overkill_heat: 0 };
    state.data.temp.damage_results = state.data.damage_results;
    state.data.temp.crit_damage_results = state.data.crit_damage_results;
    
    //Remove fake hit rolls from "fakeHitRolls" step.
    state.data.hit_results.pop();
    state.data.hit_results.pop();
    
    //Check if attack has normal or crit hit without fake hit rolls.
    const has_normal_hit = hasNormalHit(state);
    const has_crit_hit = hasCritHit(state);
    
    //Remove data from the state to display it correctly in the chat card.
    if(!has_normal_hit)
        state.data.damage_results = [];
    if(!has_crit_hit)
        state.data.crit_damage_results = [];
    
    return true;
}

async function recalculateOverkillHeat(state, option) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    if (!state.item) return true;

    //Calculate correct overkill heat (might be wrong due to fake hit rolls)
    calculateOverkillHeat(state);

    if(isRerollAttack(state)) {
        //If reroll, remove self heat, as it should have been applied already...
        state.data.self_heat = 0;

        //If reroll, check if current overkill heat is greater than last overkill heat, so we do not apply the overkill heat twice...
        if(state.data.overkill) {            
            let newOverkillHeat = state.data.overkill_heat - state.data.laa.reroll_data.last_overkill_heat;
            if(newOverkillHeat < 0)
                newOverkillHeat = 0;
            state.data.overkill_heat = newOverkillHeat;
        }
    }

    return true;
}

async function customApplySelfHeat(state, options) {
    return applySelfHeatFunction(state, options);
}

async function customUpdateItemAfterAction(state, options) {
    if(isRerollAttack(state))
        return true;

    return updateItemAfterActionFunction(state, options);
}

async function prepareAnimationMacroData(state, options) {
    if (!state.data) throw new TypeError("Attack flow state missing!");

    //Set target templates flag for usage in other functions (e.g. animation on attack templates)
    let attackTemplates = [];
    if(state.data.attack_templates)
        attackTemplates = Array.from(state.data.attack_templates, ([id, targetIDs]) => ({ id, targetIDs }));
    await game.user.setFlag(moduleID, Flags.attackFlowTemplates, attackTemplates);

    //Set damage types and damage flags for usage in other functions (e.g. animation per damage types)
    let damageResults = [];
    if(state.data.damage_results.length > 0)
        damageResults = state.data.damage_results;
    if(state.data.crit_damage_results.length > 0)
        damageResults = state.data.crit_damage_results;
    if(damageResults.length <= 0)
        damageResults = state.data.temp.crit_damage_results;
    let damages = [];
    let damageTypes = [];
    for(let damageResult of damageResults) {
        damages.push(damageResult.roll.total);
        damageTypes.push(damageResult.d_type);
    }
    await game.user.setFlag(moduleID, Flags.attackFlowDamages, damages);
    await game.user.setFlag(moduleID, Flags.attackFlowDamageTypes, damageTypes);
    
    return true;
}


/**
 * ====================================
 * Additional post attack flow steps
 * ====================================
 */ 
async function cleanupAdvancedAutomationData(state, options, isContinue) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    
    if(state.data.hooks?.createTemplate)
        Hooks.off("createMeasuredTemplate", state.data.hooks.creatTemplate);
    if(state.data.hooks?.deleteTemplate)
        Hooks.off("deleteMeasuredTemplate", state.data.hooks.deleteTemplate);
    
    //Set flag for usage in other functions (e.g. LibWrapper for updateTokenTargets)
    await game.user.setFlag(moduleID, Flags.attackFlowRunning, false);
    //Set flag for usage in other functions (e.g. animation on attack templates)
    await game.user.setFlag(moduleID, Flags.attackFlowTemplates, []);
    //Set damage types flag for usage in other functions (e.g. animation per damage types)
    await game.user.setFlag(moduleID, Flags.attackFlowDamageTypes, []);
    //Set damage types flag for usage in other functions (e.g. animation per damages)
    await game.user.setFlag(moduleID, Flags.attackFlowDamages, []);
}

async function removeAttackTemplates(state, options, isContinue) {
    //Remove targeting helper templates from view
    if(!state.data.delayed_attack || isContinue) //Do not remove if delayed attack got canceled!
        removeTemplatesFromScene(state.data.attack_templates?.keys());
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
    await onOverpowerCaliberCombatUpdateGM(actor, currentCombatant, currentRound);
    await onAvengerSilosCombatUpdateGM(actor, currentCombatant, currentRound);
    await onStormbringerCombatUpdateGM(actor, currentCombatant, currentRound);
}

/**
 * Function which handles all combat deletions for attack flow additions. * 
 * Should be called within the deleteCombat hook for the gm.
 * @param actor: The actor for the combat deletion handling.
 */
export async function onCombatDeleteGM(actor) {
    await onOverpowerCaliberCombatDeleteGM(actor);
    await onAvengerSilosCombatDeleteGM(actor);
    await onStormbringerCombatDeleteGM(actor);
}