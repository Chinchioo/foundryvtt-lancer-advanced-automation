import { moduleID, weaponAttackFlowClass, WeaponSizes, WeaponTypes, LIDs, Flags, Settings } from "../../../global.js";
import { addItemOnceToActorByLID, getItemFromActorByLID, removeItemFromActorByLID } from "../../../automationHelpers/tokenOrActorHelpers.js";
import { addActionResolver, consumedLockOn, hasHit, isSpecialWeaponAttackFlow } from "../attackFlowAdditionHelpers.js";
import { isActiveCombat, isAutomationActive } from "../../../automationHelpers/automationHelpers.js";

const StormbringerRank = {
    torrent: 3,
    stormbending: 2,
    seismicDeluge: 1,
}

/**
 * ====================================
 * Additional attack flow steps
 * ====================================
 */
export async function rollTorrentMissileAttackRolls(state, options) {
    if(state.item.system.lid === LIDs.stormbringerMkiiTorrent) {
        const rollStr = "1d6";
        let targetedAttackRolls = [];

        state.data.hit_results = [];
        state.data.attack_results = [];
        for(const t of state.data.acc_diff.targets) {
            const target = t.target;
            const attack_roll = await new Roll(rollStr).evaluate({ async: true });
            const hit = attack_roll.total >= (state.data.stormbringer_torrent_mk_ii.is_crit ? 4 : 5); //Hit on 4+ if crit on 5+ if no crit.

            targetedAttackRolls.push({ roll: rollStr, target: target, usedLockOn: null });
            state.data.attack_results.push({ roll: attack_roll, tt: await attack_roll.getTooltip() });
            state.data.hit_results.push({
                token: { name: target.name, img: target.actor?.img ?? "" },
                total: String(attack_roll.total).padStart(2, "0"),
                hit: hit, 
                crit: false,
            });
        }
        state.data.attack_rolls = { roll: rollStr, targeted: targetedAttackRolls };
    }

    return true;
}

