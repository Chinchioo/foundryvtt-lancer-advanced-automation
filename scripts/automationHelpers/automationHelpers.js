import { LIDs, moduleID } from "../global.js";

/**
 * Returns tag data based on given lid.
 * The tag data is stored in an item within this modules compendium.
 * @param searchTagLID: The LID for the tag which data you want.
 * @returns The tag data for the given lid. Null if nothing found.
 */
export async function getTagData(searchTagLID) {
    const tagItem = await game.lancer.fromLid(LIDs.tagItem);
    for(const tag of tagItem.system.all_tags) {
        if(tag.lid === searchTagLID)
            return tag;
    }
    return null;
}

/**
 * Waits the given amount of time.
 * @param ms: Milliseconds to wait.
 */
export async function wait(ms) {
    return await new Promise((resolve)=> setTimeout(resolve, ms));
}

/**
 * Checks if there is currently an active combat which the given actor belongs to.
 * @param actor: The actor to check active combats for.
 * @returns True if there is currently an active combat with the given actor, false if not.
 */
export function isActiveCombat(actor) {
    return (game.combat?.started ?? false) && actor.inCombat && ((game.combat?.turns?.filter((c) => c.actor.uuid === actor.uuid) ?? []).length > 0);
}

/**
 * Checks if the given item has a ranged attack.
 * @param item: The item to check.
 * @returns True if the item has ranged attacks, false if not.
 */
export function isRangedAttack(item) {
    return item.system.active_profile.range.some(r => r.type !== "Threat");
}

/**
 * Checks based on the given parameters (which should be game/user settings) if automation is active and if automation shall only be active during combat if also combat is active.
 * @param isAutomationActiveSetting: Setting string to the isAutomationActive setting.
 * @param isAutomationOnlyCombatSetting: Setting string to the isAutomationOnlyCombat setting.
 * @param actor: The actor for which combat active shall be checked.
 */
export function isAutomationActive(isAutomationActiveSetting, isAutomationOnlyCombatSetting, actor) {
    const isAutomationActive = game.settings.get(moduleID, isAutomationActiveSetting);
    const isAutomationOnlyCombat = game.settings.get(moduleID, isAutomationOnlyCombatSetting);

    return isAutomationActive && (!isAutomationOnlyCombat || (isAutomationOnlyCombat && isActiveCombat(actor)));
}

/**
 * Streamlines simple yes/no questions to the user.
 * @param title: The tile for the message.
 * @param header: The header for the message.
 * @param message: The message.
 * @returns True if the user selected yes, false if the user selected no.
 */
export async function simpleYesNoQuestion(title, header, message) {
    let answer = false;
    try {
        await Dialog.wait({
            title: title,
            content: `
                <div>
                    <h2>` + header + `</h2>
                </div>
                <div>`
                    + message +
                `</div>`,
            buttons: {
                yes: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "yes",
                    callback: () => { answer = true; }
                },
                no: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "no",
                    callback: () => { answer = false; }
                }
            }
        });
    } catch {
        answer = false;
    }

    return answer;
}

/**
 * Posts a simple chat message!
 * @param actor: The actor for which the message shall be posted.
 * @param content: The conten for the message.
 */
export async function simpleChatMessage(actor, content) {
    const chatData = {
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        speaker: {
            actor: actor,
            token: actor?.token,
            alias: !!actor?.token ? actor.token.name : null,
        },
        content: content,
    }
    await ChatMessage.create(chatData);
}

/**
 * Posts a simple roll chat message!
 * @param actor: The actor for which the message shall be posted.
 * @param roll: The roll instance for which the message shall be posted.
 * @param title: The title for the chat message.
 * @param description: The description for the chat message.
 */
export async function simpleRollChatMessage(actor, roll, title, description) {
    const html = await renderTemplate(`systems/${game.system.id}/templates/chat/generic-card.hbs`,
        {
            title: title,
            description: description,
            roll,
            roll_tt: await roll.getTooltip(),
        });
    const chatData = {
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll: roll,
        speaker: {
            actor: actor,
            token: actor?.token,
            alias: !!actor?.token ? actor.token.name : null,
        },
        content: html,
    }
    await ChatMessage.create(chatData);
}