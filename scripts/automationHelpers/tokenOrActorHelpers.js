/**
 * ====================================
 * Token or Actor Helpers
 * ====================================
 */

/**
 * Checks if the current user has a controlled token on the scene.
 * If yes returns it, if no throws warn message.
 * @returns The controlled token or null if none is controlled.
 */
export function hasControlledToken() {
    if(canvas.tokens.controlled.length < 1) {
        ui.notifications.warn("Select a token!");
        return null;
    }
    return canvas.tokens.controlled[0];
}

/**
 * Checks if given actor has given item, if not quickly adds given item to actor.
 * @param actor: The actor for which the item shall be searched or added.
 * @param itemLID: The item lid to determine the item.
 * @returns The found or added item.
 */
export async function addItemOnceToActorByLID(actor, itemLID) {
    //Check if actor already has item, otherwise add it quickly!
    let item = getItemFromActorByLID(actor, itemLID);
    if(!item) {
        const divinePunishmentWeapon = await game.lancer.fromLid(itemLID);
        const result = await actor.quickOwn(divinePunishmentWeapon);
        if(result[1])
            item = result[0];
    }
    return item;
}

/**
 * Removes the given item from the given actor.
 * @param actor: The actor from which the item shall be removed.
 * @param itemLID: The item lid to remove item from the actor.
 */
export function removeItemFromActorByLID(actor, itemLID) {
    const item = getItemFromActorByLID(actor, itemLID);
    actor.removeClassFeatures(item);
    item?.delete();
}

/**
 * Checks if actor has an item with the given lid and returns the first instance of it.
 * @param actor: The actor to check.
 * @param lid: The lid of the item to find.
 * @returns The found item or null.
 */
export function getItemFromActorByLID(actor, lid) {
    const items = getItemsFromActorByLID(actor, lid);
    return items ? items[0] : null;
}

/**
 * Checks if actor has an item with the given lid and returns all instances of it.
 * @param actor: The actor to check.
 * @param lid: The lid of the item to find.
 * @returns The found item list or null.
 */
export function getItemsFromActorByLID(actor, lid) {
    let items = actor.items.filter(
        i => i.system.lid === lid
    );
    
    return items?.length > 0 ? items : null;
}

/**
 * Checks if actor has an item with the given lid.
 * @param actor: The actor to check.
 * @param lid: The lid of the item to find.
 * @returns Boolean, true if actor has item, false if actor hasn't.
 */
export function hasActorItemByLID(actor, lid) {
    return getItemFromActorByLID(actor, lid) ? true : false;
}

/**
 * Checks if actor has an item with the given id and returns the first instance of it.
 * @param actor: The actor to check.
 * @param id: The lid of the item to find.
 * @returns The found item or null.
 */
export function getItemFromActorByID(actor, id) {
    const items = getItemsFromActorByID(actor, id);
    return items ? items[0] : null;
}

/**
 * Checks if actor has an item with the given id and returns all instances of it.
 * @param actor: The actor to check.
 * @param id: The id of the item to find.
 * @returns The found item list or null.
 */
export function getItemsFromActorByID(actor, id) {
    let items = actor.items.filter(
        i => i.id === id
    );
    
    return items?.length > 0 ? items : null;
}

/**
 * Checks if actor has an item with the given id.
 * @param actor: The actor to check.
 * @param id: The id of the item to find.
 * @returns Boolean, true if actor has item, false if actor hasn't.
 */
export function hasActorItemByID(actor, id) {
    return getItemFromActorByID(actor, id) ? true : false;
}

/**
 * Searches for pinaka missile items on the given actor. If more than one are found the user can select which one to use.
 * @param actor: The actor to search.
 * @returns The selected pinaka missile object, or null if none was found/selected.
 */
export async function getPinakaMissilesFromActor(actor) {
    //Get pinaka weapons from the actor!
    let pinakas = getItemFromActorByLID(actor, "lmkii_pinaka_missiles_mk_two");

    //Check that there is at least one pinakas on the mech.
    if(pinakas.length <= 0) {
        ui.notifications.error("Put pinakas on your fucking mech you moron!!!");
        return null;
    }
    //Check if there are somehow too many pinakas on the mech.
    if(pinakas.length > 1) {
        let messageFirstPart = '<div><h2>THE HECK!!!</br>How did you get two or more Pinakas. Select one of them to use!</h2></div><div><select name="pinakaSelect">';
        let messageSecondPart = '';
        for(let i = 0; i < pinakas.length; i++) {
            messageSecondPart = messageSecondPart + '<option value="' + i + '">' + pinakas[i].name + '</option>';
        }
        let messageThirdPart = '</select></div><br/>';
            
        //Find out which pinaka they wanna select
        let pinakaSelect = 0;
        try {
            pinakaSelect = await Dialog.prompt({
                title: 'Pinaka Selector',
                content: messageFirstPart + messageSecondPart + messageThirdPart,
                callback: async(html) => {
                    let pinakaSelect = html.find('[name="pinakaSelect"]').val();
                    return pinakaSelect;
                }
            });
        } catch {
            ui.notifications.warn("Pinaka Head Swap Canceled!");
            return null;
        }
        pinakas = pinakas[pinakaSelect];
    } else {
        pinakas = pinakas[0];
    }
    
    return pinakas;
}