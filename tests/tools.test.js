import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOOLS,
  TOOL_INFO,
  nextTool,
  toolInfo,
  inSuction,
  suctionStrength,
  gatherDone,
  GATHER_SECONDS,
  SUCTION_RANGE,
} from '../src/game/tools.js';
import { CONTROL_LEGENDS, legendFor } from '../src/game/controls.js';

test('the two tools switch back and forth and never get stuck', () => {
  assert.deepEqual(TOOLS, ['bolt', 'whisk']);
  assert.equal(nextTool('bolt'), 'whisk');
  assert.equal(nextTool('whisk'), 'bolt');
  assert.equal(nextTool(nextTool('whisk')), 'whisk');
  assert.ok(nextTool('something-else') === 'whisk', 'an unknown tool still resolves to a real one');
});

test('each tool has a name, an icon and a spoken line', () => {
  for (const tool of TOOLS) {
    const info = toolInfo(tool);
    assert.equal(info, TOOL_INFO[tool]);
    assert.ok(info.icon.length > 0);
    assert.ok(info.name.length > 2);
    assert.match(info.line, /\.$/, 'a line is a full spoken sentence');
  }
  assert.equal(toolInfo('nope'), TOOL_INFO.bolt, 'unknown tools fall back to the Starbolt');
});

test('the intake cone is generous in front and refuses what is far behind', () => {
  const origin = { x: 0, y: 0, z: 0 };
  const forward = { x: 0, y: 0, z: -1 };
  assert.equal(inSuction({ x: 0, y: 0, z: -3 }, origin, forward), true, 'straight ahead');
  assert.equal(inSuction({ x: 1.2, y: 0.4, z: -3 }, origin, forward), true, 'a little to the side still counts');
  assert.equal(inSuction({ x: 0, y: 0, z: 3 }, origin, forward), false, 'far behind is not pulled');
  assert.equal(inSuction({ x: 0, y: 0, z: 0.6 }, origin, forward), true, 'right at the mouth is always in');
  assert.equal(inSuction({ x: 0, y: 0, z: -SUCTION_RANGE - 1 }, origin, forward), false, 'out of reach is out');
  assert.equal(inSuction({ x: 6, y: 0, z: -1 }, origin, forward), false, 'wide to the side is out');
});

test('suction is strongest at the mouth and fades to nothing at the edge', () => {
  assert.equal(suctionStrength(0), 1);
  assert.equal(suctionStrength(SUCTION_RANGE), 0);
  assert.ok(suctionStrength(1) > suctionStrength(3));
  assert.ok(suctionStrength(3) > suctionStrength(6));
  assert.equal(suctionStrength(SUCTION_RANGE + 2), 0);
});

test('gathering finishes after a short hold and not before', () => {
  assert.equal(gatherDone(0), false);
  assert.equal(gatherDone(GATHER_SECONDS - 0.01), false);
  assert.equal(gatherDone(GATHER_SECONDS), true);
  assert.equal(gatherDone(9), true);
});

test('every device has a discoverable way to switch tools', () => {
  for (const [id, legend] of Object.entries(CONTROL_LEGENDS)) {
    assert.ok(legend.tool, `${id} names a tool switch`);
    const short = legend.short.toLowerCase();
    assert.ok(short.includes('tool'), `${id} legend mentions the tool switch`);
  }
  assert.equal(legendFor('keyboard').tool, 'Q');
  assert.equal(legendFor('mouse').tool, 'right-click');
  assert.equal(legendFor('gamepad').tool, 'B');
  assert.match(legendFor('touch').tool, /tool/);
});
