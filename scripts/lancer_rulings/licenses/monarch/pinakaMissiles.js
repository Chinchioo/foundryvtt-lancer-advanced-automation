import { moduleID, LIDs, Settings } from "../../../global.js";
import { isActiveCombat, getTagData } from "../../../automationHelpers/automationHelpers.js";
import { ActivationTiming, prepareDelayedAttack, removeLastPreparedAttack } from "../../../automationHelpers/delayedAttackHelpers.js";
import { createTargetAreas } from "../../../automationHelpers/templateAndTargetingHelpers.js";

const damageTypeHTML = ['<i class="cci cci-explosive i--l" style="color:#fca017"></i>Explosive',
                        '<i class="cci cci-kinetic i--l" style="color:#616161"></i>Kinetic',
                        '<i class="cci cci-energy i--l" style="color:#2195ca"></i>Energy'];

/**
 * ====================================
 * Additional activation flow steps
 * ====================================
 */

/**
 * Activation flow step to handle special pinaka missile activations prepare delayed attack and swap modular head.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
export async function handlePinakaMissileActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;
    
    //Check if custom item!
    if(state.item.system.lid === LIDs.pinakaMissile || state.item.system.lid === LIDs.pinakaMissileMkii)
        ui.notifications.warn("Currently cannot automate pinaka missile activations with default pinaka missile item! Please use the one from the advanced automation compendium!");
    //Delayed attack
    else if(state.data.action?.lid === LIDs.pinakaMissileLaaDelayedAttack || state.data.action?.lid === LIDs.pinakaMissileMkiiLaaDelayedAttack) {
        //Set round trigger
        let triggerOnRound = -1;
        let activationTiming = ActivationTiming.noAutomation;
        //Automation active? If not prepare not automated delayed attack!
        if(game.settings.get(moduleID, Settings.monarchPinakaMissileDelayedAutomation)) {
            if(isActiveCombat(state.actor)) {
                triggerOnRound = game.combat.current.round + 1; //End of next round!
                activationTiming = ActivationTiming.onRoundEnd; //After everyone has acted!
            } else
                ui.notifications.warn("No combat started, delayed attack will not be prepared for automation and needs to be started manually through macros or attacking with the item.");
        } else {
            ui.notifications.info("Automation deactivated, delayed attack will not be prepared for automation and needs to be started manually through macros or attacking with the item."); 
        }

        //Create target areas
        const isMkii = state.data.action.lid === LIDs.pinakaMissileMkiiLaaDelayedAttack;
        let targetAreaAmount = 0;
        if (canvas.grid?.type === CONST.GRID_TYPES.GRIDLESS)
            ui.notifications.warn("Not sure how to place delayed attack on gridless scenes!!!");
        else if(canvas.grid?.type === CONST.GRID_TYPES.SQUARE)
            targetAreaAmount = isMkii ? 18 : 2;
        else
            targetAreaAmount = isMkii ? 14 : 2
        const templateIds = await createTargetAreas(isMkii ? 0.5 : 1, "Blast", targetAreaAmount, game.settings.get(moduleID, Settings.monarchPinakaMissileDelayedTemplateImage));
        if(!templateIds) {
            ui.notifications.warn(state.item.name + " delayed attack activation got canceled!");
            return false;
        }

        //Prepare delayed attack
        await prepareDelayedAttack(state.actor, state.item, templateIds, triggerOnRound, activationTiming, null);
    }
    //Pinaka missiles mkii
    //Swap modular head protocol
    else if((state.data.action?.lid === LIDs.pinakaMissileMkiiLaaSwapHead && checkPinakaUseable(state.item))) {
        //Make the default checkbox selection the currently selected type
        const currentProfileIndex = state.item.system.selected_profile_index ?? 0;
        
        //Let user select desired damage type
        let damageTypeSelect;
        try {
            damageTypeSelect = await Dialog.prompt({
                title: state.data.action.name,
                content: `
                    <div>
                        <h2>Select damage type!</h2>
                    </div>
                    <div>
                        <input type="radio" id="explosive" name="typeSelect" value="0"` + (currentProfileIndex === 0 ? ' checked="true"' : '') + `/>
                        <label for="explosive">` + damageTypeHTML[0] + `</label>
                        </br>
                        <input type="radio" id="kinetic" name="typeSelect" value="1"` + (currentProfileIndex === 1 ? ' checked="true"' : '') + `/>
                        <label for="kinetic">` + damageTypeHTML[1] + `</label>
                        </br>
                        <input type="radio" id="energy" name="typeSelect" value="2"` + (currentProfileIndex === 2 ? ' checked="true"' : '') + `/>
                        <label for="energy">` + damageTypeHTML[2] + `</label>
                    </div>
                    <br/>`,
                callback: async(html) => {
                    let typeSelect = html.find('[name="typeSelect"]');
                    for(let select of typeSelect) {
                        if(select.checked)
                            return select.value;
                    }
                }
            });

            state.data.pinaka_head_swap = { selectedDamageTypeIndex: damageTypeSelect };

            //Remove heat!
            state.data.self_heat = 0;
            state.data.tags = [];
        } catch (e) {
            ui.notifications.warn(state.data.action.name + " canceled!");
            console.warn(e);
            return false;
        }
    }

    return true;
}

/**
 * Activation flow step to update pinaka missile item data after a special activation (e.g. changing damage type for swap modular head).
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
export async function updatePinakaMissileItemAfterActivation(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;
    
    //Pinaka missiles mkii 
    //Swap modular head protocol
    if(state.data.action?.lid === LIDs.pinakaMissileMkiiLaaSwapHead && checkPinakaUseable(state.item) && state.data.pinaka_head_swap?.selectedDamageTypeIndex) {
        const damageTypeIndex = state.data.pinaka_head_swap.selectedDamageTypeIndex; 

        //Switch to selected damage type
        await state.item.update({"system.active_profile": state.item.system.profiles[damageTypeIndex], "system.selected_profile_index": damageTypeIndex });
    }
    
    return true;
}

/**
 * Activation flow step to print swap modular head activation chat message. Needed to indicate that the special swap modular head activation has been used.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
export async function printPinakaMissileActivationChatMessage(state, options) {
    //Pinaka missiles mkii 
    //Swap modular head protocol
    if(state.data.action?.lid === LIDs.pinakaMissileMkiiLaaSwapHead && checkPinakaUseable(state.item) && state.data.pinaka_head_swap?.selectedDamageTypeIndex) {
        //Chat Data        
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
            speaker: ChatMessage.getSpeaker({token: state.actor, alias: state.actor?.token?.name}),
            content: 'Switched Pinaka heads to:<br>' + damageTypeHTML[state.data.pinaka_head_swap.selectedDamageTypeIndex],
            emote: true,
        }
        ChatMessage.create(chatData);
        /*
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.IC,
            speaker: ChatMessage.getSpeaker({token: state.actor, alias: state.actor?.token?.name}),
            content: 'Switched my Pinaka heads to: ' + damageTypeHTML[damageTypeSelect],
        }
        ChatMessage.create(chatData, { chatBubble: true });
        */
    }
}


