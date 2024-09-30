import { moduleID, weaponAttackFlowClass, Flags, addHookEventData, removeLastAddedHookEventData, removeHookEventData } from "../global.js";
import { removeTemplatesFromScene, targetsFromTemplate } from "./templateAndTargetingHelpers.js";
import { getItemFromActorByID } from "./tokenOrActorHelpers.js";
import { isActiveCombat } from "./automationHelpers.js";

const hookEventDataRequestor = "delayed_attack";

export const ActivationTiming = {
    noAutomation: "no_automation",
    onRoundStart: "on_round_start",
    onRoundEnd: "on_round_end",
}

/**
 * ====================================
 * Delayed attacks
 * ====================================
 */
/**
 * Creates an attack name for the delayed attack, with increasing number at the end.
 * @param actor: For which the delayed attack name shall be created.
 * @param isAutomated: If this is a automated delayed attack or not.
 * @param itemName: The name of the item for which the name shall be created.
 * @returns 
 */
function createAttackName(actor, isAutomated, itemName) {
    let attackName = isAutomated ? "automated delayed " + itemName + " attack" : "delayed " + itemName + " attack";
    console.log("HELLOOO!!!!");
    console.log(attackName);

    const delayedArray = actor.getFlag(moduleID, Flags.delayedAttacks);
    let highestNumber = 0;
    if(delayedArray) {
        for(const delayedAttack of delayedArray) {
            console.log(delayedAttack.attackName);
            if(delayedAttack.attackName.startsWith(attackName)) {
                const foundNumber = delayedAttack.attackName.substr(attackName.length + 1);
                console.log(foundNumber);
                if(highestNumber < foundNumber) {
                    highestNumber = foundNumber;
                }
            }
        }        
    }
    highestNumber++;
    attackName = attackName + " " + highestNumber;

    return attackName;
}

/**
 * Prepares flags for a delayed weapon attack.
 * @param actor: The actor for which the delayed attack shall be made.
 * @param item: The item for which the attack shall be triggered.
 * @param templateIds: Array of template IDs which shall be used in the delayed attack.
 * @param onRound: The combat round on which the delayed attack shall trigger, if set to -1 or not set at all the attack cannot be resolved automatically and needs to be triggerd by attacking with the weapon.
 * @param activationTiming: The timing on which an automated delayed attack shall trigger. Can be set with ActivationTiming "enum" from this file.
 * @param customAttackName: If this is not an automated attack an attack name can be given here to later resolve the attack with startDelayedAttack function. If null an automatically generated name will be used.
 * @returns Boolean if the delayed attack template data has been prepared or not.
 */
export async function prepareDelayedAttack(actor, item, templateIds, onRound, activationTiming, customAttackName) {
    //Is automated?
    const isAutomated = activationTiming !== ActivationTiming.noAutomation;
    if(isAutomated && !isActiveCombat(actor)) {
        ui.notifications.warn("Cannot prepare automated delayed attack outside of combat!");
        return false;
    }

    //Create attack name
    const attackName = customAttackName ?? createAttackName(actor, isAutomated, item.name);

    //Set flag on actor.
    let delayedArray = actor.getFlag(moduleID, Flags.delayedAttacks);
    if(!delayedArray) {
        delayedArray = [];
    }
    delayedArray.push({
        attackName: attackName,
        activationTiming: activationTiming,
        onRound: onRound,
        templateIds: templateIds,
        itemId: item.id,
        isTriggerable: !isAutomated, //Flag to see if the attack can already be triggered based on automation or if we need to wait.
    });
    await actor.setFlag(moduleID, Flags.delayedAttacks, delayedArray);

    if(isAutomated) {
        await addHookEventData(Flags.hookEventCombatUpdate, actor.uuid, hookEventDataRequestor, attackName);
    } else {
        ui.notifications.info("Delayed attack '" + attackName + "' created! Can be started with game.advancedAutomation.delayedAttack.startDelayedAttack function!");
    }

    return true;
}

/**
 * Manually starts an specific prepared delayed attack.
 * Delayed attack must be prepared with prepareDelayedWeaponAttack function before.
 * @param actor: The actor for which the delayed attack shall be made.
 * @param attackName: The name which was given to the delayed attack template during prepareDelayedAttackTemplates function.
 * @param askBeforeAttack: If the function shall first ask the user with a prompt if they want to start delayed attack.
 */