export async function handlePostFlowStormbringer(state, options, isContinue) {
    if (!state.data) throw new TypeError("Attack flow state missing!");
    
    if(isContinue && state.actor.system.pilot) {
        const stormbringerItem = getItemFromActorByLID(state.actor.system.pilot.value, LIDs.stormbringer);
        const stormbringerMkiiItem = getItemFromActorByLID(state.actor.system.pilot.value, LIDs.stormbringerMkii);

        //Stormbringer Talent Activations
        if(!isSpecialWeaponAttackFlow(state)) {
            //Stormbringer
            if(stormbringerItem) {
                //Switch from highest to lowest rank, as we can do all three this way.
                switch(stormbringerItem.system.curr_rank) {
                    //Torrent
                    case StormbringerRank.torrent:
                        //Nothing to do here!!!
                    //Stormbending
                    case StormbringerRank.stormbending:
                        //Is automation active?
                        if(isAutomationActive(Settings.stormbringerStormbendingAutomation, Settings.stormbringerStormbendingOnlyCombat, state.actor)) {
                            if(await canUseStormbending(state)) {
                                //To give the user the opportunity to later select the order in which to use certain actions!
                                addActionResolver(state, "Stormbending", async (state) => {
                                    if(await useStormbending(state, stormbringerItem) && stormbringerItem.system.curr_rank === 3 && stormbringerItem.system.ranks[2]) {
                                        //Handle Torrent die?
                                        if(game.settings.get(moduleID, Settings.stormbringerTorrentAutomateTorrentDie)) {
                                            const counter = stormbringerItem.system.ranks[2].counters.find((c) => c.lid === LIDs.stormbringerCounter);
                                            if(counter) {
                                                if(counter.value > counter.min)
                                                    counter.value--;
                                                //Update counter item!
                                                await stormbringerItem.update({"system.ranks[2].counters": stormbringerItem.system.ranks[2].counters });                                            
                                                //Post counter chat message!
                                                const chatData = {
                                                    type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
                                                    speaker: ChatMessage.getSpeaker({token: state.actor, alias: state.actor?.token?.name}),
                                                    content: "Torrent Die reduced to: " + counter.value,
                                                    emote: true,
                                                }
                                                await ChatMessage.create(chatData);
                                            }
                                        }
                                    }
                                }, canUseStormbending);
                            }
                        }
                    //Seismic Deluge
                    case StormbringerRank.seismicDeluge:
                        //Is automation active?
                        if(isAutomationActive(Settings.stormbringerSeismicDelugeAutomation, Settings.stormbringerSeismicDelugeOnlyCombat, state.actor)) {
                            if(await canUseSeismicDeluge(state)) {
                                //To give the user the opportunity to later select the order in which to use certain actions!
                                addActionResolver(state, "Seismic Deluge", async (state) => { await useSeismicDeluge(state, stormbringerItem); }, canUseSeismicDeluge);
                            }
                        }
                        break;
                    default:
                        ui.notifications.warn("Stormbringer talent has invalid rank(" + stormbringerItem.system.curr_rank + ")!");
                }
            }

            //Stormbringer MKII
            if(stormbringerMkiiItem) {
                switch(stormbringerMkiiItem.system.curr_rank) {
                    //Torrent
                    case StormbringerRank.torrent:
                        //Is automation active?
                        if(isAutomationActive(Settings.stormbringerTorrentMkiiAutomation, Settings.stormbringerTorrentMkiiOnlyCombat, state.actor)) {
                            if(await canUseTorrent(state)) {
                                //To give the user the opportunity to later select the order in which to use certain actions!
                                addActionResolver(state, "Torrent MKII", async (state) => { await useTorrent(state, stormbringerMkiiItem); }, canUseTorrent);
                            }
                        }
                    //Stormbending
                    case StormbringerRank.stormbending:
                        //Is automation active?
                        if(isAutomationActive(Settings.stormbringerStormbendingAutomation, Settings.stormbringerStormbendingOnlyCombat, state.actor)) {
                            if(await canUseStormbending(state)) {
                                //To give the user the opportunity to later select the order in which to use certain actions!
                                addActionResolver(state, "Stormbending MKII", async (state) => { await useStormbending(state, stormbringerMkiiItem); }, canUseStormbending);
                            }
                        }
                    //Seismic Deluge
                    case StormbringerRank.seismicDeluge:
                        //Is automation active?
                        if(isAutomationActive(Settings.stormbringerSeismicDelugeAutomation, Settings.stormbringerSeismicDelugeOnlyCombat, state.actor)) {
                            if(await canUseSeismicDeluge(state)) {
                                //To give the user the opportunity to later select the order in which to use certain actions!
                                addActionResolver(state, "Seismic Deluge MKII", async (state) => { await useSeismicDeluge(state, stormbringerMkiiItem); }, canUseSeismicDeluge);
                            }
                        }
                        break;
                    default:
                        ui.notifications.warn("Stormbringer talent has invalid rank(" + stormbringerMkiiItem.system.curr_rank + ")!");
                }
            }
        }

        //Stormbringer Massive Attack (Reset torrent die)
        if(game.settings.get(moduleID, Settings.stormbringerTorrentAutomateTorrentDie) && stormbringerItem && state.item.system.lid === LIDs.stormbringerTorrent) {
            const counter = stormbringerItem.system.ranks[2].counters.find((c) => c.lid === LIDs.stormbringerCounter);
            if(counter) {
                counter.value = counter.max;
                //Update counter item!
                await stormbringerItem.update({"system.ranks[2].counters": stormbringerItem.system.ranks[2].counters });                                            
                //Post counter chat message!
                const chatData = {
                    type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
                    speaker: ChatMessage.getSpeaker({token: state.actor, alias: state.actor?.token?.name}),
                    content: "Torrent Die reset to: " + counter.value,
                    emote: true,
                }
                await ChatMessage.create(chatData);
            }
        }
    }
}


/**
 * ====================================
 * Helper functions
 * ====================================
 */

/**
 * Checks if seismice deluge can be used!
 * @param state: The current flow state.
 * @returns True if seismic deluge can be used, false if not.
 */
async function canUseSeismicDeluge(state) {
    return !state.actor.getFlag(moduleID, Flags.stormbringerSeismicDelugeUsed) && state.item.system.active_profile.type === WeaponTypes.launcher && hasHit(state) && consumedLockOn(state);
}

/**
 * Checks if the seismic deluge part can be used and asks the user if he wants to use it.
 * @param state: The current flow state.
 * @param stormbringerItem: The stormbringer item to use seismic deluge on.
 * @returns If the seismic deluge talent was used or not.
 */
