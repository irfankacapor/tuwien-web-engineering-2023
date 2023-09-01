import { Chance } from 'chance';
import path from 'path';
import cwd from 'cwd';

const absChanceMixinPath = path.resolve(path.join(cwd(), 'test'), 'chance.mixin.js');
const chanceMixin = require(absChanceMixinPath);

export function createChance(seed) {
  return new Chance(seed).mixin(chanceMixin);
}