export async function startDelayedAttack(actor, attackName, askBeforeAttack) {
    const delayedArray = actor.getFlag(moduleID, Flags.delayedAttacks);
    let attackIndex = -1;
    //Search the first occurence of attack name.
    for(let i = 0; i < delayedArray?.length; i++) {
        if(attackIndex === -1) {
            if(delayedArray[i]?.attackName === attackName) {
                attackIndex = i;
            }
        }
    }
    //Nothing found!
    if(attackIndex === -1) {
        ui.notifications.warn("No delayed attack with given name (" + attackName + ") found on actor!");
        return false;
    }
    
    await startDelayedAttacksIntern(actor, [attackIndex], [delayedArray[attackIndex]], askBeforeAttack);
}

/**
 * Starts multiple prepared delayed attacks.
 * Delayed attack must be prepared with prepareDelayedWeaponAttack function before.
 * @param actor: The actor for which the delayed attacks shall be triggered.
 * @param delayedAttackIndizes: The indizes as array for the given delayed attacks within the delayed attack array for the actor.
 * @param delayedAttackData: The delayed attack data array which shall be triggered.
 * @param askBeforeAttack: If the function shall first ask the user with a prompt if they want to start delayed attack.
 */
async function startDelayedAttacksIntern(actor, delayedAttackIndizes, delayedAttackData, askBeforeAttack) {
    if(!delayedAttackIndizes || !delayedAttackData || delayedAttackIndizes.length !== delayedAttackData.length)
        ui.notifications.error("Internal error! Data for delayed attack is not consistent!");

    for(let i = 0; i < delayedAttackData.length; i++) {
        const delayedAttack = delayedAttackData[i];
        const item = getItemFromActorByID(actor, delayedAttack.itemId);
        if(item) {
            let doAttack = true;
            if(askBeforeAttack) {
                await Dialog.wait({
                    title: item.name,
                    content: `
                        <div>
                            <h2>Do you want to start delayed attack for ` + item.name + `?</h2>
                        </div>
                        <div>
                            <i>If you hit no or do not finish the attack the delayed attack can still be triggerd by attacking with the item again!</i>
                        </div>`,
                    buttons: {
                        yes: {
                            icon: '<i class="fas fa-check"></i>',
                            label: "Yes",
                            callback: () => { doAttack = true; }
                        },
                        no: {
                            icon: '<i class="fas fa-times"></i>',
                            label: "No",
                            callback: () => { doAttack = false; }
                        }
                    }
                });
            }

            if(doAttack) {
                const beginWeaponDelayedAttackFlow = async (item) => {
                    //Removing the delayed attack should happen within attack flow, after the delayed attack has been used!
                    const flow = new weaponAttackFlowClass(item);
                    flow.state.data.delayed_attack = { arrayIndex: -1, templateIds: [] };
                    flow.state.data.delayed_attack.array_index = delayedAttackIndizes[i];
                    flow.state.data.delayed_attack.template_ids = delayedAttack.templateIds;
                    console.log("Start delayed weapon attack flow");
                    await flow.begin();
                    console.log("Finished delayed weapon attack flow");
                };                
                await beginWeaponDelayedAttackFlow(item);
            }
        } else {
            ui.notifications.warn("No item with id (" + delayedAttack.itemId + ") found on actor, cannot start delayed attack " + delayedAttack.attackName + "!");
        }
    }
}

/**
 * Clears all delayed attacks from given actor.
 * Use to cleanup if something goes wrong!
 * @param actor: The actor from which all delayed attacks shall be cleared.
 */
export async function clearDelayedAttacks(actor) {
    await actor.unsetFlag(moduleID, Flags.delayedAttacks);
}

/**
 * Removes the last prepared attack.
 * Used if a flow prepares an delayed attack, but gets cancelled due to something else.
 * @param actor: The actor for which the prepared attack was originally prepared.
 */
export async function removeLastPreparedAttack(actor) {
    //Remove from array
    let delayedArray = actor.getFlag(moduleID, Flags.delayedAttacks);
    const removedData = delayedArray.pop();
    await actor.setFlag(moduleID, Flags.delayedAttacks, delayedArray);

    //Remove hook event data
    await removeLastAddedHookEventData(Flags.hookEventCombatUpdate, actor.uuid, hookEventDataRequestor, (customData) => { return customData === removedData.attackName; });

    //Cleanup templates on scene
    removeTemplatesFromScene(removedData?.templateIDs);
}

/**
 * Checks if the given delayed attack data should already be triggered.
 * @param delayedAttackData: Data for the delayed attack.
 * @param currentRound: The current round of this combat.
 * @param currentTurn: The current turn of this combat.
 * @param currentCombatants: The current combatants of this combat.
 * @returns True if the attack shall be triggered, false if not.
 */
