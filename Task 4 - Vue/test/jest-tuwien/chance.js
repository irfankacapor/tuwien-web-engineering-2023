import { Chance } from 'chance';
import { chanceMixin } from '../chance.mixin.js';

export function createChance(seed) {
  return new Chance(seed).mixin(chanceMixin);
}