/**
 * ====================================
 * Additional post activation flow steps
 * ====================================
 */ 

/**
 * Post activation flow step to cleanup any pinaka missile special activation data from flags and items.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow. 
 * @param isContinue Used to determine if the current flow has been canceled or not.
 */
export async function cleanupPinakaMissileActivation(state, options, isContinue) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;
    
    //Delayed attack
    if(state.data.action?.lid === LIDs.pinakaMissileLaaDelayedAttack || state.data.action?.lid === LIDs.pinakaMissileMkiiLaaDelayedAttack) {
        if(!isContinue)
            await removeLastPreparedAttack(state.actor);
    }
    //Pinaka missiles mkii 
    //Swap modular head protocol
    else if(state.data.action?.lid === LIDs.pinakaMissileMkiiLaaSwapHead && checkPinakaUseable(state.item) && state.data.pinaka_head_swap?.current_profile_index) {
        //Switch to old profile as fallback
        if(!isContinue) {
            const profileIndex = state.data.pinaka_head_swap?.current_profile_index ?? 0;
            await state.item.update({"system.active_profile": state.item.system.profiles[profileIndex], "system.selected_profile_index": profileIndex });
        }
    }
    
    return true;
}


/**
 * ====================================
 * Additional activation flow helpers
 * ====================================
 */

