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