async function useSeismicDeluge(state, stormbringerItem) {
    let useSeismicDeluge = false;
    if(canUseSeismicDeluge(state)) {
        try {
            await Dialog.wait({
                title: stormbringerItem.name,
                content: `
                    <div>
                        <h2>You hit with a launcher weapon and consumed lock on!</h2>
                    </div>
                    <div>
                        Do you want to use seismic deluge?
                    </div>`,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "yes",
                        callback: () => { useSeismicDeluge = true;; }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "no",
                        callback: () => { useSeismicDeluge = false; }
                    }
                }
            });
        } catch {
            useSeismicDeluge = false;
        }
        if(useSeismicDeluge) {
            await game.lancer.beginItemChatFlow(stormbringerItem, { rank: 0 }); //Uses index instead of real rank!

            if(game.settings.get(moduleID, Settings.stormbringerSeismicDelugeAutomation) && isActiveCombat(state.actor)) {
                await state.actor.setFlag(moduleID, Flags.stormbringerSeismicDelugeUsed, true);
                await state.actor.setFlag(moduleID, Flags.stormbringerSeismicDelugeRound, game.combat.current.round);
            }
        }
    }
    return useSeismicDeluge;
}

/**
 * Cleans up the seismic deluge flags.
 * Use in case of issues!
 * @param actor: The actor to clean the flags for.
 */
async function cleanupSeismicDelugeFlags(actor) {
    await actor.unsetFlag(moduleID, Flags.stormbringerSeismicDelugeUsed);
    await actor.unsetFlag(moduleID, Flags.stormbringerSeismicDelugeRound);
}

/**
 * Checks if stormbending can be used!
 * @param state: The current flow state.
 * @returns True if stormbending can be used, false if not.
 */
async function canUseStormbending(state) {
    return !state.actor.getFlag(moduleID, Flags.stormbringerStormbendingUsed) && state.item.system.active_profile.type === WeaponTypes.launcher && hasHit(state);
}

/**
 * Checks if the stormbending part can be used and asks the user if he wants to use it.
 * @param state: The current flow state.
 * @param stormbringerItem: The stormbringer item to use stormbending on.
 * @returns If the stormbending talent was used or not.
 */
async function useStormbending(state, stormbringerItem) {
    let useStormbending = false;
    if(canUseStormbending(state)) {
        try {
            await Dialog.wait({
                title: stormbringerItem.name,
                content: `
                    <div>
                        <h2>You hit with a launcher weapon!</h2>
                    </div>
                    <div>
                        Do you want to use stormbending?
                    </div>`,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "yes",
                        callback: () => { useStormbending = true;; }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "no",
                        callback: () => { useStormbending = false; }
                    }
                }
            });
        } catch {
            useStormbending = false;
        }
        if(useStormbending) {
            await game.lancer.beginItemChatFlow(stormbringerItem, { rank: 1 }); //Uses index instead of real rank!

            if(game.settings.get(moduleID, Settings.stormbringerStormbendingAutomation) && isActiveCombat(state.actor)) {
                await state.actor.setFlag(moduleID, Flags.stormbringerStormbendingUsed, true);
                await state.actor.setFlag(moduleID, Flags.stormbringerStormbendingRound, game.combat.current.round);
            }
        }
    }
    return useStormbending;
}

/**
 * Cleans up the stormbending flags.
 * Use in case of issues!
 * @param actor: The actor to clean the flags for.
 */
async function cleanupStormbendingFlags(actor) {
    await actor.unsetFlag(moduleID, Flags.stormbringerStormbendingUsed);
    await actor.unsetFlag(moduleID, Flags.stormbringerStormbendingRound);
}

/**
 * Checks if torrent can be used!
 * @param state: The current flow state.
 * @returns True if torrent can be used, false if not.
 */
async function canUseTorrent(state) {
    return state.item.system.active_profile.type === WeaponTypes.launcher && hasHit(state);
}

/**
 * Checks if the torrent can be used and asks the user if he wants to use it.
 * @param state: The current flow state.
 * @param stormbringerItem: The stormbringer item to use torrent on.
 * @returns If the torrent talent was used or not.
 */
