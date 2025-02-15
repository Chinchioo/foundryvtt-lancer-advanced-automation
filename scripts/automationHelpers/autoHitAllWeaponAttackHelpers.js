/**
 * Begins an auto hit all weapon attack flow. (Automatically hits all targets without roll!)
 * @param item: Item to start attack flow for.
 * @param isSpecialWeapon: If the given weapon is a fake weapon e.g. avenger silos.
 */
export async function beginAutoHitAllWeaponAttackFlow(item, isSpecialWeapon) {
    const flow = new weaponAttackFlowClass(item);
    flow.state.data.laa = {
        is_auto_hit_all: true,
    };
    if(isSpecialWeapon)
        setIsSpecialWeaponAttackFlow(flow.state);
    console.log("Start auto hit all weapon attack flow");
    await flow.begin();
    console.log("Finished auto hit all weapon attack flow");
}

/**
 * Checks if the given flow state is from a special weapon attack flow. (Attack flow with a fake weapon e.g. avenger silos.)
 * This is needed to don't activate some systems based on these attacks.
 * @param state: The current flow state.
 * @returns True if this is a special weapon attack flow, false if not.
 */
export function isAutoHitAllWeaponAttackFlow(state) {
    return state.data.laa?.is_auto_hit_all;
}

/**
 * Sets rolled attack data for an auto hit all weapon attack flow.
 * @param state The current flow state.
 */
export async function autoHitAllRollAttack(state) {
    const rollStr = "9000";
    const attack_roll = await new Roll(rollStr).evaluate({ async: true });
    const attack_roll_tt = await attack_roll.getTooltip();
    let targetedAttackRolls = [];
    state.data.hit_results = [];
    state.data.attack_results = [];
    for(const t of state.data.acc_diff.targets) {
        const target = t.target;
        targetedAttackRolls.push({ roll: rollStr, target: target, usedLockOn: null });            
        state.data.attack_results.push({ roll: attack_roll, tt: attack_roll_tt, });
        state.data.hit_results.push({
            target: target,
            total: "--",
            usedLockOn: null,
            hit: true,
            crit: false,
       });
    }
    state.data.attack_rolls = { roll: rollStr, targeted: targetedAttackRolls };
}