/**
 * Checks if the pinaka missile item is the one from this module and if it is still intact.
 * If not it is recommended to just use the one provided with this module.
 * @returns True if the item is useable, false if not.
 */
function checkPinakaUseable(item) {
    if(item?.system?.profiles?.length !== 3) {
        ui.notifications.warn("Cannot automate head swap (Wrong number of profiles). Please use the pinaka missiles mkii item from the advanced automation item compendium!!!");
        return false;
    }
    
    return true;
}


/**
 * ====================================
 * Additional attack flow steps
 * ====================================
 */

/**
 * Attack flow step to initialize some pinaka missile attack data in flow state. Used for pinaka missile delayed attacks which have different damage value or tag data.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
export async function initPinakaMissileAttackData(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;
    
    if(state.item.system.lid === LIDs.pinakaMissile || state.item.system.lid === LIDs.pinakaMissileMkii) {
        ui.notifications.warn("Currently cannot automate pinaka missile functionality with default pinaka missile item! Please use the one from the advanced automation compendium!");
    }
    if(state.item.system.lid === LIDs.pinakaMissileLaa) {
        if(state.data.delayed_attack) {
            state.data.pinaka_missile = { old_damage: state.item.system.active_profile.damage[0].val };
            state.item.system.active_profile.damage[0].val = "3D6";
        }
    }
    if(state.item.system.lid === LIDs.pinakaMissileMkiiLaa) {
        if(state.data.delayed_attack) {
            state.data.pinaka_missile_mkii = { old_tags: state.item.system.active_profile.all_tags };
            state.item.system.active_profile.all_tags.push(await getTagData(LIDs.tags.seeking));
        }
    }
    
    return true;
}

/**
 * Attack flow step to recalculate self heat in case of delayed attacks, as the self heat is already applied during delayed attack activation.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow.
 * @returns True if the flow shall go on, false if the flow has been canceled. 
 */
export async function recalculatePinakaMissileSelfHeat(state, options) {
    if (!state.data) throw new TypeError("Activation flow state missing!");
    if (!state.item) return true;
    
    if(state.item.system.lid === LIDs.pinakaMissileLaa || state.item.system.lid === LIDs.pinakaMissileMkiiLaa) {
        //Remove self heat if delayed attack, as heat is already applied during delayed preparation!
        if(state.data.delayed_attack)
            state.data.self_heat = 0;
    }
    
    return true;
}

/**
 * Post attack flow step to cleanup custom pinaka missile attack data from flags and items.
 * @param state Flow state from the current flow.
 * @param options Flow options from the current flow. 
 * @param isContinue Used to determine if the current flow has been canceled or not.
 */
export async function cleanupPinakaMissileData(state, options, isContinue) {
    if (!state.data) throw new TypeError("Attack flow state missing!");

    if(state.item.system.lid === LIDs.pinakaMissileLaa) {
        if(state.data.pinaka_missile)
            state.item.system.active_profile.damage[0].val = state.data.pinaka_missile.old_damage;
    }
    if(state.item.system.lid === LIDs.pinakaMissileMkiiLaa) {
        if(state.data.pinaka_missile_mkii)
            state.item.system.active_profile.all_tags = state.data.pinaka_missile_mkii.old_tags;
    }
}