function isTrigger(delayedAttackData, currentRound, currentTurn, currentCombatants) {
    if(delayedAttackData.activationTiming === ActivationTiming.onRoundStart && delayedAttackData.onRound === currentRound) {
        return true;
    }
    if(delayedAttackData.activationTiming === ActivationTiming.onRoundEnd) {
        if(delayedAttackData.onRound === currentRound && currentTurn === null) {
            let hasActivations = false;
            for(const combatant of currentCombatants) {
                if(combatant.activations.value > 0) {
                    hasActivations = true;
                }
            }
            return !hasActivations; //Trigger after everyone has acted on turn.
        }
        if(delayedAttackData.onRound < currentRound)
            return true; //Trigger if we have left the round already! Happens if round is switched before everyone has acted!
    }

    return false;
}

/**
 * ====================================
 * Additional attack flow steps
 * ====================================
 */
export async function handleDelayedAttacks(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    //Check if we have delayed attacks which could already be triggered and ask user if they want to trigger them!
    //Only do this if this is not already an delayed attack!
    if(!state.data.delayed_attack) {
        let messageTriggerables = '';
        const delayedArray = state.actor.getFlag(moduleID, Flags.delayedAttacks) ?? [];
        for(let i = 0; i < delayedArray.length; i++) {
            const delayedAttack = delayedArray[i];
            if(delayedAttack.isTriggerable && delayedAttack.itemId === state.item.id)
                messageTriggerables = messageTriggerables + '<option value="' + i + '">' + delayedAttack.attackName + '</option>';
        }
        if(messageTriggerables.length > 0) {
            let delayedAttackSelect = -1;
            try {
                delayedAttackSelect = await Dialog.prompt({
                    title: 'Delayed Attacks!',
                    content: `
                        <div>
                            <h2>Found some delayed attacks to trigger!</h2>
                        </div>
                        <div>
                            Please select if you want to do normal attack or one of the delayed attacks!
                        </div>
                        <div>
                            <select name="delayedAttackSelect">
                                <option value="-1">Normal Attack</option>` + messageTriggerables + `
                            </select>
                        </div>
                        <br/>`,
                    callback: async(html) => {
                        let select = html.find('[name="delayedAttackSelect"]').val();
                        return select;
                    }
                });
            } catch {
                delayedAttackSelect = -1;
            }
            if(delayedAttackSelect >= 0) {
                await startDelayedAttacksIntern(state.actor, [delayedAttackSelect], [delayedArray[delayedAttackSelect]], false);
                return false;
            }
        }
    }

    return true;
}

export async function initCustomDelayedAttackData(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;

    if(state.data.delayed_attack?.template_ids?.length > 0) {
        for(const templateId of state.data.delayed_attack.template_ids) {
            state.data.attack_templates.set(templateId, targetsFromTemplate(templateId, true));
        }
    }
    
    return true;
}


/**
 * ====================================
 * Additional post attack flow steps
 * ====================================
 */ 
export async function cleanupDelayedAttackData(state, options, isContinue) {
    if (!state.data) throw new TypeError("Attack flow state missing!");

    if(isContinue && state.data.delayed_attack) {
        let delayedArray = state.actor.getFlag(moduleID, Flags.delayedAttacks);
        delayedArray.splice(state.data.delayed_attack.array_index, 1);
        await state.actor.setFlag(moduleID, Flags.delayedAttacks, delayedArray);
    }
}


/**
 * ====================================
 * On combat change (Hook Events)
 * ====================================
 */

/**
 * Removes the hook event data for this delayed attack.
 * @param actor: The actor for which the hook event data shall be removed.
 * @param attackName: The attack name for which the hook event data shall be removed.
 */
async function removeDelayedAttackHookEventData(actor, attackName) {
    await removeHookEventData(Flags.hookEventCombatUpdate, actor?.uuid, hookEventDataRequestor, (customData) => { return customData === attackName; });
}

/**
 * Handles the delayed attacks on combat update.
 * Should be called within the updateCombat hook for hook event data.
 * @param hookEventData: The hook event data for which this event got called.
 * @param actor: The actor for which the flags shall be cleaned up.
 */
