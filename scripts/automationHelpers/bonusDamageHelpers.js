/**
 * Adds bonus damage to the current attack flow state.
 * @param state The state to add the damage for.
 * @param damageType: The damage type of the bonus damage. 
 * @param damageRoll: The damage roll string.
 */
export function addBonusDamageToDamageRoll(state, damageType, damageRoll) {
    state.data.bonus_damage.push({ type: damageType, val: damageRoll });
}