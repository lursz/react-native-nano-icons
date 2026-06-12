/** @jest-environment node */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as plist from 'plist';

jest.mock('xcode', () => ({
  project: () => ({
    parseSync() {
      return this;
    },
    getFirstTarget: () => ({ uuid: 'fake-target-uuid' }),
    addBuildPhase: () => {},
    writeSync: () => '// fake pbxproj',
    hash: { project: { objects: {} } },
  }),
}));

import { linkBare } from '../cli/link';
import type { NanoLogger } from '../cli/logger';
import type { BuiltFont } from '../cli/build';

const MINIMAL_PLIST = plist.build({ CFBundleName: 'placeholder' });

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nano-link-'));
}

function makeLogger(): NanoLogger {
  return {
    start: jest.fn(),
    update: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

function readUIAppFonts(plistPath: string): string[] {
  const parsed = plist.parse(fs.readFileSync(plistPath, 'utf8')) as Record<
    string,
    unknown
  >;
  return Array.isArray(parsed['UIAppFonts'])
    ? (parsed['UIAppFonts'] as string[])
    : [];
}

describe('linkBare — iOS Info.plist target selection', () => {
  let projectRoot: string;
  let fontDir: string;

  beforeEach(() => {
    projectRoot = makeTmpDir();
    fontDir = makeTmpDir();

    const iosDir = path.join(projectRoot, 'ios');
    fs.mkdirSync(iosDir);

    // decoy - alphabetically-first, should be ignored
    fs.mkdirSync(path.join(iosDir, 'AppExtension'));
    fs.writeFileSync(
      path.join(iosDir, 'AppExtension', 'Info.plist'),
      MINIMAL_PLIST
    );

    // Main app target
    fs.mkdirSync(path.join(iosDir, 'MyApp'));
    fs.writeFileSync(path.join(iosDir, 'MyApp', 'Info.plist'), MINIMAL_PLIST);

    // real target via Info.plist
    fs.mkdirSync(path.join(iosDir, 'MyApp.xcodeproj'));
    fs.writeFileSync(
      path.join(iosDir, 'MyApp.xcodeproj', 'project.pbxproj'),
      '// fake pbxproj'
    );

    fs.writeFileSync(path.join(fontDir, 'TestFont.ttf'), 'fake-ttf');
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
    fs.rmSync(fontDir, { recursive: true, force: true });
  });

  test('updates the main app Info.plist, not the alphabetically-first sibling', async () => {
    const builtFont: BuiltFont = {
      fontFamily: 'TestFont',
      ttfPath: path.join(fontDir, 'TestFont.ttf'),
      glyphmapPath: path.join(fontDir, 'TestFont.glyphmap.json'),
      linking: 'static',
    };

    await linkBare(projectRoot, [builtFont], makeLogger());

    const mainPlist = path.join(projectRoot, 'ios', 'MyApp', 'Info.plist');
    const decoyPlist = path.join(
      projectRoot,
      'ios',
      'AppExtension',
      'Info.plist'
    );

    expect(readUIAppFonts(mainPlist)).toContain('TestFont.ttf');
    expect(readUIAppFonts(decoyPlist)).not.toContain('TestFont.ttf');
    expect(readUIAppFonts(decoyPlist)).toEqual([]);
  });
});