export async function onCombatUpdateEventData(hookEventData, actor) {
    if(hookEventData.requestor === hookEventDataRequestor) {
        let isInvalidData = true; //To determine if the hook event data seems to be invalid and should be removed...
        let delayedArray = actor.getFlag(moduleID, Flags.delayedAttacks);
        if(delayedArray?.length > 0) {
            //Check if attacks shall already be triggered
            let triggerAttackIndizes = [];
            let triggerAttacks = [];
            for(let i = 0; i < delayedArray.length; i++) {
                //Check if there is even an automated attack for this hook event data!
                if(delayedArray[i].attackName === hookEventData.customData && delayedArray[i].activationTiming !== ActivationTiming.noAutomation) {
                    isInvalidData = false; //Found automated attack for this hook event, so hook event data is valid!
                    //Check if attacks shall already be triggered! Triggerable flag is set by gm events!
                    if(delayedArray[i].isTriggerable) {
                        delayedArray[i].activationTiming = ActivationTiming.noAutomation
                        triggerAttackIndizes.push(i);
                        triggerAttacks.push(delayedArray[i]);
                    }
                }
            }
            if(triggerAttacks.length > 0) {
                //Update flag with activation timing!
                await actor.setFlag(moduleID, Flags.delayedAttacks, delayedArray);
                //Remove hook event data (not needed anymore, as the attack is now set to no automation if it is not used now!)
                for(let i = 0; i < triggerAttacks.length; i++) {
                    await removeDelayedAttackHookEventData(actor, triggerAttacks[i].attackName);
                }
                //Start delayed attacks!
                startDelayedAttacksIntern(actor, triggerAttackIndizes, triggerAttacks, true);
            }
        }

        if(isInvalidData) {
            console.warn("Invalid hook event data found!");
            //There was hook event data even though we do not have delayed attacks to automate!!!
            //Remove the hook event data, as we shouldn't even get here!!!
            await removeDelayedAttackHookEventData(actor, hookEventData.customData);
        }
    }
}

/**
 * Handles the delayed attacks on pre combat update.
 * Should be called within the preUpdateCombat hook for the gm.
 * @param actor: The actor for which the delayed attacks shall be handled.
 * @param currentRound: The current round after the change.
 * @param currentTurn: The current turn.
 * @param currentCombatants: The current combatants of this combat.
 */
export async function onPreUpdateCombatGM(actor, currentRound, currentTurn, currentCombatants) {
    let delayedArray = actor?.getFlag(moduleID, Flags.delayedAttacks);
    if(delayedArray?.length > 0) {
        for(let i = 0; i < delayedArray.length; i++) {
            //Check if there is an automated attack for this hook event data and if it shall trigger now!
            if(!delayedArray[i].isTriggerable && isTrigger(delayedArray[i], currentRound, currentTurn, currentCombatants)) {
                delayedArray[i].isTriggerable = true;
            }
        }
        await actor.setFlag(moduleID, Flags.delayedAttacks, delayedArray);
    }   
}

/**
 * Cleans up the delayed attacks on combat delete.
 * Should be called within the deleteCombat hook for the gm.
 * @param actor: The actor for which the delayed attacks shall be cleaned up.
 */
export async function onCombatDeleteGM(actor) {
    let delayedArray = actor?.getFlag(moduleID, Flags.delayedAttacks);
    if(delayedArray?.length > 0) {
        for(let i = 0; i < delayedArray.length; i++) {
            //Check if there is even an automated attack left that isn't triggerable yet for this hook event data!
            if(!delayedArray[i].isTriggerable) {
                delayedArray[i].activationTiming = ActivationTiming.noAutomation
                delayedArray[i].isTriggerable = true;
            }
        }
        await actor.setFlag(moduleID, Flags.delayedAttacks, delayedArray);
    }
}

















/**
 * Handles delayed attacks on combat round change.
 * Should be called within the combatRound hook.
 * @param hookEventData: The hook event data for which this event got called.
 * @param actor: The actor for which the delayed attack shall be cleaned up.
 * @param combatUuid: The current combat uuid.
 * @param round: The current round after the change.
 */