async function useTorrent(state, stormbringerItem) {
    let useTorrent = false;
    if(await canUseTorrent(state)) {
        try {
            await Dialog.wait({
                title: stormbringerItem.name,
                content: `
                    <div>
                        <h2>You hit with a launcher weapon!</h2>
                    </div>
                    <div>
                        Do you want to use torrent?
                    </div>`,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "yes",
                        callback: () => { useTorrent = true;; }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "no",
                        callback: () => { useTorrent = false; }
                    }
                }
            });
        } catch {
            useTorrent = false;
        }
        if(useTorrent) {
            await game.lancer.beginItemChatFlow(stormbringerItem, { rank: 2 }); //Uses index instead of real rank!
            let firstHit = true;
            for(const hitResult of state.data.hit_results) {
                if(hitResult.hit || hitResult.crit) {
                    if(!firstHit) {
                        try {
                            await Dialog.prompt({
                                title: "Torrent",
                                content: `<div>You got another torrent usage!</div>`,
                            });
                        } catch {
                            //Do nothing here!
                        }
                    }
                    firstHit = false;

                    let weaponSize = 0;
                    switch(state.item.system.size) {
                        case WeaponSizes.aux:
                            weaponSize = 0;
                            break;
                        case WeaponSizes.main:
                            weaponSize = 1;
                            break;
                        case WeaponSizes.heavy:
                        case WeaponSizes.superheavy:
                            weaponSize = 2;
                            break;
                        default:
                            weaponSize = 0;
                    }

                    let weaponRange = 5;
                    if(state.item.system.active_profile.range.length > 0)
                        weaponRange = state.item.system.active_profile.range[0].val;

                    await startTorrentMissile(state.actor, weaponSize, weaponRange, hitResult.crit);
                }
            }
        }
    }
    return useTorrent;
}

/**
 * Starts the torrent missile attack.
 * @param actor: The actor for which the torrent attack shall be done.
 * @param weaponSize: The weapon size for the torrent missile attack. (0 = aux | 1 = main | 2 = heavy or larger).
 * @param weaponRange: The range for the torrent missile attack.
 * @param isCrit: If the triggering attack was a crit.
 */
export async function startTorrentMissile(actor, weaponSize, weaponRange, isCrit) {
    //Check if actor already has item, otherwise add it quickly for this usage and remove later again!
    const item = await addItemOnceToActorByLID(actor, LIDs.stormbringerMkiiTorrent);
    if(item) {
        //Switch to given weapon size and range
        await item.update({ "system.profiles[0].range[0].val": weaponRange, "system.profiles[1].range[0].val": weaponRange, "system.profiles[2].range[0].val": weaponRange });
        await item.update({ "system.active_profile": item.system.profiles[weaponSize], "system.selected_profile_index": weaponSize });

        const flow = new weaponAttackFlowClass(item);
        flow.state.data.auto_hit_all = true;
        flow.state.data.is_special_weapon_attack_flow = true;
        flow.state.data.stormbringer_torrent_mk_ii = { is_crit: isCrit };
        console.log("Start torrent missile attack flow");
        await flow.begin();
        console.log("Finished torrent missile attack flow");

        removeItemFromActorByLID(actor, LIDs.stormbringerMkiiTorrent);        
    } else {
        ui.notifications.error("Internal issue, couldn't add item '" + LIDs.stormbringerMkiiTorrent + "' from compendium to actor '" + actor.name + "'");
    }
}

/**
 * Cleans up the stormbringer flags.
 * Use in case of issues!
 * @param actor: The actor to clean the flags for.
 */
export async function cleanupStormbringerFlags(actor) {
    await cleanupSeismicDelugeFlags(actor);
    await cleanupStormbendingFlags(actor);
}


/**
 * ====================================
 * On combat change (Hook Events)
 * ====================================
 */

/**
 * Cleans up the stormbringer flags on combat changes.
 * Should be called within the updateCombat hook for the gm.
 * @param actor: The actor for which the flags shall be cleaned up.
 * @param currentCombatant: The current turns combatant.
 * @param currentRound: The current round after the change.
 */
export async function onCombatUpdateGM(actor, currentCombatant, currentRound) {
    if(actor?.getFlag(moduleID, Flags.stormbringerSeismicDelugeUsed)) {
        if(actor.getFlag(moduleID, Flags.stormbringerSeismicDelugeRound) < currentRound && actor.uuid === currentCombatant?.actor.uuid) {
            await cleanupSeismicDelugeFlags(actor);
        }
    }
    if(actor?.getFlag(moduleID, Flags.stormbringerStormbendingUsed)) {
        if(actor.getFlag(moduleID, Flags.stormbringerStormbendingRound) < currentRound && actor.uuid === currentCombatant?.actor.uuid) {
            await cleanupStormbendingFlags(actor);
        }
    }
}

/**
 * Cleans up the stormbringer flags on combat delete.
 * Should be called within the deleteCombat hook for the gm.
 * @param actor: The actor for which the flags shall be cleaned up.
 */
export async function onCombatDeleteGM(actor) {    
    if(actor?.getFlag(moduleID, Flags.stormbringerSeismicDelugeUsed)) {
        await cleanupSeismicDelugeFlags(actor);
    }
    if(actor?.getFlag(moduleID, Flags.stormbringerStormbendingUsed)) {
        await cleanupStormbendingFlags(actor);
    }
}