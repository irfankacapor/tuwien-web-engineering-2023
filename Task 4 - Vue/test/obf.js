export function cartDescription(product) {
  const _0x16dd = ['4483BlRamm', '\x20cm\x20', '316788IDKuxI', '1229aJsgnT', '4oItBud', '59791MgySrq', 'Large', '\x20print', '1WqdlgC', '51902IDgwrm', '\x20mat.', '\x20frame', 'matColor', 'matWidth', '1XzmiZz', '271196mWaNdK', '\x20with\x20a\x20', 'in\x20a\x20', '264808IiykCI', 'printSize']; const _0x551a = function (_0x3024c9, _0x7a4a7d) { _0x3024c9 = _0x3024c9 - 0x17a; let _0x16dd65 = _0x16dd[_0x3024c9]; return _0x16dd65; }; const _0x162fa0 = _0x551a; (function (_0x14bd8e, _0x486f08) { const _0x4345be = _0x551a; while (!![]) { try { const _0x53db11 = -parseInt(_0x4345be(0x184)) + -parseInt(_0x4345be(0x186)) + parseInt(_0x4345be(0x18b)) * parseInt(_0x4345be(0x180)) + parseInt(_0x4345be(0x188)) + parseInt(_0x4345be(0x18a)) * -parseInt(_0x4345be(0x17b)) + -parseInt(_0x4345be(0x17a)) * -parseInt(_0x4345be(0x189)) + parseInt(_0x4345be(0x181)); if (_0x53db11 === _0x486f08) break; else _0x14bd8e['push'](_0x14bd8e['shift']()); } catch (_0x3aa591) { _0x14bd8e['push'](_0x14bd8e['shift']()); } } }(_0x16dd, 0x2a049)); const prettySize = { 'S': 'Small', 'M': 'Medium', 'L': _0x162fa0(0x18c) }, printText = prettySize[product[_0x162fa0(0x185)]] + _0x162fa0(0x18d), frameText = _0x162fa0(0x183) + product['frameWidth'] / 0xa + _0x162fa0(0x187) + product['frameStyle'] + _0x162fa0(0x17d), matText = product[_0x162fa0(0x17f)] > 0x0 ? _0x162fa0(0x182) + product['matWidth'] / 0xa + '\x20cm\x20' + product[_0x162fa0(0x17e)] + _0x162fa0(0x17c) : '.'; return printText + '\x20' + frameText + matText;
}

export function calculatePrice(printSize, frameCost, frameWidth, matWidth) {
  const _0x4160 = ['40157hrqwiE', '4411pNuVNq', '384491jKvQvO', '58LvZAUB', '1yJopem', '5577JtvHoU', '1YwKoEi', '255853JVtlup', '209524jbcPUh', '53981lLyOuD']; function _0x5d32(_0x320821, _0x945b7d) { _0x320821 = _0x320821 - 0x13b; let _0x4160e5 = _0x4160[_0x320821]; return _0x4160e5; } (function (_0x1fb981, _0x1ec91a) { const _0x567afe = _0x5d32; while (!![]) { try { const _0xc1bdec = parseInt(_0x567afe(0x142)) + -parseInt(_0x567afe(0x13c)) * parseInt(_0x567afe(0x13e)) + -parseInt(_0x567afe(0x144)) * parseInt(_0x567afe(0x13f)) + -parseInt(_0x567afe(0x143)) + parseInt(_0x567afe(0x13b)) + parseInt(_0x567afe(0x140)) + -parseInt(_0x567afe(0x141)) * -parseInt(_0x567afe(0x13d)); if (_0xc1bdec === _0x1ec91a) break; else _0x1fb981['push'](_0x1fb981['shift']()); } catch (_0x9e524c) { _0x1fb981['push'](_0x1fb981['shift']()); } } }(_0x4160, 0x28b4f)); const sizeMultiplier = { 'S': 0x1, 'M': 0x2, 'L': 0x3 }; return (0xdac + frameCost * frameWidth + 0x5 * matWidth) * sizeMultiplier[printSize];
}