/*export async function onCombatRoundChange(hookEventData, actor, combatUuid, round) {
    if(hookEventData.requestor === hookEventDataRequestor) {
        let isInvalidData = true; //To determine if the hook event data seems to be invalid and should be removed...
        let delayedArray = actor.getFlag(moduleID, delayedAttacksFlag);
        if(delayedArray?.length > 0) {
            //Check if attacks shall already be triggered
            let triggerAttackIndizes = [];
            let triggerAttacks = [];
            for(let i = 0; i < delayedArray.length; i++) {
                //Check if there is even an automated attack for this hook event data!
                if(delayedArray[i].attackName === hookEventData.customData && delayedArray[i].onRound >= 0) {
                    isInvalidData = false; //Found automated attack for this hook event, so hook event data is valid!
                    //Check if attacks shall already be triggered!
                    if(delayedArray[i].combatUuid === combatUuid && delayedArray[i].onRound === round) {
                        delayedArray[i].isTriggerable = true;
                        triggerAttackIndizes.push(i);
                        triggerAttacks.push(delayedArray[i]);
                    }
                }
            }
            if(triggerAttacks.length > 0) {
                //Update flag with triggered values!
                await actor.setFlag(moduleID, delayedAttacksFlag, delayedArray);
                //Remove hook event data (not needed anymore, as the attack is now set to triggered)
                for(let i = 0; i < triggerAttacks.length; i++) {
                    removeDelayedAttackHookEventData(actor, triggerAttacks[i].attackName);
                }
                //Start delayed attacks!
                startDelayedAttacksIntern(actor, triggerAttackIndizes, triggerAttacks, true);
            }
        }

        if(isInvalidData) {
            console.log("Invalid hook event data found!");
            //There was hook event data even though we do not have delayed attacks to automate!!!
            //Remove the hook event data, as we shouldn't even get here!!!
            removeDelayedAttackHookEventData(actor, hookEventData.customData);
        }
    }
}*/

/**
 * Cleans up the delayed attack flags on combat delete.
 * Should be called within the deleteCombat hook.
 * @param hookEventData: The hook event data for which this event got called.
 * @param actor: The actor for which the delayed attack shall be cleaned up.
 * @param combatUuid: The current combat uuid.
 */
/*export async function onCombatDelete(hookEventData, actor, combatUuid) {
    if(hookEventData.requestor === hookEventDataRequestor) {        
        let isInvalidData = true; //To determine if the hook event data seems to be invalid and should be removed...
        let delayedArray = actor?.getFlag(moduleID, delayedAttacksFlag);
        if(delayedArray?.length > 0) {
            //Check for Attack name
            let foundAttackIndizes = [];
            for(let i = 0; i < delayedArray.length; i++) {
                //Check if there is even an automated attack for this hook event data!
                if(delayedArray[i].attackName === hookEventData.customData && delayedArray[i].onRound >= 0) {
                    isInvalidData = false; //Found automated attack for this hook event, so hook event data is valid!
                    //Check if delayed attack is for this combat
                    if(delayedArray[i].combatUuid === combatUuid && !delayedArray[i].isTriggerable) {
                        delayedArray[i].isTriggerable = true;
                        foundAttackIndizes.push(i);
                    }
                }
            }
            if(foundAttackIndizes.length > 0) {
                //Ask if delayed attack data shall be deleted!
                let deleteData = false;
                try {
                    await Dialog.wait({
                        title: actor.name,
                        content: `
                            <div>
                                <h2>Combat was deleted! Found delayed attack data for ` + actor.name + `!?</h2>
                            </div>
                            <div>
                                Shall the data be deleted? If you hit no, you will be able to trigger the delayed attacks through attacking with the item!
                            </div>`,
                        buttons: {
                            yes: {
                                icon: '<i class="fas fa-check"></i>',
                                label: "Yes",
                                callback: () => { deleteData = true; }
                            },
                            no: {
                                icon: '<i class="fas fa-times"></i>',
                                label: "No",
                                callback: () => { deleteData = false; }
                            }
                        }
                    }); 
                } catch {
                    deleteData = true;
                }
                //Delete delayed attack data!
                if(deleteData) {
                    ui.notifications.warn("Delayed attack data for " + actor.name + " deleted!");                    
                    for(let i = 0; i < foundAttackIndizes.length; i++) {
                        const removedData = delayedArray.splice(foundAttackIndizes[i], 1);
                        if(removedData.length > 0) {
                            removeDelayedAttackHookEventData(actor, removedData[0]?.attackName);
                            //Cleanup templates on scene
                            removeTemplatesFromScene(removedData[0]?.templateIds);
                        }
                    }
                }
                //Update flag
                await actor.setFlag(moduleID, delayedAttacksFlag, delayedArray);
            }
        }

        if(isInvalidData) {
            console.log("Invalid hook event data found!");
            //There was hook event data even though we do not have delayed attacks to automate!!!
            //Remove the hook event data, as we shouldn't even get here!!!
            removeDelayedAttackHookEventData(actor, hookEventData.customData);
        }
    }
}*/